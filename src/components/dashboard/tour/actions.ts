"use server";

import { requireUser } from "@/lib/permissions";
import { connectDB } from "@/lib/db/mongoose";
import { User } from "@/models/User";
import { isTourId } from "./tours";

/**
 * Remembers that this person has finished or skipped a tour, so it does not
 * start by itself again — on this device or any other. They can still replay
 * it from the "Need help?" button whenever they like.
 */
export async function markTourSeenAction(tourId: string) {
  if (!isTourId(tourId)) return;
  const user = await requireUser();
  await connectDB();
  await User.updateOne({ _id: user.id }, { $addToSet: { toursSeen: tourId } });
}
