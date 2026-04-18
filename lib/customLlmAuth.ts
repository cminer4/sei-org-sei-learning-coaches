import { timingSafeEqual } from "crypto";

/**
 * Validates ElevenLabs Custom LLM Bearer token against INTERVIEW_COACH_CUSTOM_LLM_API_KEY.
 */
export function verifyCustomLlmBearer(
  authHeader: string | null,
  expectedKey: string | undefined,
): boolean {
  if (!expectedKey || !authHeader || !authHeader.startsWith("Bearer ")) {
    return false;
  }
  const token = authHeader.slice(7).trim();
  const a = Buffer.from(token, "utf8");
  const b = Buffer.from(expectedKey, "utf8");
  if (a.length !== b.length) {
    return false;
  }
  return timingSafeEqual(a, b);
}
