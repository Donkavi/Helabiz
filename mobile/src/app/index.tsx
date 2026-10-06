import { View } from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "@/lib/session";
import { useTheme } from "@/lib/theme-provider";

/** Launch: wait for secure storage (a moment), then into the app or to sign-in. */
export default function Index() {
  const { ready, signedIn } = useSession();
  const { colors } = useTheme();
  if (!ready) return <View style={{ flex: 1, backgroundColor: colors.background }} />;
  return <Redirect href={signedIn ? "/(tabs)" : "/sign-in"} />;
}
