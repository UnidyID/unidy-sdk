export function getParentRegistrationStep(element: HTMLElement): HTMLURegistrationStepElement | null {
  return element.closest("u-registration-step") as HTMLURegistrationStepElement;
}

export function getParentRegistrationRoot(element: HTMLElement): HTMLURegistrationRootElement | null {
  return element.closest("u-registration-root") as HTMLURegistrationRootElement;
}

export function isInsideRegistrationRoot(element: HTMLElement): boolean {
  return !!getParentRegistrationRoot(element);
}
