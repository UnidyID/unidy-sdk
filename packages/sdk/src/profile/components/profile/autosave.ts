import { hasProfileChanged } from "../../profile-helpers";
import type { FieldSaveState } from "../../store/profile-store";
import { state as profileState } from "../../store/profile-store";

export class ProfileAutosave {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private savedTimeoutIds: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private isSubmitting = false;
  private delay: number;
  private onSubmit: () => Promise<void>;

  constructor(delay: number, onSubmit: () => Promise<void>) {
    this.delay = delay;
    this.onSubmit = onSubmit;
  }

  debouncedSave = () => {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }

    this.timeoutId = setTimeout(() => {
      const hasErrors = Object.keys(profileState.errors).length > 0;
      if (hasProfileChanged() && !profileState.loading && !hasErrors) {
        this.onSubmit();
      }
    }, this.delay);
  };

  clearFieldSavedState(field: string) {
    const existingTimeout = this.savedTimeoutIds.get(field);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
      this.savedTimeoutIds.delete(field);
    }
    if (profileState.fieldSaveStates[field] === "saved") {
      this.setFieldSaveState(field, "idle");
    }
  }

  private setFieldSaveState(field: string, state: FieldSaveState) {
    profileState.fieldSaveStates = {
      ...profileState.fieldSaveStates,
      [field]: state,
    };
  }

  async submitField(field: string): Promise<void> {
    // Don't submit if already submitting (lock)
    if (this.isSubmitting) {
      return;
    }

    // Don't submit if there are validation errors for this field
    if (profileState.errors[field]) {
      return;
    }

    // Don't submit if there are no changes
    if (!hasProfileChanged()) {
      return;
    }

    // Clear any existing saved timeout for this field
    this.clearFieldSavedState(field);

    // Set field to saving state
    this.setFieldSaveState(field, "saving");
    this.isSubmitting = true;

    try {
      // Submit the profile
      await this.onSubmit();

      // If no errors, set to saved state
      if (!profileState.errors[field]) {
        this.setFieldSaveState(field, "saved");

        // Clear saved state after 2 seconds
        const timeoutId = setTimeout(() => {
          this.setFieldSaveState(field, "idle");
          this.savedTimeoutIds.delete(field);
        }, 2000);
        this.savedTimeoutIds.set(field, timeoutId);
      } else {
        // If there was an error, reset to idle
        this.setFieldSaveState(field, "idle");
      }
    } catch {
      // On network or other error, reset to idle
      this.setFieldSaveState(field, "idle");
    } finally {
      this.isSubmitting = false;
    }
  }

  destroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
    // Clear all saved state timeouts
    for (const timeoutId of this.savedTimeoutIds.values()) {
      clearTimeout(timeoutId);
    }
    this.savedTimeoutIds.clear();
  }
}
