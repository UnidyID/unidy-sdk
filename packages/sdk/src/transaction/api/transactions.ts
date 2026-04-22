import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";
import { type Transaction, TransactionSchema, type TransactionsListResponse, TransactionsListResponseSchema } from "./schemas";
import { type TransactionGetResult, type TransactionListArgs, type TransactionListResult, TransactionService } from "./transaction-service";

// Re-export types for external use
export type { Transaction, TransactionLineItem, TransactionsListResponse } from "./schemas";

export type TransactionsListArgs = TransactionListArgs;
export type TransactionsGetArgs = { id: string };

// Result types
export type TransactionsListResult = TransactionListResult<TransactionsListResponse>;
export type TransactionsGetResult = TransactionGetResult<Transaction>;

export class TransactionsService extends TransactionService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TransactionsService", deps);
  }

  async list(args: TransactionsListArgs = {}): Promise<TransactionsListResult> {
    const params = this.buildListParams(args);
    const queryString = this.toQueryString(params);
    return this.handleList("/api/sdk/v1/transactions", queryString, TransactionsListResponseSchema, "transactions", args);
  }

  async get(args: TransactionsGetArgs): Promise<TransactionsGetResult> {
    return this.handleGet(`/api/sdk/v1/transactions/${args.id}`, TransactionSchema, "transaction");
  }
}
