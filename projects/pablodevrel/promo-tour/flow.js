import { writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// promo-tour: cinematic scroll through pablodevrel.com. Shows the hero, the
// "What I bring" cards, the start of the portfolio, five highlight cards
// (including the Amelu short playing), then returns to the top. Everything here
// is real page behavior: mouse moves, hovers, a real play click and scrolling.
// Zooms and captions come from video.json.

const here = path.dirname(fileURLToPath(import.meta.url));

const yOf = (page, selector) =>
  page.evaluate((sel) => {
    const el = document.querySelector(sel);
    if (!el) throw new Error(`missing selector: ${sel}`);
    return el.getBoundingClientRect().top + window.scrollY;
  }, selector);

// videolab injects its pointer overlay into every frame, so moving the mouse
// into an embedded iframe leaves a stale arrow behind in the page. Hide the page
// copy while the pointer is inside the embed and bring it back afterwards.
const setCursorVisible = (page, visible) =>
  page.evaluate((v) => {
    const cursor = document.getElementById("videolab-cursor");
    if (cursor) cursor.style.display = v ? "" : "none";
  }, visible);

// Eased scroll. Long durations give the shot a drift instead of a jump.
const scrollTo = (page, top, duration) =>
  page.evaluate(
    ({ top, duration }) =>
      new Promise((resolve) => {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const from = window.scrollY;
        const to = Math.max(0, Math.min(max, top));
        const started = performance.now();
        const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);
        const step = (now) => {
          const p = Math.min(1, (now - started) / duration);
          window.scrollTo({ top: from + (to - from) * ease(p), behavior: "instant" });
          if (p < 1) requestAnimationFrame(step);
          else resolve();
        };
        requestAnimationFrame(step);
      }),
    { top, duration },
  );

// Moves the pointer to an element that is already on screen. Never uses
// locator.hover(), which would scroll the page on its own.
async function moveTo(page, selector, { x = 0.5, y = 0.5, steps = 24 } = {}) {
  const box = await page.locator(selector).first().boundingBox();
  if (!box) throw new Error(`nothing to point at: ${selector}`);
  await page.mouse.move(box.x + box.width * x, box.y + box.height * y, { steps });
}

// The Amelu card embeds a LinkedIn post. The embed is an iframe on
// linkedin.com, and LinkedIn shows a cookie consent bar over the post until
// someone answers it. Clear it while the card is still below the fold so the
// bar never appears in the footage; the choice persists for the session.
async function linkedinFrame(page, timeout = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    const frame = page.frames().find((f) => f.url().includes("linkedin.com/embed"));
    if (frame) return frame;
    await page.waitForTimeout(300);
  }
  return null;
}

async function dismissLinkedInConsent(page) {
  const frame = await linkedinFrame(page);
  if (!frame) return false;
  const accept = frame.getByRole("button", { name: "Accept", exact: true });
  const count = await accept.count().catch(() => 0);
  if (!count) return false;
  // evaluate(el => el.click()) answers the bar without scrolling it into view.
  await accept.first().evaluate((el) => el.click());
  return true;
}

export default async function promoTour({ page, log, demo }) {
  const started = Date.now();
  const marks = {};
  const mark = (name) => {
    marks[name] = Number(((Date.now() - started) / 1000).toFixed(2));
  };

  // videolab's cursor overlay starts at the top-left corner and only moves on
  // the first real mousemove, which has to wait for the load event. Park it in
  // the hero the moment the overlay is inserted so the opening shot does not
  // start with an arrow stuck in the corner. Presentation only: the overlay is
  // videolab's, not part of the page.
  await page.context().addInitScript(() => {
    const observer = new MutationObserver(() => {
      const cursor = document.getElementById("videolab-cursor");
      if (!cursor) return;
      cursor.style.left = "760px";
      cursor.style.top = "430px";
      observer.disconnect();
    });
    observer.observe(document, { childList: true, subtree: true });
  });

  await page.goto(demo.url, { waitUntil: "load", timeout: 90000 });
  // Park the pointer inside the hero right away. The cursor overlay starts at
  // the top-left corner and would sit on the header until the first mouse move.
  await page.mouse.move(760, 430, { steps: 6 });
  await page.evaluate(() => document.fonts.ready);

  // Icons are replaced by the iconify CDN script; wait until they have painted
  // so the first frame of footage is not missing glyphs.
  await page
    .waitForFunction(
      () =>
        document.querySelectorAll("iconify-icon").length > 0 &&
        [...document.querySelectorAll("iconify-icon")].every((el) => el.shadowRoot?.querySelector("svg")),
      null,
      { timeout: 30000 },
    )
    .catch(() => log("icons still loading, continuing"));

  // The hero uses a CSS background image; decode it before the camera rolls.
  await page.evaluate(async () => {
    const el = document.querySelector(".hero");
    const match = getComputedStyle(el).backgroundImage.match(/url\("?(.*?)"?\)/);
    if (!match) return;
    const img = new Image();
    img.src = match[1];
    await img.decode().catch(() => {});
  });

  log("hero");
  await page.mouse.move(768, 300, { steps: 12 });
  await page.waitForTimeout(2600);
  mark("hero");

  // The CV button lifts and darkens on hover.
  log("hovering the CV button");
  await moveTo(page, ".cv-link.devrel");
  await page.waitForTimeout(1500);
  mark("cv");
  await page.mouse.move(700, 520, { steps: 18 });
  await page.waitForTimeout(200);

  log("what I bring");
  await scrollTo(page, (await yOf(page, ".why-content")) - 120, 1500);
  await page.waitForTimeout(200);
  mark("why");

  await moveTo(page, ".why-card:nth-child(3)");
  await page.waitForTimeout(1500);
  mark("whyCardA");
  await moveTo(page, ".why-card:nth-child(2)");
  await page.waitForTimeout(1400);
  mark("whyCardB");

  log("portfolio heading and first card");
  await scrollTo(page, (await yOf(page, ".timeline-section .section-title")) - 150, 1400);
  await page.waitForTimeout(300);
  mark("portfolio");

  await moveTo(page, ".timeline-item:nth-child(1) h4");
  await page.waitForTimeout(1600);
  mark("tabnasHover");
  await moveTo(page, ".timeline-item:nth-child(1) .timeline-link");
  await page.waitForTimeout(1300);
  mark("tabnasLink");

  log("API talk card");
  await scrollTo(page, (await yOf(page, ".timeline-item:nth-child(2)")) - 100, 1400);
  await page.waitForTimeout(300);
  mark("bff");
  await moveTo(page, ".timeline-item:nth-child(2) h4");
  await page.waitForTimeout(2000);
  mark("bffHover");

  log("amelu linkedin card");
  const consentCleared = await dismissLinkedInConsent(page);
  log(consentCleared ? "linkedin consent bar cleared off screen" : "no linkedin consent bar found");

  // Frame the card first so the title and description read, then drift down to
  // centre the vertical video and play it for a few seconds.
  await scrollTo(page, (await yOf(page, ".timeline-item:nth-child(3)")) - 100, 1600);
  await page.waitForTimeout(1500);
  mark("ameluCard");

  await scrollTo(page, (await yOf(page, ".timeline-item:nth-child(3)")) + 180, 950);
  await page.waitForTimeout(700);
  mark("ameluVideo");

  const li = await linkedinFrame(page);
  const videoBox = li ? await li.locator("video").first().boundingBox() : null;
  if (videoBox) {
    const x = videoBox.x + videoBox.width / 2;
    const y = Math.min(videoBox.y + videoBox.height / 2, 720);
    await setCursorVisible(page, false);
    await page.mouse.move(x, y, { steps: 26 });
    await page.waitForTimeout(300);
    await page.mouse.click(x, y);
    log("playing the linkedin video");
  } else {
    log("linkedin video not found, holding the card");
  }
  await page.waitForTimeout(7400);
  mark("ameluPlayed");

  // Leave the embed clean: drop the iframe copy of the pointer, walk out to an
  // empty column and restore the page copy before the next scene.
  if (li) {
    await li
      .evaluate(() => {
        const cursor = document.getElementById("videolab-cursor");
        if (cursor) cursor.style.display = "none";
      })
      .catch(() => {});
  }
  await page.mouse.move(1180, 640, { steps: 24 });
  await setCursorVisible(page, true);
  await page.waitForTimeout(250);

  log("dev.to tutorial card");
  await scrollTo(page, (await yOf(page, ".timeline-item:nth-child(4)")) - 100, 2100);
  await page.waitForTimeout(300);
  mark("tutorial");
  await moveTo(page, ".timeline-item:nth-child(4) h4");
  await page.waitForTimeout(1900);
  mark("tutorialHover");

  // One long glide down the timeline: the page keeps going.
  log("gliding down the portfolio");
  await scrollTo(page, (await yOf(page, ".timeline-item:nth-child(8)")) - 100, 4200);
  await page.waitForTimeout(300);
  mark("owasp");
  await moveTo(page, ".timeline-item:nth-child(8) .timeline-link[href*='GuardSquare']");
  await page.waitForTimeout(2100);
  mark("owaspHover");

  log("movie kombat card");
  await scrollTo(page, (await yOf(page, ".timeline-item:nth-child(10)")) - 100, 2400);
  await page.waitForTimeout(300);
  mark("kombat");
  await moveTo(page, ".timeline-item:nth-child(10) .timeline-link[href*='moviekombat']");
  await page.waitForTimeout(2300);
  mark("kombatHover");

  log("back to the top");
  await scrollTo(page, 0, 3200);
  await page.waitForTimeout(600);
  await moveTo(page, ".cv-link.devrel");
  await page.waitForTimeout(1600);
  mark("top");

  writeFileSync(path.join(here, "flow-timings.json"), JSON.stringify(marks, null, 2));
  log(`marks written: ${Object.keys(marks).length}`);
}
