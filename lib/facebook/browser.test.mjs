import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { chromium } from "playwright";

import {
  facebookBrowserChannel,
  hasSavedFacebookProfile,
  setImagesThroughFileChooser,
} from "./browser.ts";

test("uses the installed Chrome channel for Facebook login", () => {
  assert.equal(facebookBrowserChannel, "chrome");
});

test("detects a Chromium profile only after its Local State file exists", () => {
  const directory = mkdtempSync(join(tmpdir(), "facebook-profile-"));
  const profileDirectory = join(directory, "facebook");

  try {
    assert.equal(hasSavedFacebookProfile(profileDirectory), false);

    mkdirSync(profileDirectory);
    writeFileSync(join(profileDirectory, "Local State"), "{}");

    assert.equal(hasSavedFacebookProfile(profileDirectory), true);
  } finally {
    rmSync(directory, { force: true, recursive: true });
  }
});

test("handles the Facebook file chooser instead of leaving a native dialog open", async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage();

  try {
    await page.setContent(`
      <button onclick="document.querySelector('input').click()">Foto/video</button>
      <input type="file" hidden>
    `);

    await setImagesThroughFileChooser(
      page,
      page.getByRole("button", { name: "Foto/video" }),
      [{
        buffer: Buffer.from("image"),
        mimeType: "image/jpeg",
        name: "listing.jpg",
      }],
    );

    const uploadedName = await page.locator('input[type="file"]').evaluate(
      (input) => input.files?.[0]?.name,
    );
    assert.equal(uploadedName, "listing.jpg");
  } finally {
    await browser.close();
  }
});
