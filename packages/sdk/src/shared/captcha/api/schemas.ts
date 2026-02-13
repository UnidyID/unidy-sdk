import * as z from "zod";

/**
 * Supported captcha providers matching the backend SdkClientCaptchaConfig::PROVIDERS
 */
export const CaptchaProviderEnum = z.enum(["recaptcha_v3", "turnstile", "hcaptcha", "friendly_captcha"]);

export type CaptchaProvider = z.infer<typeof CaptchaProviderEnum>;

/**
 * Captcha features that can be independently enabled
 */
export type CaptchaFeature = "login" | "registration" | "newsletter";

/**
 * Captcha configuration response from the backend
 * Matches the SDK::CaptchaConfigSerializer output
 */
export const CaptchaConfigSchema = z.object({
  id: z.number(),
  provider: CaptchaProviderEnum,
  site_key: z.string(),
  login_enabled: z.boolean(),
  login_score_threshold: z.number().nullable(),
  registration_enabled: z.boolean(),
  registration_score_threshold: z.number().nullable(),
  newsletter_enabled: z.boolean(),
  newsletter_score_threshold: z.number().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type CaptchaConfig = z.infer<typeof CaptchaConfigSchema>;

/**
 * Captcha error responses from the backend
 */
export const CaptchaErrorSchema = z.object({
  error_identifier: z.enum(["captcha_token_missing", "captcha_verification_failed", "captcha_score_too_low"]),
  error_codes: z.array(z.string()).optional(),
  score: z.number().optional(),
  threshold: z.number().optional(),
});

export type CaptchaError = z.infer<typeof CaptchaErrorSchema>;

/**
 * Check if an error identifier is a captcha-related error
 */
export function isCaptchaError(errorIdentifier: string): boolean {
  return ["captcha_token_missing", "captcha_verification_failed", "captcha_score_too_low"].includes(errorIdentifier);
}
