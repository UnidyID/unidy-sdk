import { expect, type Page } from "@playwright/test";

export const expectFlash = async (page: Page, flash: string, type = undefined) => {
  const locator = page.getByTestId("flashes").getByText(flash);
  await expect(locator).toBeVisible();

  // TODO: Handle this
  if (type) {
  }
};
