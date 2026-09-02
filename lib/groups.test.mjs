import assert from "node:assert/strict";
import test from "node:test";

import { parseGroups } from "./groups.ts";

const group = {
  id: "group-1",
  name: "Jual Beli iPhone Bogor",
  url: "https://www.facebook.com/groups/group-1",
  enabled: true,
  notes: "",
};

test("returns only enabled groups", () => {
  const result = parseGroups({
    groups: [group, { ...group, id: "group-2", enabled: false }],
  });

  assert.deepEqual(result, [group]);
});

test("rejects invalid Facebook Group URLs", () => {
  assert.throws(
    () => parseGroups({ groups: [{ ...group, url: "https://example.com" }] }),
    /invalid group URL/i,
  );
});

test("rejects duplicate group IDs", () => {
  assert.throws(
    () => parseGroups({ groups: [group, group] }),
    /duplicate group ID/i,
  );
});
