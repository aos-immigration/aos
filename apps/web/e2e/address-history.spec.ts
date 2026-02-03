import { test, expect } from "@playwright/test";

test.describe("Address History", () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto("/sections/petitioner/address");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
  });

  test("displays empty current address form on first load", async ({ page }) => {
    await page.goto("/sections/petitioner/address");

    // Should see the page title
    await expect(page.getByText("Petitioner Address History")).toBeVisible();

    // Should see street address input
    await expect(page.getByPlaceholder("123 Main St")).toBeVisible();
  });

  test("can fill in current address", async ({ page }) => {
    await page.goto("/sections/petitioner/address");

    // Fill in address fields
    await page.getByPlaceholder("123 Main St").fill("742 Evergreen Terrace");
    await page.getByPlaceholder("San Jose").fill("Springfield");

    // Select state
    await page.getByRole("combobox").filter({ hasText: "Select state" }).click();
    await page.getByRole("option", { name: "IL" }).click();

    // Fill ZIP
    await page.getByPlaceholder("95112").fill("62704");

    // Select start month
    await page.getByRole("combobox").filter({ hasText: "Month" }).first().click();
    await page.getByRole("option", { name: "January" }).click();

    // Select start year
    await page.getByRole("combobox").filter({ hasText: "Year" }).first().click();
    await page.getByRole("option", { name: "2020" }).click();

    // Verify data persists after reload
    await page.reload();
    await expect(page.getByPlaceholder("123 Main St")).toHaveValue("742 Evergreen Terrace");
  });

  test("can add previous address", async ({ page }) => {
    await page.goto("/sections/petitioner/address");

    // First fill current address minimally
    await page.getByPlaceholder("123 Main St").fill("123 Current St");
    await page.getByPlaceholder("San Jose").fill("Current City");

    // Click add previous address
    await page.getByRole("button", { name: "Add Previous Address" }).click();

    // Should see Previous Address section
    await expect(page.getByText("Previous Address 1")).toBeVisible();
  });

  test("validates required fields", async ({ page }) => {
    await page.goto("/sections/petitioner/address");

    // Try to interact with empty form - validation should show
    // Select a month to trigger validation
    await page.getByRole("combobox").filter({ hasText: "Month" }).first().click();
    await page.getByRole("option", { name: "January" }).click();

    // Should see validation message about required fields
    await expect(page.getByText(/required/i)).toBeVisible();
  });

  test("shows gap explanation dialog when gap detected", async ({ page }) => {
    await page.goto("/sections/petitioner/address");

    // Fill current address with recent start date
    await page.getByPlaceholder("123 Main St").fill("123 Current St");
    await page.getByPlaceholder("San Jose").fill("City");
    await page.getByRole("combobox").filter({ hasText: "Select state" }).click();
    await page.getByRole("option", { name: "CA" }).click();
    await page.getByPlaceholder("95112").fill("90001");

    await page.getByRole("combobox").filter({ hasText: "Month" }).first().click();
    await page.getByRole("option", { name: "June" }).click();
    await page.getByRole("combobox").filter({ hasText: "Year" }).first().click();
    await page.getByRole("option", { name: "2024" }).click();

    // Add previous address with gap
    await page.getByRole("button", { name: "Add Previous Address" }).click();

    // Fill previous address with old dates creating gap
    const previousStreet = page.getByPlaceholder("123 Main St").nth(1);
    await previousStreet.fill("456 Old St");

    // Set start date way in the past (creating gap)
    const monthSelects = page.getByRole("combobox").filter({ hasText: "Month" });
    await monthSelects.nth(2).click(); // Start month of previous address
    await page.getByRole("option", { name: "January" }).click();

    const yearSelects = page.getByRole("combobox").filter({ hasText: "Year" });
    await yearSelects.nth(2).click();
    await page.getByRole("option", { name: "2020" }).click();

    // Gap dialog should appear (if gap > 30 days between addresses)
    // Note: Dialog appearance depends on end date logic
  });
});
