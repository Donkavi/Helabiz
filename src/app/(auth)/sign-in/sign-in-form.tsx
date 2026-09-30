"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signInAction, type AuthActionState } from "../actions";

export function SignInForm({ redirectTo, initialError }: { redirectTo?: string; initialError?: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(
    signInAction,
    initialError ? { error: initialError } : null,
  );
  const [show, setShow] = React.useState(false);

  return (
    <form action={action} className="mt-5 space-y-4" noValidate>
      <input type="hidden" name="redirectTo" value={redirectTo ?? "/dashboard"} />

      {state?.error && (
        <div
          role="alert"
          className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-[13px] text-destructive"
        >
          <AlertCircle className="mt-px size-4 shrink-0" />
          {state.error}
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          required
          aria-invalid={!!state?.fieldErrors?.email}
          aria-describedby={state?.fieldErrors?.email ? "email-error" : undefined}
        />
        {state?.fieldErrors?.email && (
          <p id="email-error" className="text-[12.5px] text-destructive">
            {state.fieldErrors.email}
          </p>
        )}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="current-password"
            placeholder="••••••••"
            required
            className="pr-10"
            aria-invalid={!!state?.fieldErrors?.password}
          />
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1 top-1 flex size-7.5 items-center justify-center rounded-md text-muted-foreground transition-colors hover:text-foreground"
            aria-label={show ? "Hide password" : "Show password"}
          >
            {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
          </button>
        </div>
        {state?.fieldErrors?.password && <p className="text-[12.5px] text-destructive">{state.fieldErrors.password}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {pending ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
