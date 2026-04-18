/**
 * Minimal config for Assessment Coach flows (SPIN-specific copy removed for SEI-51).
 */
export const agentConfig = {
  orgName: "SEI",
  objectivesPrompt: (role: string, company: string, contextType: string) =>
    `Generate 4-5 specific learning objectives for a ${role} at ${company} preparing for ${contextType} (AI Assessment product practice).
Return only a JSON array of strings. No extra text. DO NOT use emojis.`,
};
