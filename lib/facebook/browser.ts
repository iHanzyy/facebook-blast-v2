import { existsSync } from "node:fs";
import { join } from "node:path";

import {
  chromium,
  type BrowserContext,
  type Locator,
  type Page,
} from "playwright";

import type { FacebookGroup } from "../groups.ts";
import {
  type FacebookPostErrorCode,
  isFacebookManualActionUrl,
} from "./post.ts";
import { facebookComposerNames } from "./selectors.ts";
import type { FacebookSessionStatus } from "./session.ts";

const facebookUrl = "https://www.facebook.com/";
export const facebookBrowserChannel = "chrome";
const profileDirectory = join(
  process.cwd(),
  "playwright-data",
  "facebook",
);

type FacebookRuntime = {
  context: BrowserContext | null;
  isPosting: boolean;
};

const globalRuntime = globalThis as typeof globalThis & {
  __facebookPosterRuntime?: FacebookRuntime;
};
const runtime = (globalRuntime.__facebookPosterRuntime ??= {
  context: null,
  isPosting: false,
});

export type FacebookPostImage = {
  buffer: Buffer;
  mimeType: string;
  name: string;
};

export async function setImagesThroughFileChooser(
  page: Page,
  trigger: Locator,
  images: FacebookPostImage[],
) {
  // Register the listener before clicking so Chrome never opens a native dialog.
  // Source: https://playwright.dev/docs/input#upload-files
  const [fileChooser] = await Promise.all([
    page.waitForEvent("filechooser", { timeout: 20_000 }),
    trigger.click({ timeout: 20_000 }),
  ]);
  await fileChooser.setFiles(images);
}

export class FacebookPostingError extends Error {
  readonly code: FacebookPostErrorCode;

  constructor(code: FacebookPostErrorCode, message: string) {
    super(message);
    this.code = code;
    this.name = "FacebookPostingError";
  }
}

export function hasSavedFacebookProfile(directory = profileDirectory) {
  return existsSync(join(directory, "Local State"));
}

export function getFacebookSessionStatus(): FacebookSessionStatus {
  return {
    hasSavedProfile: hasSavedFacebookProfile(),
    isBrowserOpen: runtime.context !== null,
  };
}

export async function openFacebookLogin(): Promise<FacebookSessionStatus> {
  if (runtime.context) {
    const page = runtime.context.pages()[0] ?? (await runtime.context.newPage());
    await page.bringToFront();
    return getFacebookSessionStatus();
  }

  // A dedicated userDataDir keeps cookies/local storage between runs.
  // Source: https://playwright.dev/docs/api/class-browsertype#browser-type-launch-persistent-context
  const context = await chromium.launchPersistentContext(profileDirectory, {
    channel: facebookBrowserChannel,
    headless: false,
  });

  runtime.context = context;
  context.on("close", () => {
    if (runtime.context === context) runtime.context = null;
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

function assertNoManualAction(page: Page) {
  if (isFacebookManualActionUrl(page.url())) {
    throw new FacebookPostingError(
      "MANUAL_ACTION_REQUIRED",
      "Facebook meminta login atau verifikasi manual.",
    );
  }
}

export async function postToFacebookGroup(input: {
  caption: string;
  group: FacebookGroup;
  images: FacebookPostImage[];
}) {
  if (!runtime.context) {
    throw new FacebookPostingError(
      "BROWSER_NOT_OPEN",
      "Buka window Facebook terlebih dahulu.",
    );
  }
  if (runtime.isPosting) {
    throw new FacebookPostingError(
      "POST_FAILED",
      "Posting lain sedang berjalan.",
    );
  }

  runtime.isPosting = true;
  try {
    const page = runtime.context.pages()[0] ?? (await runtime.context.newPage());
    await page.bringToFront();

    console.log(`[Facebook] Opening ${input.group.name}`);
    try {
      await page.goto(input.group.url, {
        timeout: 30_000,
        waitUntil: "domcontentloaded",
      });
    } catch {
      throw new FacebookPostingError(
        "GROUP_NAVIGATION_FAILED",
        "Halaman grup tidak dapat dibuka. Periksa koneksi atau akses grup.",
      );
    }
    assertNoManualAction(page);

    // Prefer accessible roles and names so selectors match the visible UI.
    // Source: https://playwright.dev/docs/locators#locate-by-role
    const composerTrigger = page.getByRole("button", {
      name: facebookComposerNames.open,
      exact: true,
    });
    try {
      await composerTrigger.click({ timeout: 20_000 });
    } catch {
      assertNoManualAction(page);
      throw new FacebookPostingError(
        "COMPOSER_NOT_FOUND",
        "Composer Facebook tidak ditemukan atau group tidak mengizinkan posting.",
      );
    }

    const dialog = page
      .getByRole("dialog", {
        name: facebookComposerNames.dialog,
        exact: true,
      })
      .first();
    await dialog
      .getByRole("status", { name: facebookComposerNames.loading })
      .first()
      .waitFor({ state: "hidden", timeout: 20_000 });
    console.log("[Facebook] Composer opened");

    await dialog.getByRole("textbox").fill(input.caption);
    console.log(`[Facebook] Uploading ${input.images.length} images`);
    try {
      await setImagesThroughFileChooser(
        page,
        dialog.getByRole("button", {
          name: facebookComposerNames.photo,
          exact: true,
        }),
        input.images,
      );
    } catch {
      assertNoManualAction(page);
      throw new FacebookPostingError(
        "IMAGE_UPLOAD_FAILED",
        "Gambar tidak berhasil dimuat ke composer Facebook.",
      );
    }

    console.log("[Facebook] Posting");
    try {
      await dialog
        .getByRole("button", {
          name: facebookComposerNames.submit,
          exact: true,
        })
        .click({ timeout: 90_000 });
      await dialog.waitFor({ state: "hidden", timeout: 90_000 });
    } catch {
      assertNoManualAction(page);
      throw new FacebookPostingError(
        "POST_SUBMIT_FAILED",
        "Facebook tidak mengonfirmasi bahwa posting berhasil dikirim.",
      );
    }
    assertNoManualAction(page);
    console.log("[Facebook] Success");
  } catch (error) {
    if (error instanceof FacebookPostingError) throw error;
    if (!runtime.context) {
      throw new FacebookPostingError(
        "BROWSER_NOT_OPEN",
        "Window Facebook tertutup. Buka kembali sebelum melanjutkan.",
      );
    }
    throw new FacebookPostingError(
      "POST_FAILED",
      "Posting gagal. Periksa window Facebook lalu coba lagi.",
    );
  } finally {
    runtime.isPosting = false;
  }
}
