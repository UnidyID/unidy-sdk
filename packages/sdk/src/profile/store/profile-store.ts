import { createStore } from "@stencil/store";

export type Option = { value: string; label: string; icon?: string | null };
export type RadioOption = { value: string; label: string; checked: boolean };

export interface ProfileNode {
  value?: string | undefined | string[];
  type?: string;
  label?: string;
  required?: boolean;
  readonly?: boolean;
  locked?: boolean;
  locked_text?: string;
  options?: Option[];
  radio_options?: RadioOption[];
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
