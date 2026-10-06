import { useState } from "react";
import { Pressable, View } from "react-native";
import { Check, ChevronsUpDown } from "@/components/icons";
import { haptics } from "@/lib/haptics";
import { titleCase } from "@/lib/format";
import { useSession } from "@/lib/session";
import { radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import { Avatar, Badge } from "./primitives";
import { Sheet, SheetOption } from "./sheet";
import { Text } from "./text";

/**
 * The web sidebar's business switcher: the shop being viewed, and a sheet
 * of the others this account belongs to.
 */
export function BusinessSwitcher() {
  const { business, businesses, switchBusiness } = useSession();
  const { colors: c } = useTheme();
  const [open, setOpen] = useState(false);
  const many = businesses.length > 1;

  return (
    <>
      <Pressable
        onPress={() => many && setOpen(true)}
        disabled={!many}
        accessibilityRole={many ? "button" : undefined}
        accessibilityLabel={many ? "Switch business" : undefined}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          alignSelf: "flex-start",
          paddingVertical: 5,
          paddingLeft: 5,
          paddingRight: many ? 10 : 14,
          borderRadius: radius.xl,
          borderWidth: 1,
          borderColor: c.border,
          backgroundColor: pressed ? c.muted : c.card,
          maxWidth: "80%",
        })}
      >
        <Avatar name={business?.name ?? "?"} size={30} tone="solid" />
        <View style={{ flexShrink: 1 }}>
          <Text size={13.5} weight="semibold" numberOfLines={1}>
            {business?.name ?? "…"}
          </Text>
          {business && (
            <Text size={11.5} tone="muted" numberOfLines={1}>
              {titleCase(business.plan)} plan
            </Text>
          )}
        </View>
        {many && <ChevronsUpDown size={15} color={c.mutedForeground} />}
      </Pressable>

      <Sheet open={open} onClose={() => setOpen(false)} title="Your businesses" description="Choose which shop to look at.">
        {businesses.map((item) => {
          const active = item.id === business?.id;
          return (
            <SheetOption
              key={item.id}
              label={item.name}
              detail={`${titleCase(item.role)} · ${titleCase(item.plan)} plan`}
              leading={<Avatar name={item.name} size={36} tone={active ? "solid" : "soft"} />}
              trailing={
                active ? (
                  <Check size={18} color={c.primary} strokeWidth={2.5} />
                ) : item.locked ? (
                  <Badge label="Paused" variant="warning" />
                ) : null
              }
              onPress={() => {
                haptics.select();
                setOpen(false);
                void switchBusiness(item.id);
              }}
            />
          );
        })}
      </Sheet>
    </>
  );
}
