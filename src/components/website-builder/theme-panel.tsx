"use client";

import * as React from "react";
import { Check, Palette } from "lucide-react";
import type { ThemeTokens } from "@/types";
import { FONT_OPTIONS, THEMES } from "@/lib/website/themes";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useEditor } from "./editor-store";
import { ColorControl, ControlRow, SegmentedControl, SliderControl } from "./field-controls";

/** Shown when nothing is selected — the global look of the whole site (spec §19). */
export function ThemePanel() {
  const { doc, updateTheme } = useEditor();
  const theme = doc.theme;

  const set = <K extends keyof ThemeTokens>(key: K, value: ThemeTokens[K]) => updateTheme({ [key]: value });

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="shrink-0 border-b border-sidebar-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary-muted text-primary">
            <Palette className="size-3.5" />
          </span>
          <div>
            <p className="text-[13px] font-semibold">Website style</p>
            <p className="text-[11.5px] text-muted-foreground">Applies to every page</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="colors" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-3 pt-2.5">
          <TabsList className="w-full">
            <TabsTrigger value="colors" className="flex-1">
              Colours
            </TabsTrigger>
            <TabsTrigger value="type" className="flex-1">
              Type
            </TabsTrigger>
            <TabsTrigger value="presets" className="flex-1">
              Presets
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-3">
          <TabsContent value="colors" className="space-y-4">
            <ControlRow label="Primary" hint="Buttons, links and highlights.">
              <ColorControl value={theme.primary} onChange={(v) => set("primary", v)} />
            </ControlRow>
            <ControlRow label="Secondary">
              <ColorControl value={theme.secondary} onChange={(v) => set("secondary", v)} />
            </ControlRow>
            <ControlRow label="Page background">
              <ColorControl value={theme.background} onChange={(v) => set("background", v)} />
            </ControlRow>
            <ControlRow label="Card / surface">
              <ColorControl value={theme.surface} onChange={(v) => set("surface", v)} />
            </ControlRow>
            <ControlRow label="Text">
              <ColorControl value={theme.text} onChange={(v) => set("text", v)} />
            </ControlRow>
            <ControlRow label="Muted text">
              <ColorControl value={theme.muted} onChange={(v) => set("muted", v)} />
            </ControlRow>

            <div className="rounded-lg border border-border p-3" style={{ background: theme.background }}>
              <p className="mb-2 text-[10.5px] font-semibold uppercase tracking-wider" style={{ color: theme.muted }}>
                Preview
              </p>
              <p className="text-[15px] font-semibold" style={{ color: theme.text }}>
                Your heading here
              </p>
              <p className="mt-1 text-[12px]" style={{ color: theme.muted }}>
                Supporting text sits underneath.
              </p>
              <span
                className="mt-2.5 inline-block px-3 py-1.5 text-[11.5px] font-semibold"
                style={{
                  background: theme.primary,
                  color: "#fff",
                  borderRadius: theme.buttonStyle === "pill" ? 999 : theme.radius,
                }}
              >
                Shop now
              </span>
            </div>
          </TabsContent>

          <TabsContent value="type" className="space-y-4">
            <ControlRow label="Heading font">
              <Select value={theme.headingFont} onValueChange={(v) => set("headingFont", v)}>
                <SelectTrigger size="sm" className="text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="Body font">
              <Select value={theme.bodyFont} onValueChange={(v) => set("bodyFont", v)}>
                <SelectTrigger size="sm" className="text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((font) => (
                    <SelectItem key={font.value} value={font.value}>
                      {font.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="Button style">
              <SegmentedControl
                value={theme.buttonStyle}
                onChange={(v) => set("buttonStyle", v as ThemeTokens["buttonStyle"])}
                options={[
                  { value: "solid", label: "Solid" },
                  { value: "outline", label: "Outline" },
                  { value: "soft", label: "Soft" },
                  { value: "pill", label: "Pill" },
                ]}
              />
            </ControlRow>

            <ControlRow label="Card style">
              <SegmentedControl
                value={theme.cardStyle}
                onChange={(v) => set("cardStyle", v as ThemeTokens["cardStyle"])}
                options={[
                  { value: "flat", label: "Flat" },
                  { value: "bordered", label: "Border" },
                  { value: "shadow", label: "Shadow" },
                  { value: "elevated", label: "Raised" },
                ]}
              />
            </ControlRow>

            <ControlRow label="Corner radius">
              <SliderControl value={theme.radius} onChange={(v) => set("radius", v)} min={0} max={32} unit="px" />
            </ControlRow>

            <ControlRow label="Section spacing" hint="The default breathing room between sections.">
              <SliderControl
                value={theme.sectionSpacing}
                onChange={(v) => set("sectionSpacing", v)}
                min={32}
                max={160}
                step={4}
                unit="px"
              />
            </ControlRow>

            <ControlRow label="Content width">
              <SliderControl
                value={theme.containerWidth}
                onChange={(v) => set("containerWidth", v)}
                min={880}
                max={1600}
                step={20}
                unit="px"
              />
            </ControlRow>

            <ControlRow label="Header layout">
              <Select value={theme.headerStyle} onValueChange={(v) => set("headerStyle", v as ThemeTokens["headerStyle"])}>
                <SelectTrigger size="sm" className="text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Logo left, links right</SelectItem>
                  <SelectItem value="centered">Centred logo</SelectItem>
                  <SelectItem value="split">Links either side</SelectItem>
                  <SelectItem value="minimal">Minimal</SelectItem>
                </SelectContent>
              </Select>
            </ControlRow>

            <ControlRow label="Footer layout">
              <Select value={theme.footerStyle} onValueChange={(v) => set("footerStyle", v as ThemeTokens["footerStyle"])}>
                <SelectTrigger size="sm" className="text-[12.5px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="columns">Columns</SelectItem>
                  <SelectItem value="simple">Simple row</SelectItem>
                  <SelectItem value="centered">Centred</SelectItem>
                </SelectContent>
              </Select>
            </ControlRow>
          </TabsContent>

          <TabsContent value="presets" className="space-y-2">
            <p className="pb-1 text-[12px] leading-relaxed text-muted-foreground">
              Applying a preset replaces your colours, fonts and shapes. Your sections and content are untouched.
            </p>
            {THEMES.map((preset) => {
              const active = preset.tokens.primary === theme.primary && preset.tokens.headingFont === theme.headingFont;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => updateTheme(preset.tokens)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border p-2.5 text-left transition-all",
                    active ? "border-primary bg-primary-muted/40" : "border-border hover:bg-accent",
                  )}
                >
                  <span className="flex shrink-0 gap-1">
                    {[preset.tokens.primary, preset.tokens.secondary, preset.tokens.surface].map((color) => (
                      <span
                        key={color}
                        className="size-5 rounded-md border border-border"
                        style={{ background: color }}
                      />
                    ))}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[12.5px] font-semibold">{preset.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{preset.category}</span>
                  </span>
                  {active && <Check className="size-3.5 shrink-0 text-primary" />}
                </button>
              );
            })}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}
