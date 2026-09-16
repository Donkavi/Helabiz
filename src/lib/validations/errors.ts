import type { ZodError } from "zod";

/** Flattens a Zod error into `{ fieldName: firstMessage }` for form rendering. */
export function fieldErrorsFrom(error: ZodError): Record<string, string> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? "form");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

export type ActionState<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error?: string; fieldErrors?: Record<string, string> }
  | null;
