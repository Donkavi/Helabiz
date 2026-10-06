import * as Haptics from "expo-haptics";

/**
 * Small physical confirmations — a tick when a chart's scrubber moves to a
 * new day, a firmer one when an order changes status. Failures are ignored:
 * not every phone has a haptic engine.
 */
export const haptics = {
  select: () => void Haptics.selectionAsync().catch(() => undefined),
  tap: () => void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined),
  success: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined),
  error: () => void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => undefined),
};
