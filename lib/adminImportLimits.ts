/** SEI-52 FR-004a: max upload size for POST /api/admin/documents/import */
export const ADMIN_IMPORT_MAX_FILE_BYTES = 10 * 1024 * 1024;

/** Processing budget; exceed => 408. */
export const ADMIN_IMPORT_PROCESSING_MS = 30_000;

export function isImportFileTooLarge(sizeBytes: number): boolean {
  return sizeBytes > ADMIN_IMPORT_MAX_FILE_BYTES;
}
