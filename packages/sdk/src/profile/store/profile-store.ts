import { createStore } from "@stencil/store";
import type { ProfileFieldOption } from "../api/schemas";

/** A field's value as the API renders it: a yes/no radio holds `true`, `false` or `null`, a multi-select the selected values. */
export type ProfileValue = string | number | boolean | string[] | null;

/** A choice of a select, radio or multi-select field. */
export type Option = ProfileFieldOption;

/** A profile field: its value and how the form shows it. */
export interface ProfileNode {
  value?: ProfileValue;
  type?: string;
  label?: string;
  required?: boolean;
  readonly?: boolean;
  locked?: boolean;
  locked_text?: string | null;
  options?: Option[];
  attr_name?: string;
}

export type ProfileRaw = {
  custom_attributes?: Record<string, ProfileNode>;
} & Record<string, ProfileNode>;

export type FieldSaveState = "idle" | "saving" | "saved";

export interface ProfileState {
  loading: boolean;
  data: ProfileRaw;
  configuration: ProfileRaw;
  errors: Record<string, string | null>;
  configUpdateSource?: "fetch" | "submit";
  phoneValid: boolean;
  fieldSaveStates: Record<string, FieldSaveState>;
  activeField: string | null;
}

const initialState: ProfileState = {
  loading: false,
  data: {},
  configuration: {},
  errors: {},
  phoneValid: true,
  fieldSaveStates: {},
  activeField: null,
};

const profileStore = createStore<ProfileState>(initialState);

const profileStoreOnChange: <K extends keyof ProfileState>(prop: K, cb: (value: ProfileState[K]) => void) => () => void =
  profileStore.onChange;

export { profileStore };
export const { state } = profileStore;
export { profileStoreOnChange as onChange };
