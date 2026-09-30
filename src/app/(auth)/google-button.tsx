"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { signInWithGoogleAction } from "./actions";

/** Google's mark, which their branding rules require to be used as-is. */
function GoogleIcon() {
  return (
    <svg viewBox="0 0 18 18" className="size-4.5" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18Z"
      />
      <path fill="#FBBC05" d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33Z" />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" variant="outline" size="lg" className="w-full" loading={pending}>
      {!pending && <GoogleIcon />}
      {pending ? "Redirecting…" : label}
    </Button>
  );
}

/**
 * "Continue with Google", with the divider that separates it from the email
 * form below. Rendered only when Google credentials are configured.
 */
export function GoogleButton({ label, redirectTo }: { label: string; redirectTo?: string }) {
  return (
    <div className="mt-8">
      <form action={signInWithGoogleAction}>
        <input type="hidden" name="redirectTo" value={redirectTo ?? "/dashboard"} />
        <Submit label={label} />
      </form>

      <div className="mt-5 flex items-center gap-3" aria-hidden>
        <span className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-muted-foreground">or</span>
        <span className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}
