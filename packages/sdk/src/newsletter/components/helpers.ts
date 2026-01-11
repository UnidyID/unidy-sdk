export function getParentNewsletterRoot(element: HTMLElement): HTMLUNewsletterRootElement | null {
  const newsletterRoot = element.closest("u-newsletter-root") as HTMLUNewsletterRootElement;
  return newsletterRoot || null;
}
