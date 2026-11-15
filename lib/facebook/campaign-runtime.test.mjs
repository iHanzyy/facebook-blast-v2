import assert from "node:assert/strict";
import test from "node:test";

import {
  getCampaignStatus,
  startCampaign,
} from "./campaign-runtime.ts";

test("records category, timestamps, and a stable error code for each attempt", async () => {
  const started = startCampaign({
    caption: "Laptop siap pakai",
    groups: [
      {
        id: "laptop-bogor",
        name: "Jual Beli Laptop Bogor",
        url: "https://www.facebook.com/groups/laptop-bogor",
        category: "laptop",
        enabled: true,
        notes: "",
      },
    ],
    images: [],
    delayMin: 1,
    delayMax: 1,
  });

  assert.equal(started, true);

  await assert.doesNotReject(async () => {
    while (["running", "stopping"].includes(getCampaignStatus().phase)) {
      await new Promise((resolve) => setTimeout(resolve, 0));
    }
  });

  const status = getCampaignStatus();
  const [group] = status.groups;

  assert.equal(status.phase, "stopped");
  assert.ok(status.startedAt);
  assert.ok(status.finishedAt);
  assert.equal(group.category, "laptop");
  assert.equal(group.status, "failed");
  assert.equal(group.errorCode, "BROWSER_NOT_OPEN");
  assert.ok(group.startedAt);
  assert.ok(group.finishedAt);
});
