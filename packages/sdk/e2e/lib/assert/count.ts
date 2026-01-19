import { expect } from "@playwright/test";

import { Database } from "../database";
import type { ModelMap } from "../types";

export class ModelCountAssert<ModelName extends keyof ModelMap> {
  static async init<ModelName extends keyof ModelMap>(model: ModelName, scope?: any) {
    const expect = new ModelCountAssert({ model, scope });
    expect.initial = await expect.fetchCount();
    return expect;
  }

  static async from<ModelName extends keyof ModelMap>(database: Database<ModelName>) {
    const expect = new ModelCountAssert({ database });
    expect.initial = await expect.fetchCount();
    return expect;
  }

  initial = -1;
  databaseService: Database<ModelName>;

  private constructor(args: { model: ModelName; scope: any } | { database: Database<ModelName> }) {
    if ("database" in args) {
      this.databaseService = args.database;
    } else {
      this.databaseService = new Database(args.model, args.scope);
    }
  }

  async fetchCount() {
    return await this.databaseService.count();
  }

  async toHaveChangedBy(amount: number) {
    const current = await this.fetchCount();
    expect(current).toBe(this.initial + amount);
  }
}
