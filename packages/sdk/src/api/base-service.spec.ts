import { z } from "zod";
import { type ApiClientInterface, BaseService, type ErrorReporter } from "./base-service";

class TestService extends BaseService {
  report(error: z.ZodError, context: Record<string, unknown>) {
    this.reportSchemaFailure(error, context);
  }
}

describe("BaseService.reportSchemaFailure", () => {
  it("reports issue paths and codes without response values", () => {
    const captureException = jest.fn();
    const errorReporter: ErrorReporter = { captureException };
    const service = new TestService({} as ApiClientInterface, "TestService", { errorReporter });

    const result = z.object({ name: z.string() }).strict().safeParse({ name: "secret-value", extra: 1 });
    if (result.success) throw new Error("expected schema failure");

    service.report(result.error, { endpoint: "/x" });

    expect(captureException).toHaveBeenCalledTimes(1);
    const [error, context] = captureException.mock.calls[0];
    expect(error).toBe(result.error);
    expect(context).toEqual({
      endpoint: "/x",
      error_type: "schema_validation",
      issues: [{ path: "", code: "unrecognized_keys" }],
    });
    expect(JSON.stringify(context)).not.toContain("secret-value");
  });
});
