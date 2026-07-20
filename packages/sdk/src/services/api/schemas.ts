import * as z from "zod";

export const ServiceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  logo_url: z.string().nullable(),
  connected_at: z.string().nullable(),
});

export const ServicesListResponseSchema = z.array(ServiceSchema);

export type Service = z.infer<typeof ServiceSchema>;
