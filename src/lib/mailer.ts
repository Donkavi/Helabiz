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
  /** Overrides MAIL_FROM — a shop's own address from `shopSender`. */
  from?: { name: string; address: string };
};

export type MailResult = { sent: boolean; reason?: string };

/**
 * The domain shops send from, e.g. "mail.helabiz.lk", or null to send
 * everything from MAIL_FROM.
 *
 * It must be a domain the SMTP provider has verified (SPF and DKIM), or
 * messages from it will be rejected or land in spam. A subdomain rather than
 * helabiz.lk itself keeps one careless shop from hurting the reputation of
 * Helabiz's own mail.
 */
export function shopMailDomain() {
  const domain = process.env.MAIL_SHOP_DOMAIN?.trim().toLowerCase();
  return domain && /^[a-z0-9-]+(\.[a-z0-9-]+)+$/.test(domain) ? domain : null;
}

/** "kavi-fashion@mail.helabiz.lk", or null when shops do not get their own address. */
export function shopSenderAddress(slug: string) {
  const domain = shopMailDomain();
  const local = slug.toLowerCase().replace(/[^a-z0-9-]/g, "").replace(/^-+|-+$/g, "").slice(0, 64);
  return domain && local ? `${local}@${domain}` : null;
}

/**
 * The From for mail a shop sends its customers: the shop's name on the shop's
 * own address. Undefined when no shop domain is configured, which leaves
 * `sendMail` on MAIL_FROM.
 */
export function shopSender(shop: { name: string; slug: string }): Mail["from"] {
  const address = shopSenderAddress(shop.slug);
  if (!address) return undefined;
  // Nodemailer quotes the name, but a line break must never reach a header.
  const name = shop.name.replace(/[\r\n"<>]/g, " ").replace(/\s+/g, " ").trim().slice(0, 70);
  return { name: name || "Shop", address };
}

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

/** Whether email can be sent at all. Features that only work by email hide without it. */
export function emailReady() {
  return smtpConfig() !== null;
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
      from: mail.from ?? config.from,
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
