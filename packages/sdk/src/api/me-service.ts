import * as z from "zod";
import type { ApiResponse, QueryParams } from "./base-client";
import { BaseService, type CommonErrors } from "./base-service";
import { type ApiError, type ApiErrorIdentifier, ApiErrorSchema, type Page, PaginationSchema } from "./shared";

/** Base path of the signed-in user's V2 resources. */
export const ME_PATH = "/api/v2/me";

/**
 * Result of a `/api/v2/me` call. A V2 error comes back as its identifier plus the error envelope,
 * whose `details` name the offending fields.
 */
export type MeResult<T> =
  | CommonErrors
  | ["missing_id_token", null]
  | ["invalid_response", null]
  | [ApiErrorIdentifier, ApiError]
  | [null, T];

/** Filter values are matched with the `eq` operator; `undefined`/`null` values are left out. */
export type MeFilters = Record<string, string | number | boolean | null | undefined>;

export interface MeListQuery {
  page?: number;
  perPage?: number;
  /** A sortable field, prefixed with `-` for descending order. */
  sort?: string;
  filters?: MeFilters;
}

type WriteMethod = "POST" | "PATCH" | "DELETE";
type Parsed<T> = { data: T } | { error: z.ZodError };

const RecordEnvelopeSchema = z.looseObject({ record: z.unknown() });
const CollectionEnvelopeSchema = z.looseObject({
  records: z.array(z.unknown()),
  meta: z.looseObject({ pagination: PaginationSchema }),
});
const UnpaginatedEnvelopeSchema = z.looseObject({ records: z.array(z.unknown()) });

const STATUS_IDENTIFIERS: Record<number, ApiErrorIdentifier> = {
  400: "bad_request",
  401: "unauthorized",
  403: "forbidden",
  404: "not_found",
  409: "conflict",
  422: "unprocessable_content",
  429: "rate_limited",
};

/** Builds the `sort` parameter from a field and a direction. */
export function sortParam(field?: string, direction?: "asc" | "desc"): string | undefined {
  if (!field) return undefined;
  return direction === "desc" ? `-${field}` : field;
}

/**
 * Base for services on `/api/v2/me`: unwraps the V2 envelope (`record`, `records` + `meta.pagination`),
 * wraps write bodies in `payload`, and maps V2 errors onto the result tuple.
 */
export abstract class MeService extends BaseService {
  protected async fetchPage<T>(path: string, itemSchema: z.ZodType<T>, query: MeListQuery = {}): Promise<MeResult<Page<T>>> {
    return this.request("GET", path, { params: this.listParams(query) }, (data) => {
      const envelope = CollectionEnvelopeSchema.safeParse(data);
      if (!envelope.success) return { error: envelope.error };

      return { data: { records: this.parseItems(envelope.data.records, itemSchema, path), pagination: envelope.data.meta.pagination } };
    });
  }

  /** A collection the API renders whole, without `meta.pagination`. */
  protected async fetchAll<T>(path: string, itemSchema: z.ZodType<T>): Promise<MeResult<T[]>> {
    return this.request("GET", path, {}, (data) => {
      const envelope = UnpaginatedEnvelopeSchema.safeParse(data);
      if (!envelope.success) return { error: envelope.error };

      return { data: this.parseItems(envelope.data.records, itemSchema, path) };
    });
  }

  protected async fetchRecord<T>(path: string, schema: z.ZodType<T>): Promise<MeResult<T>> {
    return this.request("GET", path, {}, (data) => this.parseRecord(data, schema));
  }

  /** `payload` is sent as `{ payload }`, e.g. `{ data: { first_name: "Ada" } }`. DELETE sends no body. */
  protected async write<T>(method: WriteMethod, path: string, schema: z.ZodType<T>, payload?: object): Promise<MeResult<T>> {
    return this.request(method, path, { body: payload === undefined ? {} : { payload } }, (data) => this.parseRecord(data, schema));
  }

  protected listParams({ page, perPage, sort, filters = {} }: MeListQuery): QueryParams {
    const params: QueryParams = { page, per_page: perPage, sort };
    for (const [field, value] of Object.entries(filters)) {
      params[`filter[${field}][eq]`] = value;
    }
    return params;
  }

  private parseRecord<T>(data: unknown, schema: z.ZodType<T>): Parsed<T> {
    const envelope = RecordEnvelopeSchema.safeParse(data);
    if (!envelope.success) return { error: envelope.error };

    const record = schema.safeParse(envelope.data.record);
    return record.success ? { data: record.data } : { error: record.error };
  }

  /** One malformed record must not hide the rest of the page, so invalid items are reported and skipped. */
  private parseItems<T>(items: unknown[], itemSchema: z.ZodType<T>, path: string): T[] {
    return items.flatMap((item) => {
      const parsed = itemSchema.safeParse(item);
      if (parsed.success) return [parsed.data];

      this.logger.error(`Skipping invalid record from ${path}`, parsed.error);
      this.errorReporter.captureException(parsed.error, { endpoint: `${ME_PATH}${path}` });
      return [];
    });
  }

  private async request<T>(
    method: "GET" | WriteMethod,
    path: string,
    { params, body }: { params?: QueryParams; body?: object },
    parse: (data: unknown) => Parsed<T>,
  ): Promise<MeResult<T>> {
    const idToken = await this.getIdToken();
    if (!idToken) {
      return ["missing_id_token", null];
    }

    const endpoint = `${ME_PATH}${path}`;
    const headers = this.buildAuthHeaders({ "X-ID-Token": idToken });
    const response = await this.send(method, endpoint, headers, params, body);

    return this.handleResponse(response, (): MeResult<T> => {
      if (!response.success) {
        return this.errorResult(response);
      }

      const parsed = parse(response.data);
      if ("error" in parsed) {
        this.logger.error(`Invalid response from ${endpoint}`, parsed.error);
        this.errorReporter.captureException(parsed.error, { endpoint });
        return ["invalid_response", null];
      }

      return [null, parsed.data];
    });
  }

  private send(
    method: "GET" | WriteMethod,
    endpoint: string,
    headers: HeadersInit | undefined,
    params?: QueryParams,
    body?: object,
  ): Promise<ApiResponse<unknown>> {
    switch (method) {
      case "GET":
        return this.client.get<unknown>(endpoint, headers, params);
      case "POST":
        return this.client.post<unknown>(endpoint, body ?? {}, headers);
      case "PATCH":
        return this.client.patch<unknown>(endpoint, body ?? {}, headers);
      case "DELETE":
        return this.client.delete<unknown>(endpoint, headers);
    }
  }

  /** A body that isn't a V2 envelope (a proxy's 502, an HTML error page) still gets an identifier from its status. */
  private errorResult(response: ApiResponse<unknown>): [ApiErrorIdentifier, ApiError] {
    const parsed = ApiErrorSchema.safeParse(response.data);
    if (parsed.success) {
      return [parsed.data.identifier, parsed.data];
    }

    const identifier = STATUS_IDENTIFIERS[response.status] ?? "internal_error";
    return [identifier, { identifier, details: [] }];
  }
}
