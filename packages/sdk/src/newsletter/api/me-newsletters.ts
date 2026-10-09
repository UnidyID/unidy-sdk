import type * as z from "zod";
import type { ApiClientInterface, ServiceDependencies } from "../../api/base-service";
import { type MeListQuery, type MeResult, MeService } from "../../api/me-service";
import type { Page } from "../../api/shared";
import {
  type MeNewsletter,
  MeNewsletterSchema,
  type MeNewsletterSubscriptionRecord,
  MeNewsletterSubscriptionRecordSchema,
} from "./schemas";

/** Names a newsletter by its slug (the internal name the components take as `internal-name`) or by its id. */
export type NewsletterRef = { slug: string } | { newsletterId: string };

/** A subscription of the signed-in user, with the slug of its newsletter resolved from `/me/newsletters`. */
export type MeNewsletterSubscription = MeNewsletterSubscriptionRecord & { newsletter_slug: string };

export type MeNewsletterCreateArgs = NewsletterRef & {
  preferenceIdentifiers?: string[];
  /** Where the opt-in mail links back to once the subscription is confirmed. */
  redirectToAfterConfirmation?: string;
};

export type MeNewsletterUpdateArgs = NewsletterRef & { preferenceIdentifiers: string[] };

export type MeNewsletterRequestConfirmationArgs = NewsletterRef & {
  /** Where the opt-in mail links back to once the subscription is confirmed. */
  redirectToAfterConfirmation?: string;
};

const NEWSLETTERS_PATH = "/newsletters";
const SUBSCRIPTIONS_PATH = "/newsletter_subscriptions";
// The largest page V2 serves, so a brand's newsletters or a user's subscriptions usually take one request.
const PAGE_SIZE = 500;

function isOk<T>(result: MeResult<T>): result is [null, T] {
  return result[0] === null;
}

/**
 * The signed-in user's newsletter subscriptions on `/api/v2/me`. V2 addresses a newsletter by its id,
 * so slugs are resolved against the host brand's newsletters, loaded once per service instance.
 */
export class MeNewsletterService extends MeService {
  private catalog?: Promise<MeResult<MeNewsletter[]>>;

  constructor(client: ApiClientInterface, deps?: ServiceDependencies) {
    super(client, "MeNewsletterService", deps);
  }

  /** A page of the host brand's newsletters the signed-in user can subscribe to. */
  async listNewsletters(query?: MeListQuery): Promise<MeResult<Page<MeNewsletter>>> {
    return this.fetchPage(NEWSLETTERS_PATH, MeNewsletterSchema, query);
  }

  /** A page of the signed-in user's subscriptions on the host brand. */
  async list(query?: MeListQuery): Promise<MeResult<Page<MeNewsletterSubscription>>> {
    const loadedBefore = this.catalog;
    const [result] = await Promise.all([
      this.fetchPage(SUBSCRIPTIONS_PATH, MeNewsletterSubscriptionRecordSchema, query),
      this.newsletters(),
    ]);
    if (!isOk(result)) return result;

    const records = await this.withSlugs(result[1].records, loadedBefore);
    if (!isOk(records)) return records;

    return [null, { records: records[1], pagination: result[1].pagination }];
  }

  /** Every subscription of the signed-in user on the host brand, across all pages. */
  async listAll(): Promise<MeResult<MeNewsletterSubscription[]>> {
    const loadedBefore = this.catalog;
    const [result] = await Promise.all([this.collect(SUBSCRIPTIONS_PATH, MeNewsletterSubscriptionRecordSchema), this.newsletters()]);
    if (!isOk(result)) return result;

    return this.withSlugs(result[1], loadedBefore);
  }

  /** The signed-in user's subscription to a newsletter; `not_found` when they aren't subscribed. */
  async get(ref: NewsletterRef): Promise<MeResult<MeNewsletterSubscription>> {
    return this.onNewsletter(ref, (newsletter) => this.fetchRecord(this.memberPath(newsletter), MeNewsletterSubscriptionRecordSchema));
  }

  /**
   * Subscribes the signed-in user to one newsletter. An existing subscription is a 422 whose detail is
   * `payload.data.newsletter_id` / `taken`; an unknown preference is `payload.data.preference_identifiers` / `not_found`.
   */
  async create(args: MeNewsletterCreateArgs): Promise<MeResult<MeNewsletterSubscription>> {
    return this.onNewsletter(args, (newsletter) =>
      this.write("POST", SUBSCRIPTIONS_PATH, MeNewsletterSubscriptionRecordSchema, {
        data: { newsletter_id: newsletter.id, preference_identifiers: args.preferenceIdentifiers },
        redirect_to_after_confirmation: args.redirectToAfterConfirmation,
      }),
    );
  }

  /** Replaces the preferences of a confirmed subscription; an unconfirmed one is a 422. */
  async update(args: MeNewsletterUpdateArgs): Promise<MeResult<MeNewsletterSubscription>> {
    return this.onNewsletter(args, (newsletter) =>
      this.write("PATCH", this.memberPath(newsletter), MeNewsletterSubscriptionRecordSchema, {
        data: { preference_identifiers: args.preferenceIdentifiers },
      }),
    );
  }

  /** Unsubscribes the signed-in user, returning the subscription as it was. */
  async delete(ref: NewsletterRef): Promise<MeResult<MeNewsletterSubscription>> {
    return this.onNewsletter(ref, (newsletter) => this.write("DELETE", this.memberPath(newsletter), MeNewsletterSubscriptionRecordSchema));
  }

  /** Sends the opt-in mail again; a subscription with nothing to confirm is a 422. */
  async requestConfirmation(args: MeNewsletterRequestConfirmationArgs): Promise<MeResult<MeNewsletterSubscription>> {
    return this.onNewsletter(args, (newsletter) =>
      this.write("POST", `${this.memberPath(newsletter)}/request_confirmation`, MeNewsletterSubscriptionRecordSchema, {
        data: {},
        redirect_to_after_confirmation: args.redirectToAfterConfirmation,
      }),
    );
  }

  private memberPath(newsletter: MeNewsletter): string {
    return `${SUBSCRIPTIONS_PATH}/${encodeURIComponent(newsletter.id)}`;
  }

  private async onNewsletter(
    ref: NewsletterRef,
    call: (newsletter: MeNewsletter) => Promise<MeResult<MeNewsletterSubscriptionRecord>>,
  ): Promise<MeResult<MeNewsletterSubscription>> {
    const newsletter = await this.resolve(ref);
    if (!isOk(newsletter)) return newsletter;

    const result = await call(newsletter[1]);
    if (!isOk(result)) return result;

    return [null, { ...result[1], newsletter_slug: newsletter[1].slug }];
  }

  private async resolve(ref: NewsletterRef): Promise<MeResult<MeNewsletter>> {
    const matches = "slug" in ref ? (n: MeNewsletter) => n.slug === ref.slug : (n: MeNewsletter) => n.id === ref.newsletterId;
    const catalog = await this.catalogCovering((newsletters) => newsletters.some(matches));
    if (!isOk(catalog)) return catalog;

    const newsletter = catalog[1].find(matches);
    if (newsletter) return [null, newsletter];

    const [field, value] = "slug" in ref ? ["slug", ref.slug] : ["newsletter_id", ref.newsletterId];
    return [
      "not_found",
      { identifier: "not_found", details: [{ field, code: "not_found", message: `No newsletter ${value} on this brand` }] },
    ];
  }

  private async withSlugs(
    records: MeNewsletterSubscriptionRecord[],
    loadedBefore: MeNewsletterService["catalog"],
  ): Promise<MeResult<MeNewsletterSubscription[]>> {
    const covers = (newsletters: MeNewsletter[]) => records.every((r) => newsletters.some((n) => n.id === r.newsletter_id));
    const catalog = await this.catalogCovering(covers, loadedBefore);
    if (!isOk(catalog)) return catalog;

    const slugs = new Map(catalog[1].map((newsletter) => [newsletter.id, newsletter.slug]));
    return [
      null,
      records.flatMap((record) => {
        const slug = slugs.get(record.newsletter_id);
        if (slug !== undefined) return [{ ...record, newsletter_slug: slug }];

        this.logger.error(`Skipping subscription ${record.id}: newsletter ${record.newsletter_id} is not listed on /me/newsletters`);
        return [];
      }),
    ];
  }

  /** A catalog loaded before this call that misses a newsletter may be stale, so it is reloaded once. */
  private async catalogCovering(
    covers: (newsletters: MeNewsletter[]) => boolean,
    loadedBefore = this.catalog,
  ): Promise<MeResult<MeNewsletter[]>> {
    const catalog = await this.newsletters();
    if (!loadedBefore || !isOk(catalog) || covers(catalog[1])) return catalog;

    return this.newsletters(this.catalog === loadedBefore);
  }

  /** The host brand's newsletters. A failed load isn't kept, so the next call asks again. */
  private newsletters(reload = false): Promise<MeResult<MeNewsletter[]>> {
    if (reload || !this.catalog) {
      const loading = this.collect(NEWSLETTERS_PATH, MeNewsletterSchema);
      this.catalog = loading;
      loading.then((result) => {
        if (!isOk(result) && this.catalog === loading) this.catalog = undefined;
      });
    }
    return this.catalog;
  }

  private async collect<T>(path: string, schema: z.ZodType<T>): Promise<MeResult<T[]>> {
    const records: T[] = [];
    let page: number | null = 1;
    while (page !== null) {
      const result = await this.fetchPage(path, schema, { page, perPage: PAGE_SIZE });
      if (!isOk(result)) return result;

      records.push(...result[1].records);
      const { next } = result[1].pagination;
      page = next !== null && next > page ? next : null;
    }
    return [null, records];
  }
}
