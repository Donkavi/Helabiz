"use client";

import * as React from "react";
import { useActionState } from "react";
import { AlertCircle, Check, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { signUpAction, type AuthActionState } from "../actions";

const RULES = [
  { label: "At least 8 characters", test: (v: string) => v.length >= 8 },
  { label: "Contains a letter", test: (v: string) => /[a-zA-Z]/.test(v) },
  { label: "Contains a number", test: (v: string) => /[0-9]/.test(v) },
];

export function SignUpForm({ template }: { template?: string }) {
  const [state, action, pending] = useActionState<AuthActionState, FormData>(signUpAction, null);
  const [password, setPassword] = React.useState("");
  const [show, setShow] = React.useState(false);

  return (
    <form action={action} className="mt-5 space-y-4" noValidate>
      {template && <input type="hidden" name="template" value={template} />}

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
        <Label htmlFor="name">Your name</Label>
        <Input id="name" name="name" autoComplete="name" placeholder="Kavindu Perera" required aria-invalid={!!state?.fieldErrors?.name} />
        {state?.fieldErrors?.name && <p className="text-[12.5px] text-destructive">{state.fieldErrors.name}</p>}
      </div>

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
        />
        {state?.fieldErrors?.email && <p className="text-[12.5px] text-destructive">{state.fieldErrors.email}</p>}
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            name="password"
            type={show ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
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

        <ul className="mt-2.5 grid gap-1.5" aria-live="polite">
          {RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li key={rule.label} className="flex items-center gap-2 text-[12.5px]">
                <span
                  className={cn(
                    "flex size-3.5 items-center justify-center rounded-full transition-colors",
                    met ? "bg-primary text-primary-foreground" : "bg-muted",
                  )}
                >
                  {met && <Check className="size-2 stroke-[4]" />}
                </span>
                <span className={met ? "text-foreground" : "text-muted-foreground"}>{rule.label}</span>
              </li>
            );
          })}
        </ul>
      </div>

      <Button type="submit" className="w-full" size="lg" loading={pending}>
        {pending ? "Creating account…" : "Create free account"}
      </Button>
    </form>
  );
}
