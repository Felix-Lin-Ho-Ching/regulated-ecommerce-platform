export type AdminActionState = {
  ok?: boolean;
  error?: string;
  success?: string;
};

export const reasonRequiredMessage = "Reason is required for this action.";

export function optionalAuditNote(note: string, fallback: string): string {
  const trimmed = note.trim();
  return trimmed || fallback;
}

export function validateManualReason(note: string): { error: string } | { note: string } {
  const trimmed = note.trim();
  if (trimmed.length < 8) return { error: reasonRequiredMessage };
  return { note: trimmed };
}
