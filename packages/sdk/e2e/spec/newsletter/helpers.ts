export function extractManageSubscriptionLink(emailHtml: string): string {
  const match = emailHtml.match(/href="(http[^"]*\/newsletter[^"]*)"/);

  if (!match?.[1]) {
    throw new Error("Manage subscription link not found in email body");
  }

  return match[1].replace(/&amp;/g, "&");
}
