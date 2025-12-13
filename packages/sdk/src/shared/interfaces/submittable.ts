/**
 * Interface for components that can be submitted via the submit button.
 * Implemented by newsletter-root, signin-step, and profile components.
 */
export interface Submittable {
  submit(): Promise<void>;
  isSubmitDisabled(forProp?: string): Promise<boolean>;
  isLoading(): Promise<boolean>;
}
