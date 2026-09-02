import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import {
  facebookBrowserChannel,
  hasSavedFacebookProfile,
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
