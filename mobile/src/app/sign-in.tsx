import { useRef, useState } from "react";
import { KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AlertCircle, Check, Eye, EyeOff } from "@/components/icons";
import { Field, Input } from "@/components/input";
import { Logo } from "@/components/logo";
import { Button } from "@/components/primitives";
import { Text } from "@/components/text";
import { API_URL } from "@/lib/api";
import { haptics } from "@/lib/haptics";
import { useSession } from "@/lib/session";
import { alpha, radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";

/** What the app is for, in the same form as the web's sign-in brand panel. */
const POINTS = [
  "A ping the moment a website order comes in",
  "Reply to customer messages from anywhere",
  "Today's sales, profit and stock at a glance",
];

export default function SignIn() {
  const { signIn } = useSession();
  const { colors: c } = useTheme();
  const insets = useSafeAreaInsets();
  const passwordRef = useRef<TextInput>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    if (!email.trim() || !password) {
      setError("Enter your email and password.");
      haptics.error();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      // The root layout's gate moves on once the session is stored.
      await signIn(email, password);
      haptics.success();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not sign in.");
      haptics.error();
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: c.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{
          flexGrow: 1,
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 20,
          paddingHorizontal: 22,
        }}
      >
        <Logo />

        <View style={{ flex: 1, justifyContent: "center", paddingVertical: 36 }}>
          <Text size={26} weight="semibold" tracking={-0.025}>
            Welcome back
          </Text>
          <Text size={14} tone="muted" style={{ marginTop: 8 }}>
            Sign in to keep an eye on your business from your phone.
          </Text>

          <View style={{ marginTop: 26, gap: 16 }}>
            {error && (
              <View
                accessibilityRole="alert"
                style={{
                  flexDirection: "row",
                  alignItems: "flex-start",
                  gap: 10,
                  borderWidth: 1,
                  borderColor: alpha(c.destructive, 0.25),
                  backgroundColor: alpha(c.destructive, 0.08),
                  borderRadius: radius.lg,
                  paddingHorizontal: 14,
                  paddingVertical: 12,
                }}
              >
                <AlertCircle size={16} color={c.destructive} style={{ marginTop: 1 }} />
                <Text size={13} tone="destructive" style={{ flex: 1 }}>
                  {error}
                </Text>
              </View>
            )}

            <Field label="Email">
              <Input
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                textContentType="emailAddress"
                returnKeyType="next"
                onSubmitEditing={() => passwordRef.current?.focus()}
                submitBehavior="submit"
              />
            </Field>

            <Field label="Password">
              <Input
                ref={passwordRef}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                secureTextEntry={!show}
                autoComplete="current-password"
                textContentType="password"
                returnKeyType="go"
                onSubmitEditing={submit}
                trailing={
                  <Pressable
                    onPress={() => setShow((v) => !v)}
                    hitSlop={8}
                    style={{ paddingHorizontal: 12, height: "100%", justifyContent: "center" }}
                    accessibilityLabel={show ? "Hide password" : "Show password"}
                  >
                    {show ? <EyeOff size={17} color={c.mutedForeground} /> : <Eye size={17} color={c.mutedForeground} />}
                  </Pressable>
                }
              />
            </Field>

            <Button label={busy ? "Signing in…" : "Sign in"} size="lg" onPress={submit} loading={busy} style={{ marginTop: 4 }} />
          </View>

          <Text size={12.5} tone="muted" center style={{ marginTop: 16, lineHeight: 19 }}>
            Use the same email and password as the Helabiz website. Accounts that only sign in with Google cannot use
            the app yet.
          </Text>

          <View
            style={{
              marginTop: 30,
              padding: 16,
              gap: 11,
              borderRadius: radius.xl,
              borderWidth: 1,
              borderColor: c.border,
              backgroundColor: c.card,
            }}
          >
            <Text size={11.5} weight="semibold" tone="primary" tracking={0.08} style={{ textTransform: "uppercase" }}>
              Helabiz on your phone
            </Text>
            {POINTS.map((point) => (
              <View key={point} style={{ flexDirection: "row", alignItems: "flex-start", gap: 10 }}>
                <View
                  style={{
                    marginTop: 2,
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    backgroundColor: c.primaryMuted,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Check size={11} color={c.primary} strokeWidth={3} />
                </View>
                <Text size={13.5} tone="muted" style={{ flex: 1 }}>
                  {point}
                </Text>
              </View>
            ))}
          </View>
        </View>

        <View style={{ alignItems: "center", gap: 10 }}>
          {API_URL ? (
            <Text size={13.5} tone="muted" center>
              New to Helabiz?{" "}
              <Text size={13.5} weight="medium" tone="primary" onPress={() => Linking.openURL(`${API_URL}/sign-up`)}>
                Create an account
              </Text>
            </Text>
          ) : null}
          <Text size={12} tone="muted" center>
            © {new Date().getFullYear()} Helabiz · Made in Sri Lanka
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
