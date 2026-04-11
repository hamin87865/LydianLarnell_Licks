import test from "node:test";
import assert from "node:assert/strict";
import { isSupportedVideoUrl } from "../shared/videoPolicy";

test("video policy accepts youtube watch, share, and shorts URLs", () => {
  assert.equal(isSupportedVideoUrl("https://www.youtube.com/watch?v=abc123XYZ"), true);
  assert.equal(isSupportedVideoUrl("https://youtu.be/abc123XYZ"), true);
  assert.equal(isSupportedVideoUrl("https://www.youtube.com/shorts/abc123XYZ"), true);
});

test("video policy rejects unsupported URLs", () => {
  assert.equal(isSupportedVideoUrl("https://vimeo.com/12345"), false);
  assert.equal(isSupportedVideoUrl("https://www.youtube.com/embed/abc123XYZ"), false);
  assert.equal(isSupportedVideoUrl(""), false);
});
