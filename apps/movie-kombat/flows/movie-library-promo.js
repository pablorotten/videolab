// A slower, legible product tour of Movie Kombat's movie library controls,
// followed by a short, energetic three-up tournament finish.
export default async function movieLibraryPromo({ page, log, demo }) {
  await page.goto(demo.url, { waitUntil: "load" });

  const onboarding = page.getByText("Before you start");
  if (await onboarding.isVisible().catch(() => false)) {
    log("onboarding: choose English and United States");
    await page.getByRole("button", { name: /English/i }).first().click();
    await page.getByText(/Select a country/i).click();
    await page.getByRole("button", { name: "United States of America" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await onboarding.waitFor({ state: "hidden", timeout: 10000 });
  }

  // Keep this first section intentional: let each real app state read clearly.
  const search = page.getByPlaceholder("Search movie...");
  await search.waitFor({ state: "visible", timeout: 15000 });
  await search.scrollIntoViewIfNeeded();
  await page.waitForTimeout(1200);
  log("searching for a movie");
  await search.fill("The Matrix");
  await page.waitForFunction(() => document.querySelector('[placeholder="Search movie..."]')?.value === "The Matrix");

  const result = page.locator("div.border.rounded-lg.shadow-md").filter({ has: page.getByRole("heading", { name: "The Matrix", exact: true }) }).first();
  await result.waitFor({ state: "visible", timeout: 20000 });
  await page.waitForTimeout(1800); // readable search results / poster detail
  log("adding the selected movie");
  await result.getByRole("button", { name: /Add to List/i }).click();
  await page.waitForTimeout(1800);

  // Demonstrate removal on the item just added, then add a fresh curated batch
  // so there is a healthy set of real movies for the tournament payoff.
  const addedMovie = page.locator("figure").filter({ has: page.getByRole("heading", { name: "The Matrix", exact: true }) }).first();
  const remove = addedMovie.getByRole("button", { name: /Remove/i });
  if (await remove.count()) {
    log("removing a movie from the list");
    await remove.click();
    await page.waitForTimeout(1300);
  }

  log("loading a movie collection for the tournament");
  const collections = page.getByRole("button", { name: /Movie Collections/i });
  await collections.scrollIntoViewIfNeeded();
  await collections.click();
  await page.waitForTimeout(700);
  const collection = page.locator("div.cursor-pointer", { hasText: "Tarantino" }).first();
  await collection.waitFor({ state: "visible", timeout: 15000 });
  await collection.click();

  const start = page.locator('button[aria-label="Start Kombat"]');
  await start.waitFor({ state: "visible", timeout: 15000 });
  await page.waitForFunction(
    () => document.querySelector('button[aria-label="Start Kombat"]')?.className.includes("bg-emerald-500"),
    undefined,
    { timeout: 120000 },
  );
  // Give the library a moment on screen before shifting into the fast section.
  await page.waitForTimeout(2200);
  log("starting tournament");
  await start.click();
  await page.waitForURL(/\/kombat/, { timeout: 15000 });
  const choose = page.getByRole("button", { name: "Choose" });
  await choose.first().waitFor({ timeout: 30000 });

  // Record a compact, fast sequence of authentic rounds. The composer uses
  // this footage in a three-panel split-screen burst; the final winner remains
  // untrimmed and full-frame at the end of the take.
  for (let round = 1; round <= 20; round++) {
    log(`tournament round ${round}`);
    await choose.first().click();
    await page.waitForTimeout(720);
    if (await page.getByText("The Winner Is").isVisible().catch(() => false)) break;
  }
  await page.waitForTimeout(2600);
}
