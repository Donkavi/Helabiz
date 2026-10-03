"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { AccessError, ACTIVE_BUSINESS_COOKIE } from "@/lib/permissions";
import { assertSuperAdmin, recordAdminAction } from "@/lib/permissions/admin";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { WEBSITE_REQUEST_STATUSES } from "@/models/WebsiteRequest";
import {
  businessName,
  chatMessages,
  grantSupportAccess,
  markReadByHelabiz,
  revokeSupportAccess,
  sendHelabizMessage,
  updateWebsiteRequest,
  type ChatMessage,
} from "@/services/support-service";

/**
 * The Helabiz team's side of website requests and support chat.
 *
 * As everywhere in the admin panel, every action re-checks the gate: a server
 * action is a public endpoint and the layout's check never runs for it.
 */

export type SupportResult = { ok: true; message: string } | { ok: false; error: string };

const idSchema = z.string().regex(/^[0-9a-f]{24}$/i, "Unknown id");

function failed(error: unknown): SupportResult {
  if (error instanceof AccessError) return { ok: false, error: error.message };
  if (error instanceof z.ZodError) return { ok: false, error: error.issues[0]?.message ?? "Invalid input" };
  console.error("[admin/support]", error);
  return { ok: false, error: "Something went wrong" };
}

function refresh(businessId?: string, requestId?: string) {
  revalidatePath("/admin/requests");
  if (requestId) revalidatePath(`/admin/requests/${requestId}`);
  revalidatePath("/admin/support");
  if (businessId) revalidatePath(`/admin/support/${businessId}`);
}

/** Changes a request's status and/or the team's private notes on it. */
export async function updateWebsiteRequestAction(
  requestId: string,
  change: { status?: string; adminNotes?: string },
): Promise<SupportResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(requestId);
    const status = change.status ? z.enum(WEBSITE_REQUEST_STATUSES).parse(change.status) : undefined;
    const adminNotes = change.adminNotes === undefined ? undefined : z.string().max(4000).parse(change.adminNotes);

    const result = await updateWebsiteRequest(id, admin, { status, adminNotes });
    if (!result) return { ok: false, error: "That request no longer exists" };

    if (status && status !== result.previous) {
      await recordAdminAction(admin, "website_request.status", {
        businessId: result.businessId,
        entity: "WebsiteRequest",
        entityId: id,
        meta: { from: result.previous, to: status },
      });
    }

    refresh(result.businessId, id);
    return {
      ok: true,
      message:
        status === "done" || status === "cancelled"
          ? "Request closed. Support access to the business has ended."
          : status
            ? result.told
              ? "Status updated. The business has been told in their chat."
              : "Status updated. This status sends the business no message."
            : "Notes saved.",
    };
  } catch (error) {
    return failed(error);
  }
}

/** Lets the signed-in admin into the business, without leaving the admin panel. */
export async function grantSupportAccessAction(businessId: string): Promise<SupportResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);
    if (!(await businessName(id))) return { ok: false, error: "That business no longer exists" };

    const result = await grantSupportAccess(id, admin.id);
    if (result.alreadyMember) return { ok: true, message: "You are already a member of this business." };

    await recordAdminAction(admin, "support_access.grant", { businessId: id, entity: "Business", entityId: id });
    refresh(id);
    return { ok: true, message: "Support access granted. The business sees “Helabiz support” in its team." };
  } catch (error) {
    return failed(error);
  }
}

/** Ends support access — for this admin, or for the whole team with `everyone`. */
export async function revokeSupportAccessAction(businessId: string, everyone = false): Promise<SupportResult> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);

    const removed = await revokeSupportAccess(id, everyone ? undefined : admin.id);
    if (removed > 0) {
      await recordAdminAction(admin, "support_access.revoke", {
        businessId: id,
        entity: "Business",
        entityId: id,
        meta: { everyone, removed },
      });
    }
    refresh(id);
    return { ok: true, message: removed ? "Support access ended." : "There was no support access to end." };
  } catch (error) {
    return failed(error);
  }
}

/**
 * Grants support access if needed, makes the business the admin's active one
 * and opens its website screen — from there the builder works as it does for
 * the owner. Redirects on success, so it only returns on failure.
 */
export async function openBusinessAsSupportAction(businessId: string, next = "/website"): Promise<SupportResult> {
  let destination: string;
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);
    if (!(await businessName(id))) return { ok: false, error: "That business no longer exists" };

    const result = await grantSupportAccess(id, admin.id);
    if (result.granted) {
      await recordAdminAction(admin, "support_access.grant", { businessId: id, entity: "Business", entityId: id });
    }

    const store = await cookies();
    store.set(ACTIVE_BUSINESS_COOKIE, id, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
    });
    await connectDB();
    await User.updateOne({ _id: admin.id }, { $set: { lastBusinessId: id } });

    // Only paths inside the dashboard.
    destination = next.startsWith("/") && !next.startsWith("//") ? next : "/website";
  } catch (error) {
    return failed(error);
  }
  // Outside the try: redirect() works by throwing.
  redirect(destination);
}

const messageSchema = z.string().trim().min(1, "Write a message").max(4000);

export async function adminSendMessageAction(
  businessId: string,
  body: string,
): Promise<{ ok: true; message: ChatMessage } | { ok: false; error: string }> {
  try {
    const admin = await assertSuperAdmin();
    const id = idSchema.parse(businessId);
    const text = messageSchema.parse(body);
    if (!(await businessName(id))) return { ok: false, error: "That business no longer exists" };

    const message = await sendHelabizMessage(id, admin, text);
    // Replying means the team has read what came before.
    await markReadByHelabiz(id);
    revalidatePath("/admin/support");
    return { ok: true, message };
  } catch (error) {
    const result = failed(error);
    return result.ok ? { ok: false, error: "Something went wrong" } : result;
  }
}

/** New messages since `after` in one business's thread; marks theirs as read. */
export async function adminPollSupportAction(businessId: string, after?: string): Promise<ChatMessage[]> {
  await assertSuperAdmin();
  const id = idSchema.parse(businessId);
  const messages = await chatMessages(id, after);
  if (messages.some((message) => message.from === "business" && !message.readAt)) await markReadByHelabiz(id);
  return messages;
}
