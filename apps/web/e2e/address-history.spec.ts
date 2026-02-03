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

  test("can fill in current address fields", async ({ page }) => {
    // Wait for form to be ready
    await expect(page.getByRole("heading", { name: "Current Address" })).toBeVisible();

    // Fill street
    const streetInput = page.getByRole("textbox", { name: "Street address" });
    await streetInput.fill("742 Evergreen Terrace");

    // After street is filled, component switches to card view
    // Verify the address is displayed
    await expect(page.getByText("742 Evergreen Terrace")).toBeVisible();

    // Click Edit to go back to form
    await page.getByRole("button", { name: "Edit" }).click();

    // Fill remaining fields
    const cityInput = page.getByRole("textbox", { name: "City" });
    await cityInput.fill("Springfield");
    await expect(cityInput).toHaveValue("Springfield");

    const zipInput = page.getByRole("textbox", { name: "ZIP Code" });
    await zipInput.fill("62704");
    await expect(zipInput).toHaveValue("62704");
  });

  test("shows Add Previous Address button", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add previous address/i });
    await expect(addButton).toBeVisible();
  });

  test("can click Add Previous Address", async ({ page }) => {
    const addButton = page.getByRole("button", { name: /add previous address/i });
    await addButton.click();

    // Should show Previous Addresses section heading
    await expect(page.getByRole("heading", { name: /previous addresses/i })).toBeVisible();
  });
});
