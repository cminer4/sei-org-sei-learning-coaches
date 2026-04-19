import { describe, expect, it } from "vitest";
import {
  ADMIN_IMPORT_MAX_FILE_BYTES,
  isImportFileTooLarge,
} from "@/lib/adminImportLimits";

describe("admin import limits", () => {
  it("caps uploads at 10 MB (FR-004a)", () => {
    expect(ADMIN_IMPORT_MAX_FILE_BYTES).toBe(10 * 1024 * 1024);
    expect(isImportFileTooLarge(ADMIN_IMPORT_MAX_FILE_BYTES + 1)).toBe(true);
    expect(isImportFileTooLarge(ADMIN_IMPORT_MAX_FILE_BYTES)).toBe(false);
  });
});
