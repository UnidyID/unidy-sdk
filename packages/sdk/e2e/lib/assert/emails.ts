import { expect } from "@playwright/test";

import { Database } from "../database";

type Args = { to?: string };

export class EmailAssert extends Database<"TestEmail"> {
  static async init(args: Args) {
    const expect = new EmailAssert(args);
    expect.initial = await expect.count();
    return expect;
  }

  initial = -1;

  private constructor(args: Args = {}) {
    super("TestEmail", args.to);
  }

  async toHaveReceived(amount: number, attempts = 10) {
    let current = this.initial;

    for (let i = 0; i < attempts; i++) {
      current = await this.count();
      if (current === this.initial + amount) {
        return;
      }

      await new Promise((resolve) => setTimeout(resolve, 300));
    }

    expect(current).toBe(this.initial + amount);
  }
}
