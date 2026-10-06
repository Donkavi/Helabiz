import { connectDB } from "@/lib/db/mongoose";
import { BusinessMember } from "@/models/BusinessMember";
import { MobileDevice } from "@/models/MobileDevice";
import { User } from "@/models/User";

/**
 * Push notifications to the Helabiz mobile app, through Expo's push service
 * (which hands them to Apple and Google).
 *
 * Callers await this. On Vercel a function can be frozen the moment its
 * response is sent, so a push left running in the background might never
 * leave. It is bounded by a timeout and never throws, so a slow or failing
 * push cannot cost a shop an order or a customer their message — the same
 * contract as the order emails.
 *
 * `EXPO_ACCESS_TOKEN` is optional: set it once "Enhanced push security" is on
 * for the Expo project, and only this server can send to the app.
 */

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
const TIMEOUT_MS = 5000;
/** Expo accepts at most this many messages per request. */
const BATCH = 100;

/** Android notification channels; the app creates the same ids. */
export type PushChannel = "orders" | "messages" | "general";

export type PushMessage = {
  title: string;
  body?: string;
  channel: PushChannel;
  /** Read by the app to open the right screen when the notification is tapped. */
  data: { type: "order" | "message" | "support" | "test"; orderId?: string; customerId?: string };
};

type ExpoTicket = { status: "ok" | "error"; message?: string; details?: { error?: string } };

/** Sends to raw Expo push tokens. Tokens Expo reports as dead are forgotten. */
export async function sendPush(tokens: string[], message: PushMessage, businessId?: string) {
  const valid = [...new Set(tokens)].filter((token) => /^Expo(nent)?PushToken\[.+\]$/.test(token));
  if (!valid.length) return;

  const headers: Record<string, string> = { "content-type": "application/json", accept: "application/json" };
  if (process.env.EXPO_ACCESS_TOKEN) headers.authorization = `Bearer ${process.env.EXPO_ACCESS_TOKEN}`;

  for (let start = 0; start < valid.length; start += BATCH) {
    const batch = valid.slice(start, start + BATCH);
    try {
      const response = await fetch(EXPO_PUSH_URL, {
        method: "POST",
        headers,
        signal: AbortSignal.timeout(TIMEOUT_MS),
        body: JSON.stringify(
          batch.map((to) => ({
            to,
            title: message.title,
            body: message.body,
            sound: "default",
            priority: "high",
            channelId: message.channel,
            data: { ...message.data, ...(businessId ? { businessId } : {}) },
          })),
        ),
      });
      if (!response.ok) {
        console.error("[push] Expo rejected the request", response.status, await response.text().catch(() => ""));
        continue;
      }

      // Tickets come back in the order the messages were sent.
      const { data: tickets = [] } = (await response.json()) as { data?: ExpoTicket[] };
      const dead = batch.filter((_, index) => tickets[index]?.details?.error === "DeviceNotRegistered");
      if (dead.length) {
        await MobileDevice.updateMany({ pushToken: { $in: dead } }, { $unset: { pushToken: "" } });
      }
    } catch (error) {
      console.error("[push] could not reach Expo", error);
    }
  }
}

/**
 * Notifies every phone signed in by a member of the business. Helabiz
 * support staff let in to fix a website are left out: a shop's orders and
 * customer messages are not theirs to be woken up by.
 */
export async function pushToBusiness(businessId: string, message: PushMessage) {
  try {
    await connectDB();
    const members = await BusinessMember.find({ businessId, status: "active", support: { $ne: true } })
      .select("userId")
      .lean();
    if (!members.length) return;

    const users = await User.find({ _id: { $in: members.map((m) => m.userId) }, status: { $ne: "disabled" } })
      .select("_id")
      .lean();
    const devices = await MobileDevice.find({
      userId: { $in: users.map((u) => u._id) },
      pushToken: { $exists: true, $nin: [null, ""] },
    })
      .select("pushToken")
      .lean();

    await sendPush(
      devices.map((d) => d.pushToken as string),
      message,
      businessId,
    );
  } catch (error) {
    console.error("[push] could not notify business", businessId, error);
  }
}
