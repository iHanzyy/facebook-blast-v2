import { existsSync } from "node:fs";
import { join } from "node:path";

import { chromium, type BrowserContext } from "playwright";

import type { FacebookSessionStatus } from "./session";

const facebookUrl = "https://www.facebook.com/";
export const facebookBrowserChannel = "chrome";
const profileDirectory = join(
  process.cwd(),
  "playwright-data",
  "facebook",
);

let activeContext: BrowserContext | null = null;

export function hasSavedFacebookProfile(directory = profileDirectory) {
  return existsSync(join(directory, "Local State"));
}

export function getFacebookSessionStatus(): FacebookSessionStatus {
  return {
    hasSavedProfile: hasSavedFacebookProfile(),
    isBrowserOpen: activeContext !== null,
  };
}

export async function openFacebookLogin(): Promise<FacebookSessionStatus> {
  if (activeContext) {
    const page = activeContext.pages()[0] ?? (await activeContext.newPage());
    await page.bringToFront();
    return getFacebookSessionStatus();
  }

  // A dedicated userDataDir keeps cookies/local storage between runs.
  // Source: https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
  const context = await chromium.launchPersistentContext(profileDirectory, {
    channel: facebookBrowserChannel,
    headless: false,
  });

  activeContext = context;
  context.on("close", () => {
    if (activeContext === context) activeContext = null;
  });

  const page = context.pages()[0] ?? (await context.newPage());

  try {
    await page.goto(facebookUrl, {
      timeout: 30_000,
      waitUntil: "domcontentloaded",
    });
  } catch {
    // Keep the visible browser open so the user can retry manually.
  }

  return getFacebookSessionStatus();
}
