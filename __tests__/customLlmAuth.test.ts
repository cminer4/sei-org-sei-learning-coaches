import { describe, expect, it } from "vitest";
import { verifyCustomLlmBearer } from "@/lib/customLlmAuth";

describe("verifyCustomLlmBearer", () => {
  it("returns false when key is missing", () => {
    expect(verifyCustomLlmBearer("Bearer abc", undefined)).toBe(false);
  });

  it("returns false when header is missing", () => {
    expect(verifyCustomLlmBearer(null, "secret")).toBe(false);
  });

  it("returns false for wrong token", () => {
    expect(verifyCustomLlmBearer("Bearer wrong", "secret")).toBe(false);
  });

  it("returns true for exact match", () => {
    expect(verifyCustomLlmBearer("Bearer mykey", "mykey")).toBe(true);
  });
});
