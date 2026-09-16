"use client";

import * as React from "react";
import { SessionProvider } from "next-auth/react";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/misc";

type Theme = "light" | "dark" | "system";

const ThemeContext = React.createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "system",
  setTheme: () => {},
});

export function useTheme() {
  return React.useContext(ThemeContext);
}

function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = React.useState<Theme>("system");

  // The stored preference is only readable in the browser, so the first paint
  // uses "system" and this corrects it. An inline script in the document head
  // applies the right class before paint, so there is no visible flash.
  React.useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrating from localStorage
    setThemeState((localStorage.getItem("helabiz-theme") as Theme) || "system");
  }, []);

  const apply = React.useCallback((next: Theme) => {
    const dark = next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }, []);

  React.useEffect(() => {
    apply(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => apply("system");
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, [theme, apply]);

  const setTheme = React.useCallback(
    (next: Theme) => {
      localStorage.setItem("helabiz-theme", next);
      setThemeState(next);
      apply(next);
    },
    [apply],
  );

  const value = React.useMemo(() => ({ theme, setTheme }), [theme, setTheme]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider>
        <TooltipProvider delayDuration={300} skipDelayDuration={200}>
          {children}
          <Toaster
            position="bottom-right"
            offset={16}
            toastOptions={{
              classNames: {
                toast:
                  "!bg-card !text-card-foreground !border-border !rounded-xl !shadow-lg !text-[13px] !font-sans",
                description: "!text-muted-foreground",
                actionButton: "!bg-primary !text-primary-foreground",
              },
            }}
          />
        </TooltipProvider>
      </ThemeProvider>
    </SessionProvider>
  );
}
