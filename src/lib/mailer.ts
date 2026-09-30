import "server-only";
import nodemailer from "nodemailer";

/**
 * Outgoing email.
 *
 * Configured through SMTP, which works with a Sri Lankan host, a Google
 * Workspace mailbox or anything else with a username and password — no
 * account with a foreign API provider required.
 *
 * Unconfigured, the no-op adapter logs what would have been sent and reports
 * success. That matters: a shop must still be able to take an order when the
 * mail server is misconfigured, so nothing in the checkout path may throw on
 * account of email.
 */
export type Mail = {
  to: string;
  subject: string;
  /** Plain text, always sent — some Sri Lankan inboxes still prefer it. */
  text: string;
  html?: string;
  replyTo?: string;
};

export type MailResult = { sent: boolean; reason?: string };

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
};

function smtpConfig(): SmtpConfig | null {
  const host = process.env.SMTP_HOST?.trim();
  const from = process.env.MAIL_FROM?.trim();
  if (!host || !from) return null;

  const port = Number(process.env.SMTP_PORT ?? 587);
  return {
    host,
    port: Number.isFinite(port) ? port : 587,
    // 465 is implicit TLS; 587 upgrades with STARTTLS.
    secure: (process.env.SMTP_SECURE ?? "").toLowerCase() === "true" || port === 465,
    user: process.env.SMTP_USER?.trim() || undefined,
    pass: process.env.SMTP_PASS || undefined,
    from,
  };
}

/** Whether mail can actually leave the building, for the admin panel to report. */
export function mailBackend() {
  return smtpConfig() ? "smtp" : "none";
}

/**
 * One transport for the process rather than a connection per message.
 * Rebuilt only if the configuration changes, which in practice it does not.
 */
let cached: { key: string; transport: nodemailer.Transporter } | null = null;

function transportFor(config: SmtpConfig) {
  const key = `${config.host}:${config.port}:${config.user ?? ""}`;
  if (cached?.key === key) return cached.transport;

  const transport = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    // A shop's checkout must not hang because a mail server is slow.
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  cached = { key, transport };
  return transport;
}

/**
 * Sends one message, and never throws.
 *
 * Every caller is on a path where the customer's order matters more than the
 * email about it, so a failure is logged and reported, not raised.
 */
export async function sendMail(mail: Mail): Promise<MailResult> {
  const config = smtpConfig();

  if (!config) {
    console.info(`[mail] not configured — would send "${mail.subject}" to ${mail.to}`);
    return { sent: false, reason: "Email is not configured on this installation" };
  }

  try {
    await transportFor(config).sendMail({
      from: config.from,
      to: mail.to,
      subject: mail.subject,
      text: mail.text,
      html: mail.html,
      replyTo: mail.replyTo,
    });
    return { sent: true };
  } catch (error) {
    console.error("[mail] send failed", error);
    return { sent: false, reason: error instanceof Error ? error.message : "Unknown mail error" };
  }
}

/** Verifies the SMTP settings, so the dashboard can say whether they work. */
export async function verifyMail(): Promise<MailResult> {
  const config = smtpConfig();
  if (!config) return { sent: false, reason: "SMTP_HOST and MAIL_FROM are not set" };

  try {
    await transportFor(config).verify();
    return { sent: true };
  } catch (error) {
    return { sent: false, reason: error instanceof Error ? error.message : "Could not reach the mail server" };
  }
}
