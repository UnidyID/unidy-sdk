import { type MeResult, MeService, sortParam } from "../../api/me-service";
import type { Page } from "../../api/shared";
import { type Transaction, type TransactionListParams, TransactionListParamsSchema, TransactionSchema } from "./schemas";

/** Common list arguments for transaction services */
export type TransactionListArgs = TransactionListParams;

export type TransactionListResult<T> = MeResult<Page<T>>;
export type TransactionGetResult<T> = MeResult<T>;

/** The signed-in user's transactions on the host brand, from `/api/v2/me/transactions`. */
export abstract class TransactionService extends MeService {
  protected async listTransactions(args: TransactionListArgs): Promise<TransactionListResult<Transaction>> {
    const validated = TransactionListParamsSchema.safeParse(args);
    if (!validated.success) {
      this.logger.error("Invalid list parameters", validated.error);
      return ["invalid_response", null];
    }

    return this.fetchPage("/transactions", TransactionSchema, {
      page: args.page,
      perPage: args.perPage,
      sort: sortParam(args.orderBy, args.orderDirection),
      filters: {
        state: args.state,
        financial_status: args.financialStatus,
        order_type: args.orderType,
        source_platform: args.sourcePlatform,
        external_id: args.externalId,
      },
    });
  }
}
