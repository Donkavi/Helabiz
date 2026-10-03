"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, LogOut } from "lucide-react";
import type { SiteContext } from "@/lib/website/render-types";
import { SRI_LANKA_DISTRICTS } from "@/lib/sri-lanka";
import { SiteLink } from "../primitives";

/**
 * The forms behind customer accounts on a shop's website. Each posts JSON to
 * `/api/site/account/<action>`, which sets or clears the session cookie.
 *
 * Styled with the site's own theme variables, like the checkout, so the
 * account pages look like part of the shop and not like Helabiz.
 */

const inputStyle: React.CSSProperties = {
  width: "100%",
  font: "inherit",
  fontSize: 14.5,
  padding: "11px 13px",
  borderRadius: "calc(var(--w-radius) * .8)",
  border: "1px solid color-mix(in srgb,var(--w-text) 18%,transparent)",
  background: "var(--w-bg)",
  color: "inherit",
};

type ApiResult = { ok: boolean; error?: string; field?: string; needsOrderProof?: boolean };

async function post(action: string, body: Record<string, unknown>): Promise<ApiResult> {
  try {
    const response = await fetch(`/api/site/account/${action}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return (await response.json()) as ApiResult;
  } catch {
    return { ok: false, error: "Something went wrong. Please check your connection and try again." };
  }
}

/** Only paths on this site, so `?next=` cannot send anyone elsewhere. */
function safeNext(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

/** Navigates within the site, then refetches so server components see the new session. */
function useGo(ctx: SiteContext) {
  const router = useRouter();
  return (path: string) => {
    router.replace(`${ctx.basePath}${path}`);
    router.refresh();
  };
}

function formValues(form: HTMLFormElement) {
  return Object.fromEntries([...new FormData(form)].map(([key, value]) => [key, String(value)]));
}

function useAction() {
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<{ message: string; field?: string } | null>(null);

  const run = async (action: string, body: Record<string, unknown>) => {
    setPending(true);
    setError(null);
    const result = await post(action, body);
    if (!result.ok) setError({ message: result.error ?? "Please try again.", field: result.field });
    setPending(false);
    return result;
  };

  return { pending, error, setError, run };
}

export function SignInForm({ ctx, businessSlug, next }: { ctx: SiteContext; businessSlug: string; next?: string }) {
  const go = useGo(ctx);
  const { pending, error, run } = useAction();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const result = await run("sign-in", { businessSlug, login: values.login, password: values.password });
    if (result.ok) go(safeNext(next));
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <Field label="Email or phone number" name="login" required autoComplete="username" />
      <PasswordField label="Password" name="password" autoComplete="current-password" />
      <div style={{ textAlign: "right", marginTop: -4 }}>
        <SiteLink ctx={ctx} href="/account/forgot">
          <span style={{ fontSize: 13, color: "var(--w-primary)", fontWeight: 500 }}>Forgot your password?</span>
        </SiteLink>
      </div>
      <FormError error={error?.message} />
      <Submit pending={pending} label="Sign in" pendingLabel="Signing in…" />
      <p className="w-muted" style={{ fontSize: 13.5, textAlign: "center" }}>
        New here?{" "}
        <SiteLink ctx={ctx} href={next ? `/account/register?next=${encodeURIComponent(next)}` : "/account/register"}>
          <span style={{ color: "var(--w-primary)", fontWeight: 600 }}>Create an account</span>
        </SiteLink>
      </p>
    </form>
  );
}

export function RegisterForm({ ctx, businessSlug, next }: { ctx: SiteContext; businessSlug: string; next?: string }) {
  const go = useGo(ctx);
  const { pending, error, run } = useAction();
  const [needsProof, setNeedsProof] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const result = await run("register", {
      businessSlug,
      name: values.name,
      phone: values.phone,
      email: values.email,
      password: values.password,
      orderNumber: values.orderNumber ?? "",
    });
    if (result.needsOrderProof) setNeedsProof(true);
    if (result.ok) go(safeNext(next));
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <Field label="Full name" name="name" required autoComplete="name" />
      <Field
        label="Phone number"
        name="phone"
        type="tel"
        required
        autoComplete="tel"
        placeholder="077 123 4567"
        invalid={error?.field === "phone"}
      />
      <Field label="Email" name="email" type="email" required autoComplete="email" invalid={error?.field === "email"} />
      <PasswordField label="Password" name="password" autoComplete="new-password" hint="At least 8 characters." />

      {needsProof && (
        <div
          style={{
            padding: 14,
            borderRadius: "calc(var(--w-radius) * .8)",
            background: "color-mix(in srgb,var(--w-primary) 8%,transparent)",
            display: "grid",
            gap: 10,
          }}
        >
          <p style={{ fontSize: 13.5, lineHeight: 1.6 }}>
            Welcome back! This number has ordered here before. Enter the number of any order you placed, so we know
            your order history is really yours. You will find it on your order confirmation.
          </p>
          <Field
            label="One of your order numbers"
            name="orderNumber"
            required
            placeholder="ORD-1042"
            invalid={error?.field === "orderNumber"}
          />
        </div>
      )}

      <FormError error={error?.message} />
      <Submit pending={pending} label="Create account" pendingLabel="Creating your account…" />
      <p className="w-muted" style={{ fontSize: 13.5, textAlign: "center" }}>
        Already have an account?{" "}
        <SiteLink ctx={ctx} href={next ? `/account/sign-in?next=${encodeURIComponent(next)}` : "/account/sign-in"}>
          <span style={{ color: "var(--w-primary)", fontWeight: 600 }}>Sign in</span>
        </SiteLink>
      </p>
    </form>
  );
}

export function ForgotForm({ ctx, businessSlug }: { ctx: SiteContext; businessSlug: string }) {
  const { pending, error, run } = useAction();
  const [sentTo, setSentTo] = React.useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const result = await run("forgot", { businessSlug, email: values.email });
    if (result.ok) setSentTo(values.email);
  };

  if (sentTo) {
    return (
      <div style={{ display: "grid", gap: 14 }}>
        <Notice>
          If <strong>{sentTo}</strong> belongs to an account here, we have sent it a link to choose a new password. It
          works for one hour. Check your spam folder if it does not arrive.
        </Notice>
        <SiteLink ctx={ctx} href="/account/sign-in" className="w-btn w-btn--outline">
          Back to sign in
        </SiteLink>
      </div>
    );
  }

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <Field label="Email" name="email" type="email" required autoComplete="email" />
      <FormError error={error?.message} />
      <Submit pending={pending} label="Send reset link" pendingLabel="Sending…" />
      <p className="w-muted" style={{ fontSize: 13.5, textAlign: "center" }}>
        Remembered it?{" "}
        <SiteLink ctx={ctx} href="/account/sign-in">
          <span style={{ color: "var(--w-primary)", fontWeight: 600 }}>Sign in</span>
        </SiteLink>
      </p>
    </form>
  );
}

export function ResetForm({ ctx, businessSlug, token }: { ctx: SiteContext; businessSlug: string; token: string }) {
  const go = useGo(ctx);
  const { pending, error, run } = useAction();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = formValues(event.currentTarget);
    const result = await run("reset", { businessSlug, token, password: values.password });
    if (result.ok) go("/account");
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <PasswordField label="New password" name="password" autoComplete="new-password" hint="At least 8 characters." />
      <FormError error={error?.message} />
      <Submit pending={pending} label="Save new password" pendingLabel="Saving…" />
    </form>
  );
}

export type ProfileValues = { name: string; phone: string; email: string; address: string; city: string; district: string };

export function ProfileForm({ businessSlug, initial }: { businessSlug: string; initial: ProfileValues }) {
  const { pending, error, run } = useAction();
  const [saved, setSaved] = React.useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    const values = formValues(event.currentTarget);
    const result = await run("profile", { businessSlug, ...values });
    if (result.ok) setSaved(true);
  };

  return (
    <form onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <Field label="Full name" name="name" required autoComplete="name" defaultValue={initial.name} />
      <Field
        label="Phone number"
        name="phone_display"
        defaultValue={initial.phone}
        disabled
        hint="Your phone number is how the shop knows you. Contact them to change it."
      />
      <Field
        label="Email"
        name="email"
        type="email"
        required
        autoComplete="email"
        defaultValue={initial.email}
        invalid={error?.field === "email"}
      />
      <Field label="Address" name="address" autoComplete="street-address" textarea defaultValue={initial.address} />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(150px,1fr))", gap: 14 }}>
        <Field label="City" name="city" autoComplete="address-level2" defaultValue={initial.city} />
        <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500 }}>
          District
          <select name="district" style={inputStyle} defaultValue={initial.district}>
            <option value="">Select district</option>
            {SRI_LANKA_DISTRICTS.map((district) => (
              <option key={district} value={district}>
                {district}
              </option>
            ))}
          </select>
        </label>
      </div>
      <FormError error={error?.message} />
      {saved && <Notice>Your details are saved. We will use them to fill in your next checkout.</Notice>}
      <Submit pending={pending} label="Save details" pendingLabel="Saving…" />
    </form>
  );
}

export function PasswordForm({ businessSlug }: { businessSlug: string }) {
  const { pending, error, run } = useAction();
  const [saved, setSaved] = React.useState(false);
  const formRef = React.useRef<HTMLFormElement>(null);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaved(false);
    const values = formValues(event.currentTarget);
    const result = await run("password", {
      businessSlug,
      currentPassword: values.currentPassword,
      newPassword: values.newPassword,
    });
    if (result.ok) {
      setSaved(true);
      formRef.current?.reset();
    }
  };

  return (
    <form ref={formRef} onSubmit={submit} style={{ display: "grid", gap: 14 }}>
      <PasswordField label="Current password" name="currentPassword" autoComplete="current-password" />
      <PasswordField label="New password" name="newPassword" autoComplete="new-password" hint="At least 8 characters." />
      <FormError error={error?.message} />
      {saved && <Notice>Password changed. Any other device you were signed in on has been signed out.</Notice>}
      <Submit pending={pending} label="Change password" pendingLabel="Saving…" variant="outline" />
    </form>
  );
}

export function SignOutButton({ ctx, businessSlug }: { ctx: SiteContext; businessSlug: string }) {
  const go = useGo(ctx);
  const [pending, setPending] = React.useState(false);
  return (
    <button
      type="button"
      className="w-btn w-btn--outline"
      disabled={pending}
      onClick={async () => {
        setPending(true);
        await post("sign-out", { businessSlug });
        go("/");
      }}
    >
      {pending ? <Loader2 size={15} className="w-spin" /> : <LogOut size={15} />}
      Sign out
    </button>
  );
}

/* ── Pieces ─────────────────────────────────────────────────────────────── */

function Field({
  label,
  name,
  type = "text",
  required,
  autoComplete,
  hint,
  textarea,
  placeholder,
  defaultValue,
  disabled,
  invalid,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  autoComplete?: string;
  hint?: string;
  textarea?: boolean;
  placeholder?: string;
  defaultValue?: string;
  disabled?: boolean;
  invalid?: boolean;
}) {
  const style = {
    ...inputStyle,
    ...(invalid ? { borderColor: "#b4341f" } : null),
    ...(disabled ? { opacity: 0.6, cursor: "not-allowed" } : null),
  };
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500 }}>
      <span>
        {label}
        {required && <span style={{ color: "#b4341f" }}> *</span>}
      </span>
      {textarea ? (
        <textarea
          name={name}
          required={required}
          rows={3}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          style={{ ...style, resize: "vertical" }}
        />
      ) : (
        <input
          name={disabled ? undefined : name}
          type={type}
          required={required}
          autoComplete={autoComplete}
          placeholder={placeholder}
          defaultValue={defaultValue}
          disabled={disabled}
          aria-invalid={invalid || undefined}
          style={style}
        />
      )}
      {hint && (
        <span className="w-muted" style={{ fontSize: 12, fontWeight: 400 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function PasswordField({
  label,
  name,
  autoComplete,
  hint,
}: {
  label: string;
  name: string;
  autoComplete: string;
  hint?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  return (
    <label style={{ display: "grid", gap: 6, fontSize: 13, fontWeight: 500 }}>
      <span>
        {label}
        <span style={{ color: "#b4341f" }}> *</span>
      </span>
      <span style={{ position: "relative", display: "block" }}>
        <input
          name={name}
          type={visible ? "text" : "password"}
          required
          minLength={autoComplete === "new-password" ? 8 : undefined}
          autoComplete={autoComplete}
          style={{ ...inputStyle, paddingRight: 42 }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          style={{
            position: "absolute",
            right: 6,
            top: "50%",
            transform: "translateY(-50%)",
            background: "none",
            border: 0,
            padding: 6,
            cursor: "pointer",
            color: "inherit",
            opacity: 0.6,
          }}
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </span>
      {hint && (
        <span className="w-muted" style={{ fontSize: 12, fontWeight: 400 }}>
          {hint}
        </span>
      )}
    </label>
  );
}

function Submit({
  pending,
  label,
  pendingLabel,
  variant = "solid",
}: {
  pending: boolean;
  label: string;
  pendingLabel: string;
  variant?: "solid" | "outline";
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className={`w-btn w-btn--${variant}`}
      style={{ width: "100%", opacity: pending ? 0.7 : 1 }}
    >
      {pending && <Loader2 size={15} className="w-spin" />}
      {pending ? pendingLabel : label}
    </button>
  );
}

function FormError({ error }: { error?: string }) {
  if (!error) return null;
  return (
    <p
      role="alert"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: "calc(var(--w-radius) * .7)",
        background: "rgba(180,52,31,.1)",
        color: "#b4341f",
        fontSize: 13,
        lineHeight: 1.5,
      }}
    >
      <AlertCircle size={15} style={{ flexShrink: 0, marginTop: 1 }} />
      {error}
    </p>
  );
}

function Notice({ children }: { children: React.ReactNode }) {
  return (
    <p
      role="status"
      style={{
        display: "flex",
        gap: 8,
        alignItems: "flex-start",
        padding: "10px 12px",
        borderRadius: "calc(var(--w-radius) * .7)",
        background: "color-mix(in srgb,var(--w-primary) 10%,transparent)",
        fontSize: 13,
        lineHeight: 1.6,
      }}
    >
      <CheckCircle2 size={15} style={{ flexShrink: 0, marginTop: 2, color: "var(--w-primary)" }} />
      <span>{children}</span>
    </p>
  );
}
