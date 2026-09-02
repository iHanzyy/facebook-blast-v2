import assert from "node:assert/strict";
import test from "node:test";

import { isSupportedImageType } from "./images.ts";

test("accepts JPG, PNG, and WEBP MIME types", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(isSupportedImageType(type), true);
  }
});

test("rejects unsupported image MIME types", () => {
  assert.equal(isSupportedImageType("image/gif"), false);
  assert.equal(isSupportedImageType("application/pdf"), false);
});
