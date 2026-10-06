import { NextResponse } from "next/server";
import { z } from "zod";
import { mobileRoute, MobileError, readJson, requireMobileUser } from "@/lib/mobile/auth";
import { MobileDevice } from "@/models/MobileDevice";
import { sendPush } from "@/services/push-service";

/**
 * PUT  { pushToken: string | null }  remember (or forget) where to push this phone
 * POST                               send this phone a test notification
 */

const body = z.object({
  pushToken: z
    .string()
    .max(200)
    .regex(/^Expo(nent)?PushToken\[.+\]$/, "Not an Expo push token")
    .nullable(),
});

export const PUT = mobileRoute(async (request) => {
  const { device } = await requireMobileUser(request);
  const parsed = body.safeParse(await readJson(request));
  if (!parsed.success) throw new MobileError(parsed.error.issues[0]?.message ?? "Invalid token", 400, "invalid");

  const { pushToken } = parsed.data;
  if (pushToken) {
    // A push token belongs to the phone, not the account. If someone else
    // was signed in on this phone before, their session must stop receiving
    // this business's orders here.
    await MobileDevice.updateMany({ pushToken, _id: { $ne: device._id } }, { $unset: { pushToken: "" } });
    device.pushToken = pushToken;
  } else {
    device.pushToken = undefined;
  }
  await device.save();
  return NextResponse.json({ ok: true });
});

export const POST = mobileRoute(async (request) => {
  const { device } = await requireMobileUser(request);
  if (!device.pushToken) throw new MobileError("Notifications are not switched on for this phone", 400, "invalid");
  await sendPush([device.pushToken], {
    title: "Notifications are working",
    body: "You will hear about new orders and customer messages here.",
    channel: "general",
    data: { type: "test" },
  });
  return NextResponse.json({ ok: true });
});
