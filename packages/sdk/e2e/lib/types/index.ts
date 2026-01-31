import type { Brand, UserBrand } from "./brand";
import type { MagicLink } from "./magicLink";
import type { Newsletter, NewsletterPreference } from "./newsletter";
import type { NewsletterSubscription } from "./newsletterSubscription";
import type { OauthApplication } from "./oauthApplication";
import type { TestEmail } from "./testEmail";
import type { User } from "./user";

// biome-ignore lint/suspicious/noExplicitAny: Create type defaults to any for flexibility
export interface BaseModel<ID = number, Create = any> {
  id: ID;
  created_at: string;
  updated_at: string;

  __create?: Create;
}

export type CleanModel<ModelType extends BaseModel> = Omit<ModelType, "__create">;
export type BaseFields = keyof BaseModel;
export type ModelDataFields<T extends BaseModel> = Omit<T, BaseFields>;

export type ModelMap = {
  TestEmail: TestEmail;
  User: User;
  MagicLink: MagicLink;
  Newsletter: Newsletter;
  NewsletterSubscription: NewsletterSubscription;
  NewsletterPreference: NewsletterPreference;
  Brand: Brand;
  UserBrand: UserBrand;
  "Oauth::Application": OauthApplication;

  // biome-ignore lint/suspicious/noExplicitAny: index signature allows any BaseModel variant
  [key: string]: BaseModel<any, any>;
};
