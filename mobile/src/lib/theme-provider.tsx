import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { StyleSheet, useColorScheme } from "react-native";
import * as SystemUI from "expo-system-ui";
import { storage } from "./storage";
import { dark, light, type Palette } from "./theme";

/**
 * Light, dark, or whatever the phone is set to — the same three choices as
 * the theme menu in the web dashboard's top bar.
 */
export type ThemePreference = "system" | "light" | "dark";

type ThemeContext = {
  colors: Palette;
  scheme: "light" | "dark";
  preference: ThemePreference;
  setPreference: (preference: ThemePreference) => void;
};

const KEY = "helabiz.theme";
const Context = createContext<ThemeContext | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [preference, setPreferenceState] = useState<ThemePreference>("system");

  useEffect(() => {
    void storage.get(KEY).then((stored) => {
      if (stored === "light" || stored === "dark" || stored === "system") setPreferenceState(stored);
    });
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    void storage.set(KEY, next).catch(() => undefined);
  }, []);

  const scheme = preference === "system" ? (system === "dark" ? "dark" : "light") : preference;
  const colors = scheme === "dark" ? dark : light;

  // The window behind every screen, so nothing flashes white in dark mode.
  useEffect(() => {
    void SystemUI.setBackgroundColorAsync(colors.background).catch(() => undefined);
  }, [colors.background]);

  const value = useMemo(() => ({ colors, scheme, preference, setPreference }), [colors, scheme, preference, setPreference]);
  return <Context.Provider value={value}>{children}</Context.Provider>;
}

export function useTheme() {
  const value = useContext(Context);
  if (!value) throw new Error("useTheme must be used inside ThemeProvider");
  return value;
}

/**
 * Styles that depend on the palette, rebuilt only when the theme changes:
 *
 *   const styles = useStyles((c) => ({ box: { backgroundColor: c.card } }));
 */
export function useStyles<T extends StyleSheet.NamedStyles<T>>(factory: (colors: Palette) => T): T {
  const { colors } = useTheme();
  // `factory` is a fresh closure each render; the palette is what matters.
  return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
}
