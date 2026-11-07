// library-tour: search for a movie, add it to the list, then remove it.
// Runs against the movie-kombat app started by its demo.yml.
export default async function libraryTour({ page, log, demo }) {
  await page.goto(demo.url, { waitUntil: "load" });

  const onboarding = page.getByText("Before you start");
  if (await onboarding.isVisible().catch(() => false)) {
    log("onboarding: choose English and United States");
    await page.getByRole("button", { name: /English/i }).first().click();
    await page.getByRole("button", { name: "Select a country" }).click();
    await page.getByRole("button", { name: "United States of America" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await onboarding.waitFor({ state: "hidden", timeout: 10000 });
  }

  const search = page.getByPlaceholder("Search movie...");
  await search.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForTimeout(1200);

  log("searching for a movie");
  await search.fill("The Matrix");
  await page.waitForFunction(() => document.querySelector('[placeholder="Search movie..."]')?.value === "The Matrix");

  const result = page
    .locator("div.border.rounded-lg.shadow-md")
    .filter({ has: page.getByRole("heading", { name: "The Matrix", exact: true }) })
    .first();
  await result.waitFor({ state: "visible", timeout: 20000 });
  await page.waitForTimeout(1800);

  log("adding the movie to the list");
  await result.getByRole("button", { name: /Add to List/i }).click();
  await page.waitForTimeout(1800);

  log("removing the movie from the list");
  const added = page
    .locator("figure")
    .filter({ has: page.getByRole("heading", { name: "The Matrix", exact: true }) })
    .first();
  await added.getByRole("button", { name: /Remove/i }).click();
  await page.waitForTimeout(1500);
}
