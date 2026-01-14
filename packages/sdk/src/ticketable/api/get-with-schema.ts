import * as Sentry from "@sentry/browser";
import type * as z from "zod";
import type { ApiClient, ApiResponse } from "../../api";

export function getWithSchema<TReturn, TArgs extends object, TParams = undefined>(
  client: ApiClient,
  returnSchema: z.ZodSchema<TReturn>,
  urlBuilder: (args: TArgs) => string,
  paramSchema?: z.ZodSchema<TParams>,
): TParams extends undefined
  ? (args: TArgs) => Promise<ApiResponse<TReturn>>
  : (args: TArgs, params?: TParams) => Promise<ApiResponse<TReturn>> {
  const fn = async (args: TArgs, params?: TParams) => {
    // Build URL
    const baseUrl = urlBuilder(args);

    // Validate and parse params with Zod if provided
    let queryString = "";
    if (paramSchema && params) {
      const validatedParams = paramSchema.parse(params);
      queryString = `?${new URLSearchParams(validatedParams as Record<string, string>).toString()}`;
    }

    const fullUrl = `${baseUrl}${queryString}`;
    const response = await client.get<unknown>(fullUrl);

    if (!response.success || !response.data) {
      return response as ApiResponse<TReturn>;
    }

    const parsed = returnSchema.safeParse(response.data);

    if (!parsed.success) {
      Sentry.captureException(parsed.error);
      return {
        ...response,
        success: false,
        error: "Invalid response format",
        data: undefined,
      };
    }

    return {
      ...response,
      data: parsed.data,
    };
  };
  // biome-ignore lint/suspicious/noExplicitAny: fn can literally be any function
  return fn as any;
}
