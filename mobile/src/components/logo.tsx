import { View } from "react-native";
import Svg, { Path } from "react-native-svg";
import { Text } from "./text";
import { useTheme } from "@/lib/theme-provider";

/** The web's `LogoMark`: an "H" built from a storefront awning, on the brand jade. */
export function LogoMark({ size = 32 }: { size?: number }) {
  const { colors } = useTheme();
  const glyph = size * 0.56;
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.31,
        backgroundColor: colors.primary,
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 2,
        shadowOffset: { width: 0, height: 1 },
        elevation: 1,
      }}
    >
      <Svg width={glyph} height={glyph} viewBox="0 0 24 24" fill="none">
        <Path d="M4 7.5h16" stroke={colors.primaryForeground} strokeWidth={2} strokeLinecap="round" />
        <Path d="M6.5 11v6.5M17.5 11v6.5M6.5 14.2h11" stroke={colors.primaryForeground} strokeWidth={2} strokeLinecap="round" />
      </Svg>
    </View>
  );
}

/** Mark plus "Hela" + jade "biz", as in the web sidebar. */
export function Logo({ size = 32 }: { size?: number }) {
  const word = size * 0.53;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: size * 0.3 }}>
      <LogoMark size={size} />
      <Text size={word} weight="semibold" tracking={-0.03}>
        Hela
        <Text size={word} weight="semibold" tracking={-0.03} tone="primary">
          biz
        </Text>
      </Text>
    </View>
  );
}
