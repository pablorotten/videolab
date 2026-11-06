// collection-kombat — most demo-worthy end-to-end path of movie-kombat.
// 1. Get through the onboarding screen (language + country).
// 2. Load a local movie collection.
// 3. Start the Kombat and vote until the winner screen.
export default async function loadCollectionFlow({ page, log, demo }) {
  // -- Onboarding: language -------------------------------------------------
  const onboarding = page.getByText("Before you start");
  await page.goto(demo.url, { waitUntil: "load" });
  if (await onboarding.isVisible().catch(() => false)) {
    log("onboarding: choose English");
    await page.getByRole("button", { name: /English/i }).first().click();

    log("onboarding: pick a country");
    await page.getByRole("button", { name: "Select a country" }).click();
    await page.getByRole("button", { name: "United States of America" }).first().click();

    log("onboarding: continue");
    await page.getByRole("button", { name: /continue/i }).click();
    await onboarding.waitFor({ state: "hidden", timeout: 5000 });
  }

  // -- Load a local collection ---------------------------------------------
  log("opening movie collections panel");
  const panel = page.getByRole("button", { name: /Movie Collections/i });
  await panel.waitFor({ timeout: 15000 });
  await panel.click();
  await page.waitForTimeout(600); // let the reveal animation finish

  log("loading Tarantino collection");
  const tile = page.locator("div.cursor-pointer", { hasText: "Tarantino" }).first();
  await tile.waitFor({ timeout: 15000 });
  await tile.click();

  // -- Start the Kombat -----------------------------------------------------
  // START is a round fixed button; it grays out (not `disabled` attr) until
  // >=4 movies. Wait for its enabled "bg-emerald-500" styling, then click.
  const start = page.locator('button[aria-label="Start Kombat"]');
  await start.waitFor({ state: "visible", timeout: 15000 });
  log("starting kombat");
  await page.waitForFunction(
    () => document.querySelector('button[aria-label="Start Kombat"]')?.className.includes("bg-emerald-500"),
    undefined,
    { timeout: 120000 } // collection TMDB lookups can take a while
  );
  await start.click();
  await page.waitForURL(/\/kombat/, { timeout: 15000 });

  // -- Vote until winner screen --------------------------------------------
  const choose = page.getByRole("button", { name: "Choose" });
  await choose.first().waitFor({ timeout: 30000 });
  for (let round = 1; round <= 20; round++) {
    log(`round ${round}: choosing winner`);
    await choose.first().click();
    // Wait for the knockout animation, then for the next matchup.
    await page.waitForTimeout(2600);
    if (await page.getByText("The Winner Is").isVisible().catch(() => false)) {
      log("winner screen reached");
      break;
    }
  }
  // Hold on the winner screen a moment for the recording end.
  await page.waitForTimeout(2000);
}
