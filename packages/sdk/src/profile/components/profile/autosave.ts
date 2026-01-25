import { hasProfileChanged } from "../../profile-helpers";
import type { FieldSaveState } from "../../store/profile-store";
import { state as profileState } from "../../store/profile-store";

export class ProfileAutosave {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
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

  private setFieldSaveState(field: string, state: FieldSaveState) {
    profileState.fieldSaveStates = {
      ...profileState.fieldSaveStates,
      [field]: state,
    };
  }

  async submitField(field: string): Promise<void> {
    // Don't submit if there are validation errors for this field
    if (profileState.errors[field]) {
      return;
    }

    // Don't submit if there are no changes
    if (!hasProfileChanged()) {
      return;
    }

    // Set field to saving state
    this.setFieldSaveState(field, "saving");

    // Submit the profile
    await this.onSubmit();

    // If no errors, set to saved state
    if (!profileState.errors[field]) {
      this.setFieldSaveState(field, "saved");

      // Clear saved state after 2 seconds
      setTimeout(() => this.setFieldSaveState(field, "idle"), 2000);
    } else {
      // If there was an error, reset to idle
      this.setFieldSaveState(field, "idle");
    }
  }

  destroy() {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}
