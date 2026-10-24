import * as z from "zod";

const TranslationsSchema = z.record(z.string(), z.string().nullable());

/** V2: an OAuth application the signed-in user has authorized (`/api/v2/me/authorized_applications`). */
export const AuthorizedApplicationSchema = z.object({
  /** The application's OAuth client id. */
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  name_t: TranslationsSchema,
  description_t: TranslationsSchema,
  service_logo_url: z.string().nullable(),
  brands: z.object({ list: z.array(z.string()), owner: z.array(z.string()) }),
  authorized_at: z.string().nullable(),
});

export type AuthorizedApplication = z.infer<typeof AuthorizedApplicationSchema>;
