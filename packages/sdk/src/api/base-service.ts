import * as Sentry from "@sentry/browser";
import type { ApiClient, ApiResponse } from "./client";
import { SchemaValidationErrorSchema, type SchemaValidationError } from "./shared";
import { createLogger, type Logger } from "../logger";

export type CommonErrors = ["connection_failed", null] | ["schema_validation_error", SchemaValidationError];

export type ServiceResult<TSuccess, TError extends string = never> =
  | CommonErrors
  | (TError extends never ? never : [TError, { error_identifier: string; [key: string]: unknown }])
  | [null, TSuccess];

export abstract class BaseService {
  protected logger: Logger;

  constructor(
    protected client: ApiClient,
    serviceName: string,
  ) {
    this.logger = createLogger(serviceName);
  }

  protected handleResponse<T>(
    response: ApiResponse<unknown>,
    handler: () => T,
  ): T | ["connection_failed", null] | ["schema_validation_error", SchemaValidationError] {
    if (response.connectionError) {
      return ["connection_failed", null];
    }

    try {
      return handler();
    } catch (error) {
      this.logger.error("Schema validation error", error);
      Sentry.captureException(error);
      return ["schema_validation_error", SchemaValidationErrorSchema.parse(response.data)];
    }
  }

  protected buildAuthHeaders(headers: Record<string, string | undefined>): HeadersInit | undefined {
    const filtered = Object.entries(headers).reduce(
      (acc, [key, value]) => {
        if (value !== undefined) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>,
    );

    return Object.keys(filtered).length > 0 ? filtered : undefined;
  }
}
