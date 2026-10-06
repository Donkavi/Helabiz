import { forwardRef, useState, type ReactNode } from "react";
import { TextInput, View, type TextInputProps } from "react-native";
import { alpha, font, radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import { Text } from "./text";

/**
 * The web's `Input`: card background, the input-coloured border, and a soft
 * jade ring while focused. Taller than the web's 38px, for a thumb.
 */
export const Input = forwardRef<
  TextInput,
  TextInputProps & { leading?: ReactNode; trailing?: ReactNode; invalid?: boolean }
>(
  function Input({ leading, trailing, invalid, style, onFocus, onBlur, ...props }, ref) {
    const { colors: c } = useTheme();
    const [focused, setFocused] = useState(false);
    const ring = invalid ? c.destructive : c.primary;
    return (
      <View
        style={{
          borderRadius: radius.lg + 3,
          borderWidth: 3,
          borderColor: focused || invalid ? alpha(ring, 0.18) : "transparent",
          margin: -3,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            height: 46,
            borderRadius: radius.lg,
            borderWidth: 1,
            borderColor: invalid ? c.destructive : focused ? c.primary : c.input,
            backgroundColor: c.card,
          }}
        >
          {leading ? <View style={{ paddingLeft: 13 }}>{leading}</View> : null}
          <TextInput
            ref={ref}
            placeholderTextColor={alpha(c.mutedForeground, 0.7)}
            selectionColor={c.primary}
            cursorColor={c.primary}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[
              { flex: 1, height: "100%", paddingHorizontal: leading ? 9 : 13, fontFamily: font.regular, fontSize: 15, color: c.foreground },
              style,
            ]}
            {...props}
          />
          {trailing}
        </View>
      </View>
    );
  },
);

export function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <View style={{ gap: 7 }}>
      <Text size={13.5} weight="medium">
        {label}
      </Text>
      {children}
      {error ? (
        <Text size={12.5} tone="destructive">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
