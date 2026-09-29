import { expect, test } from "@playwright/test";

test.describe("home page", () => {
	test("opens on the founders' letter", async ({ page }) => {
		await page.goto("/");

		// The title is for screen readers; the letter itself opens on "Dear family,".
		await expect(
			page.getByRole("heading", { level: 1, name: "Read the page. Seal it with a note." }),
		).toBeAttached();
		await expect(page.getByText("Dear family,")).toBeVisible();
	});
});
