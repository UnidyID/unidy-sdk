import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";
import { type Transaction, TransactionSchema } from "./schemas";
import { type TransactionGetResult, type TransactionListArgs, type TransactionListResult, TransactionService } from "./transaction-service";

// Re-export types for consumers importing from this module directly.
export type { Address, Transaction, TransactionLineItem, TransactionsListResponse } from "./schemas";

export type TransactionsListArgs = TransactionListArgs;
export type TransactionsGetArgs = { id: string };

export type TransactionsListResult = TransactionListResult<Transaction>;
export type TransactionsGetResult = TransactionGetResult<Transaction>;

export class TransactionsService extends TransactionService {
  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "TransactionsService", deps);
  }

  async list(args: TransactionsListArgs = {}): Promise<TransactionsListResult> {
    return this.listTransactions(args);
  }

  async get(args: TransactionsGetArgs): Promise<TransactionsGetResult> {
    return this.fetchRecord(`/transactions/${args.id}`, TransactionSchema);
  }
}
