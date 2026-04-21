// Shared types used across pi-superpowers features.
// Boundary-validated types live in their feature's schema.ts.

export type SuperpowersExtensionState = {
  bootstrapInjected: boolean;
  subagentAvailable: boolean;
};

export type DegradationReason = "vendor-missing" | "pi-agents-missing" | "skill-read-failed" | "agent-parse-failed";
