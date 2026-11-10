// collections-search: build the movie list three ways (single search, a
// ready-made collection, discover by streaming platform), then delete movies.
// Runs against the movie-kombat app started by its demo.yml.

// Waits until the "Movies (n)" heading in the added-movies section reaches n.
async function waitForCount(page, target, timeout = 90000) {
  await page.waitForFunction(
    (n) => {
      const h = [...document.querySelectorAll("h2")].find((el) =>
        /Movies \(\d+\)/.test(el.textContent || ""),
      );
      const m = h?.textContent?.match(/Movies \((\d+)\)/);
      return m ? Number(m[1]) >= n : false;
    },
    target,
    { timeout },
  );
}

async function smoothScrollToList(page) {
  await page.evaluate(() => {
    const h = [...document.querySelectorAll("h2")].find((el) =>
      el.textContent?.includes("Movies ("),
    );
    h?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

async function smoothScrollToTop(page) {
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "smooth" }));
}

// `vercel dev` compiles each API function the first time it is called, and that
// cold start can outlast the 20s wait for the first search results. Warm the
// endpoints through the request context, which bypasses the page entirely, so the
// compile cost is paid off-screen and never shows up as a spinner in the footage.
async function warmApis(page, baseUrl) {
  const endpoints = [
    "/api/search/movie?language=en-US&query=warmup&page=1",
    "/api/discover/movie?language=en-US&with_genres=27&page=1",
    "/api/movie/129?language=en-US",
    "/api/movie/129/watch/providers",
  ];
  await Promise.all(
    endpoints.map((endpoint) =>
      page.request.get(`${baseUrl}${endpoint}`, { timeout: 120000 }).catch(() => {}),
    ),
  );
}

export default async function collectionsSearch({ page, log, demo }) {
  await page.goto(demo.url, { waitUntil: "load" });

  // Started, not awaited: the onboarding clicks below give it time to finish.
  const warmed = warmApis(page, demo.url);

  // Onboarding (fresh browser profile on every run)
  const onboarding = page.getByText("Before you start");
  if (await onboarding.isVisible().catch(() => false)) {
    log("onboarding: English + United States");
    await page.getByRole("button", { name: /English/i }).first().click();
    await page.getByRole("button", { name: "Select a country" }).click();
    await page.getByRole("button", { name: "United States of America" }).first().click();
    await page.getByRole("button", { name: /continue/i }).click();
    await onboarding.waitFor({ state: "hidden", timeout: 10000 });
  }

  const search = page.getByPlaceholder("Search movie...");
  await search.waitFor({ state: "visible", timeout: 15000 });
  await warmed;
  await page.waitForTimeout(2000);

  // 1. Search for a single movie and add it to the list
  log("searching for a movie");
  await search.pressSequentially("Spirited Away", { delay: 110 });
  const card = page
    .locator("div.border.rounded-lg.shadow-md")
    .filter({ has: page.getByRole("heading", { name: "Spirited Away", exact: true }) })
    .first();
  await card.waitFor({ state: "visible", timeout: 60000 });
  await page.waitForTimeout(2500);
  await card.getByRole("button", { name: /Add to List/i }).click();
  await waitForCount(page, 1, 15000);
  await page.waitForTimeout(2200);

  // 2. Load a ready-made local collection (adds 16 movies)
  log("opening movie collections");
  await page.getByRole("button", { name: /Movie Collections/ }).click();
  const tile = page.getByRole("heading", { name: "Tarantino's favourites" });
  await tile.waitFor({ state: "visible", timeout: 10000 });
  await page.waitForTimeout(1800);
  log("loading the Tarantino collection");
  await tile.click();
  await waitForCount(page, 17);
  log("collection loaded");
  await smoothScrollToList(page);
  await page.waitForTimeout(2800);

  // The collection loader may report titles TMDB could not find; close the dialog.
  const closeDialog = page.getByRole("button", { name: "Close" });
  if (await closeDialog.isVisible().catch(() => false)) {
    log("closing not-found dialog");
    await closeDialog.click();
    await page.waitForTimeout(800);
  }

  // 3. Remove a single movie from the list
  log("removing one movie");
  await page.getByRole("button", { name: "Remove" }).first().click();
  await waitForCount(page, 16, 15000);
  await page.waitForTimeout(2200);

  // 4. Discover movies by genre and streaming platform
  log("opening search by platform");
  await smoothScrollToTop(page);
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Search Movies by Platform/ }).click();
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: /Horror/ }).click();
  await page.waitForTimeout(900);
  await page.getByRole("button", { name: "Netflix", exact: true }).first().click();
  await page.waitForTimeout(1600);
  log("discovering horror movies on Netflix");
  await page.getByRole("button", { name: "Discover Movies" }).click();
  await waitForCount(page, 17, 60000); // list grows past the 16 it had
  log("platform discovery added movies");
  await page.waitForTimeout(3200);

  // 5. Delete every movie from the list
  log("deleting all movies");
  await page.getByRole("button", { name: "Delete Movies" }).click();
  await page.waitForTimeout(1800);
  await smoothScrollToTop(page);
  await page.waitForTimeout(2000);
}
