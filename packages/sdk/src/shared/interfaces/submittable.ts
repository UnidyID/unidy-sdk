export interface Submittable {
  submit(): Promise<void>;
  isSubmitDisabled(forProp?: string): Promise<boolean>;
  isLoading(): Promise<boolean>;
}
