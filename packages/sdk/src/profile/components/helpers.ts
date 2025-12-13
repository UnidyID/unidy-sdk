export function getParentProfile(element: HTMLElement): HTMLUProfileElement | null {
  const profile = element.closest("u-profile") as HTMLUProfileElement;
  return profile;
}
