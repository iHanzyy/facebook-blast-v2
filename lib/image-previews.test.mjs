import assert from "node:assert/strict";
import test from "node:test";

import { removeImagePreview } from "./image-previews.ts";

test("removes one preview without mutating the current preview list", () => {
  const first = { file: { name: "first.jpg" }, url: "blob:first" };
  const second = { file: { name: "second.jpg" }, url: "blob:second" };
  const current = [first, second];

  const next = removeImagePreview(current, first.url);

  assert.deepEqual(next, [second]);
  assert.deepEqual(current, [first, second]);
  assert.notEqual(next, current);
});
