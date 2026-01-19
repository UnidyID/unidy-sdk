import type { CleanModel, ModelMap } from "../types";
import type { Database } from "./index";

export class Model<ModelName extends keyof ModelMap> {
  static new<ModelName extends keyof ModelMap>(
    db: Database<ModelName>,
    data: CleanModel<ModelMap[ModelName]> | null,
  ): null | (Model<ModelName> & CleanModel<ModelMap[ModelName]>) {
    if (data === null) {
      return null;
    }

    return new Model<ModelName>(db, data) as Model<ModelName> & ModelMap[ModelName];
  }

  private constructor(
    private database: Database<ModelName>,
    private item: CleanModel<ModelMap[ModelName]>,
  ) {
    for (const key in item) {
      Object.defineProperty(this, key, {
        get() {
          return this.item[key];
        },
        set(value) {
          this.item[key] = value;
        },
      });
    }
  }

  get rawItem() {
    return this.item;
  }

  async reload() {
    const newValue = await this.database.get(this.item.id);
    if (!newValue) throw new Error(`[${this.database.modelName}] Could not reload model (returned null)`);

    this.item = newValue;
    return this;
  }

  async update(data: Parameters<typeof this.database.update>[1] & { [key: string]: unknown }) {
    await this.database.update(this.item.id, data);
    await this.reload();
  }

  async delete() {
    await this.database.destroy(this.item.id);
  }
}
