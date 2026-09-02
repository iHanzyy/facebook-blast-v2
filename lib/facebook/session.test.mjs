import assert from "node:assert/strict";
import test from "node:test";

import { isSameOriginRequest } from "./session.ts";

test("accepts a same-origin browser request", () => {
  const request = new Request("http://localhost:3000/api/facebook/session", {
    headers: { origin: "http://localhost:3000" },
    method: "POST",
  });

  assert.equal(isSameOriginRequest(request), true);
});

test("rejects cross-origin and missing-origin requests", () => {
  const crossOrigin = new Request(
    "http://localhost:3000/api/facebook/session",
    {
      headers: { origin: "https://example.com" },
      method: "POST",
    },
  );
  const missingOrigin = new Request(
    "http://localhost:3000/api/facebook/session",
    { method: "POST" },
  );

  assert.equal(isSameOriginRequest(crossOrigin), false);
  assert.equal(isSameOriginRequest(missingOrigin), false);
});
