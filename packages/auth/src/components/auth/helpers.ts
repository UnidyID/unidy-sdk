export function getParentSigninStep(element: HTMLElement): HTMLUSigninStepElement | null {
  const signinStep = element.closest("u-signin-step") as HTMLUSigninStepElement;
  return signinStep;
}
