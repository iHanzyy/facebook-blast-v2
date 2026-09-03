import assert from "node:assert/strict";
import test from "node:test";

import {
  isFacebookManualActionUrl,
  maxFacebookImageBytes,
  validateSinglePostInput,
} from "./post.ts";

function image(overrides = {}) {
  return {
    name: "listing.jpg",
    size: 1024,
    type: "image/jpeg",
    ...overrides,
  };
}

test("accepts one group, a caption, and supported images", () => {
  assert.equal(
    validateSinglePostInput({
      caption: "iPhone siap pakai",
      groupId: "183452144350195",
      images: [image(), image({ name: "detail.webp", type: "image/webp" })],
    }),
    null,
  );
});

test("requires a caption, one group, and at least one image", () => {
  assert.equal(
    validateSinglePostInput({ caption: "", groupId: "group", images: [image()] })
      ?.code,
    "CAPTION_REQUIRED",
  );
  assert.equal(
    validateSinglePostInput({ caption: "caption", groupId: "", images: [image()] })
      ?.code,
    "GROUP_REQUIRED",
  );
  assert.equal(
    validateSinglePostInput({ caption: "caption", groupId: "group", images: [] })
      ?.code,
    "IMAGE_REQUIRED",
  );
});

test("rejects captions longer than 5,000 characters", () => {
  assert.equal(
    validateSinglePostInput({
      caption: "a".repeat(5001),
      groupId: "group",
      images: [image()],
    })?.code,
    "CAPTION_TOO_LONG",
  );
});

test("rejects unsupported and oversized images", () => {
  assert.equal(
    validateSinglePostInput({
      caption: "caption",
      groupId: "group",
      images: [image({ type: "image/gif" })],
    })?.code,
    "IMAGE_TYPE_UNSUPPORTED",
  );
  assert.equal(
    validateSinglePostInput({
      caption: "caption",
      groupId: "group",
      images: [image({ size: maxFacebookImageBytes + 1 })],
    })?.code,
    "IMAGE_TOO_LARGE",
  );
});

test("recognizes Facebook login and checkpoint URLs as manual action", () => {
  for (const url of [
    "https://www.facebook.com/login/",
    "https://www.facebook.com/checkpoint/123",
    "https://www.facebook.com/two_step_verification/",
  ]) {
    assert.equal(isFacebookManualActionUrl(url), true);
  }

  assert.equal(
    isFacebookManualActionUrl("https://www.facebook.com/groups/183452144350195"),
    false,
  );
});
