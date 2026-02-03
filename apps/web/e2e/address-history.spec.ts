import { test, expect } from "@playwright/test";

// Run tests serially to avoid localStorage conflicts
test.describe.configure({ mode: "serial" });

test.describe("Address History", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate first, then clear localStorage and reload
    await page.goto("/sections/petitioner/address");
    await page.evaluate(() => localStorage.clear());
    await page.reload();
    // Wait for the page heading to be visible
    await expect(page.getByRole("heading", { name: "Petitioner Address History" })).toBeVisible();
  });

  test("displays page title and address form", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Petitioner Address History" })).toBeVisible();
    // Wait for Current Address form to appear
    await expect(page.getByRole("heading", { name: "Current Address" })).toBeVisible();
    await expect(page.getByText("Street address")).toBeVisible();
  });

  test("can fill in current address fields and save", async ({ page }) => {
    await expect(page.getByRole("heading", { name: "Current Address" })).toBeVisible();

    // Fill required fields
    await page.getByRole("textbox", { name: "Street address" }).fill("742 Evergreen Terrace");
    await page.getByRole("textbox", { name: "City" }).fill("Springfield");
    await page.getByRole("textbox", { name: "ZIP Code" }).fill("62704");
    await page.getByRole("textbox", { name: "Country" }).fill("United States");

    // Select state
    await page.getByRole("combobox").first().click();
    await page.getByRole("option", { name: "IL" }).click();

    // Select start month
    await page.locator("button").filter({ hasText: "Month" }).click();
    await page.getByRole("option", { name: "January" }).click();

    // Select start year
    await page.locator("button").filter({ hasText: "Year" }).click();
    await page.getByRole("option", { name: "2020" }).click();

    // Click Save Address
    await page.getByRole("button", { name: "Save Address" }).click();

    // Verify card view shows the address
    await expect(page.getByText("742 Evergreen Terrace")).toBeVisible();
    await expect(page.getByText("Springfield")).toBeVisible();
  });

  test("shows Add Previous Address button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add previous address/i });
    await expect(addButton).toBeVisible();
  });

  test("can click Add Previous Address and see draft form", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add previous address/i });
    await addButton.click();

    // Should show draft form with Previous Address heading
    await expect(page.getByRole("heading", { name: "Previous Address 1" })).toBeVisible();

    // Should show Cancel button for draft
    await expect(page.getByRole("button", { name: "Cancel" })).toBeVisible();

    // Click Cancel to discard draft
    await page.getByRole("button", { name: "Cancel" }).click();

    // Draft should be discarded, Add button visible again
    await expect(page.getByRole("button", { name: /add previous address/i })).toBeVisible();
  });
});
