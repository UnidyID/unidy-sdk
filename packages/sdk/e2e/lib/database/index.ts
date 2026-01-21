// copied from UnidyCode
import { expect } from "@playwright/test";

import { TestApi } from "../testApi";
import type { BaseModel, CleanModel, ModelMap } from "../types";
import { Model } from "./model";

type NotNull<T> = T extends null | undefined ? never : T;
const notNull = <T>(value: T): NotNull<T> => {
  if (value === null || value === undefined) throw new Error("value is null");
  return value as NotNull<T>;
};

type Create<ModelType extends BaseModel> = CleanModel<ModelType> & (ModelType extends BaseModel<any, infer Create> ? Create : never);

export class Database<
  ModelName extends keyof ModelMap,
  RawModelType extends ModelMap[ModelName] = ModelMap[ModelName],
  ModelType extends CleanModel<RawModelType> = CleanModel<RawModelType>,
> extends TestApi {
  constructor(
    public readonly modelName: ModelName,
    private readonly where?: ModelName extends "TestEmail"
      ? string
      : {
          includes?: any;
          scope: Partial<ModelType> & Record<string, any>;
        },
  ) {
    super();
  }

  async list({ unscoped }: { unscoped?: boolean } = {}) {
    return (
      await this.fetch<{
        data: ModelType[];
      }>(`db/${this.modelName}`, {}, unscoped)
    ).data.map((data) => notNull(Model.new(this, data)));
  }

  async count({ unscoped }: { unscoped?: boolean } = {}) {
    return (await this.fetch<{ count: number }>(`db/${this.modelName}/count`, {}, unscoped)).count;
  }

  async create(data: Partial<Create<RawModelType>>) {
    return Model.new(this, await this.fetch<ModelType>(`db/${this.modelName}`, { method: "POST", body: { data } }));
  }

  async getFirst({ unscoped }: { unscoped?: boolean } = {}) {
    return Model.new(this, await this.fetch<ModelType>(`db/${this.modelName}/first`, {}, unscoped));
  }

  async getLast({ unscoped }: { unscoped?: boolean } = {}) {
    return Model.new(this, await this.fetch<ModelType>(`db/${this.modelName}/last`, {}, unscoped));
  }

  async ensureLast({ unscoped }: { unscoped?: boolean } = {}) {
    const last = await this.getLast({ unscoped });
    expect(last).not.toBeNull();

    if (!last) throw new Error("last is null");
    return last;
  }

  async get(id: number, { unscoped }: { unscoped?: boolean } = {}) {
    return Model.new(this, await this.fetch<ModelType>(`db/${this.modelName}/${id}`, {}, unscoped));
  }

  async ensureGet(id: number, { unscoped }: { unscoped?: boolean } = {}) {
    const model = await this.get(id, { unscoped });
    expect(model).not.toBeNull();

    if (!model) throw new Error("model is null");
    return model;
  }

  async getBy(params: Partial<Omit<ModelType, "id" | "updated_at">>, { unscoped }: { unscoped?: boolean } = {}) {
    const keys = Object.keys(params);
    if (keys.length === 0) throw new Error("params must not be empty");
    if (keys.length > 1) throw new Error("params must have only one key");

    const key = keys[0];
    const value = params[key];

    const query = new URLSearchParams();
    query.set("key", key);
    query.set("value", value);

    return Model.new(this, await this.fetch<ModelType>(`db/${this.modelName}/get_by?${query}`, {}, unscoped));
  }

  async ensureGetBy(params: Partial<Omit<ModelType, "id" | "updated_at">>, { unscoped }: { unscoped?: boolean } = {}) {
    const model = await this.getBy(params, { unscoped });
    expect(model).not.toBeNull();

    if (!model) throw new Error("model is null");
    return model;
  }

  async update(
    id: number,
    data: Partial<Omit<ModelType, "id" | "updated_at">>,
    {
      unscoped,
    }: {
      unscoped?: boolean;
    } = {},
  ) {
    return await this.fetch<ModelType>(
      `db/${this.modelName}/${id}`,
      {
        method: "PATCH",
        body: { data },
      },
      unscoped,
    );
  }

  async destroy(id: number, { unscoped }: { unscoped?: boolean } = {}) {
    return await this.fetch<ModelType>(`db/${this.modelName}/${id}`, { method: "DELETE" }, unscoped);
  }

  async destroy_all({ unscoped }: { unscoped?: boolean } = {}) {
    return await this.fetch<ModelType>(`db/${this.modelName}/destroy_all`, { method: "DELETE" }, unscoped);
  }

  async fetch<T = object>(
    url: string,
    options: Omit<RequestInit, "body"> & {
      body?: any;
    } = {},
    unscoped = false,
    throwOnError = true,
  ): Promise<T> {
    const finalUrl = this.wrap_url(url, unscoped);
    return super.fetch(finalUrl, options, throwOnError);
  }

  private wrap_url(path: string, unscoped: boolean) {
    if (!this.where || unscoped) {
      return path;
    }

    const query = new URLSearchParams();

    if (typeof this.where === "string") {
      query.set("scope", this.where);
    } else {
      if (typeof this.where === "object" && "includes" in this.where) {
        query.set("includes", JSON.stringify(this.where.includes));
      }

      query.set("scope", JSON.stringify(this.where.scope));
    }

    return `${path}?${query}`;
  }
}
