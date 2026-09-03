import assert from "node:assert/strict";
import test from "node:test";

import {
  randomDelaySeconds,
  runCampaignQueue,
  validateCampaignInput,
} from "./campaign.ts";

function image(overrides = {}) {
  return {
    name: "listing.jpg",
    size: 1024,
    type: "image/jpeg",
    ...overrides,
  };
}

test("validates campaign groups and integer delay range", () => {
  const valid = {
    caption: "iPhone siap pakai",
    groupIds: ["group-a", "group-b"],
    images: [image()],
    delayMin: 60,
    delayMax: 120,
  };

  assert.equal(validateCampaignInput(valid), null);
  assert.equal(
    validateCampaignInput({ ...valid, groupIds: [] })?.code,
    "GROUPS_REQUIRED",
  );
  assert.equal(
    validateCampaignInput({ ...valid, groupIds: ["group-a", "group-a"] })
      ?.code,
    "GROUPS_DUPLICATE",
  );
  assert.equal(
    validateCampaignInput({ ...valid, delayMin: 121 })?.code,
    "DELAY_INVALID",
  );
  assert.equal(
    validateCampaignInput({ ...valid, delayMin: 1.5 })?.code,
    "DELAY_INVALID",
  );
});

test("picks an inclusive random delay", () => {
  assert.equal(randomDelaySeconds(60, 120, () => 0), 60);
  assert.equal(randomDelaySeconds(60, 120, () => 0.999999), 120);
});

test("runs groups sequentially and waits only between groups", async () => {
  const events = [];

  const result = await runCampaignQueue({
    items: ["a", "b", "c"],
    shouldStop: () => false,
    process: async (item) => {
      events.push(`start:${item}`);
      await Promise.resolve();
      events.push(`end:${item}`);
    },
    wait: async () => {
      events.push("wait");
      return true;
    },
  });

  assert.equal(result, "completed");
  assert.deepEqual(events, [
    "start:a",
    "end:a",
    "wait",
    "start:b",
    "end:b",
    "wait",
    "start:c",
    "end:c",
  ]);
});

test("continues after a normal item failure", async () => {
  const processed = [];

  const result = await runCampaignQueue({
    items: ["a", "b"],
    shouldStop: () => false,
    process: async (item) => {
      processed.push(item);
      if (item === "a") throw new Error("group failed");
    },
    onError: () => "continue",
    wait: async () => true,
  });

  assert.equal(result, "completed");
  assert.deepEqual(processed, ["a", "b"]);
});

test("stops before the next group on a global error or stop request", async () => {
  const globalProcessed = [];
  const globalResult = await runCampaignQueue({
    items: ["a", "b"],
    shouldStop: () => false,
    process: async (item) => {
      globalProcessed.push(item);
      throw new Error("manual action");
    },
    onError: () => "stop",
    wait: async () => true,
  });

  let stopRequested = false;
  const stoppedProcessed = [];
  const stoppedResult = await runCampaignQueue({
    items: ["a", "b"],
    shouldStop: () => stopRequested,
    process: async (item) => {
      stoppedProcessed.push(item);
      stopRequested = true;
    },
    wait: async () => true,
  });

  assert.equal(globalResult, "stopped");
  assert.deepEqual(globalProcessed, ["a"]);
  assert.equal(stoppedResult, "stopped");
  assert.deepEqual(stoppedProcessed, ["a"]);
});
