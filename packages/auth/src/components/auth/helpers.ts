export function getParentSigninStep(element: HTMLElement): HTMLSigninStepElement | null {
  const signinStep = element.closest("signin-step") as HTMLSigninStepElement;

  if (!signinStep) {
    console.error("Element is not inside a signin-step");

    return null;
  }

  return signinStep;
}
