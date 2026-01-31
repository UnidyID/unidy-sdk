import * as z from "zod";
import type { ApiResponse, QueryParams } from "./base-client";
import { type SchemaValidationError, SchemaValidationErrorSchema } from "./shared";

/**
 * Minimal logger interface that services depend on
 */
export interface Logger {
  // biome-ignore lint/suspicious/noExplicitAny: Logger accepts any args
  error: (...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: Logger accepts any args
  warn: (...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: Logger accepts any args
  info: (...args: any[]) => void;
  // biome-ignore lint/suspicious/noExplicitAny: Logger accepts any args
  debug: (...args: any[]) => void;
}

/**
 * Error reporter interface for capturing exceptions
 */
export interface ErrorReporter {
  captureException: (error: unknown, context?: Record<string, unknown>) => void;
}

/**
 * Dependencies that can be injected into services
 */
export interface ServiceDependencies {
  /** Logger instance - defaults to console */
  logger?: Logger;
  /** Error reporter (e.g., Sentry) - defaults to no-op */
  errorReporter?: ErrorReporter;
  /** Get the current ID token for authenticated requests */
  getIdToken?: () => Promise<string | null>;
  /** Get the current locale for i18n */
  getLocale?: () => string;
}

// Helper types for unified method interfaces
export type Payload<T> = { payload: T };
export type Options<T> = { options?: Partial<T> };

/**
 * API Client interface that services depend on
 */
export interface ApiClientInterface {
  baseUrl: string;
  api_key: string;
  get<T>(endpoint: string, headers?: HeadersInit, params?: QueryParams): Promise<ApiResponse<T>>;
  post<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>>;
  patch<T>(endpoint: string, body: object, headers?: HeadersInit): Promise<ApiResponse<T>>;
  delete<T>(endpoint: string, headers?: HeadersInit): Promise<ApiResponse<T>>;
}

export type CommonErrors = ["connection_failed", null] | ["schema_validation_error", SchemaValidationError] | ["internal_error", null];

export type ServiceResult<TSuccess, TError extends string = never> =
  | CommonErrors
  | (TError extends never ? never : [TError, { error_identifier: string; [key: string]: unknown }])
  | [null, TSuccess];

/** Default no-op error reporter */
const noopErrorReporter: ErrorReporter = {
  captureException: () => {},
};

export abstract class BaseService {
  protected logger: Logger;
  protected errorReporter: ErrorReporter;
  protected getIdToken: () => Promise<string | null>;
  protected getLocale: () => string;

  constructor(
    protected client: ApiClientInterface,
    serviceName: string,
    deps?: ServiceDependencies,
  ) {
    // Use injected dependencies or defaults
    this.errorReporter = deps?.errorReporter ?? noopErrorReporter;
    this.getIdToken = deps?.getIdToken ?? (async () => null);
    this.getLocale = deps?.getLocale ?? (() => "en");

    // Use injected logger or create a prefixed console logger
    this.logger = deps?.logger ?? {
      error: (...args) => console.error(`[${serviceName}]`, ...args),
      warn: (...args) => console.warn(`[${serviceName}]`, ...args),
      info: (...args) => console.info(`[${serviceName}]`, ...args),
      debug: (...args) => console.debug(`[${serviceName}]`, ...args),
    };
  }

  protected handleResponse<T>(
    response: ApiResponse<unknown>,
    handler: () => T,
  ): T | ["connection_failed", null] | ["schema_validation_error", SchemaValidationError] | ["internal_error", null] {
    if (response.connectionError) {
      return ["connection_failed", null];
    }

    try {
      return handler();
    } catch (error) {
      // Only treat Zod errors as schema validation errors
      if (error instanceof z.ZodError) {
        this.logger.error("Schema validation error", error);
        this.errorReporter.captureException(error);
        // Use safeParse to avoid throwing if response.data doesn't match the schema
        const parsed = SchemaValidationErrorSchema.safeParse(response.data);
        const schemaError: SchemaValidationError = parsed.success
          ? parsed.data
          : { error_identifier: "schema_validation_error", errors: [String(error)] };
        return ["schema_validation_error", schemaError];
      }

      // Non-Zod errors are internal errors (bugs) - don't mask them
      this.logger.error("Internal error in response handler", error);
      this.errorReporter.captureException(error);
      return ["internal_error", null];
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
