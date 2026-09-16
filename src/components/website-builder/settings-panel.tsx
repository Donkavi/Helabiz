"use client";

import * as React from "react";
import { Copy, Monitor, MousePointerClick, RotateCcw, Smartphone, Tablet, Trash2 } from "lucide-react";
import type { SectionNode, StyleProps, Viewport } from "@/types";
import { getSectionDef, sectionLabel } from "@/lib/website/section-registry";
import { FONT_OPTIONS } from "@/lib/website/themes";
import { mergeStyles } from "@/lib/website/styles";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch, Separator } from "@/components/ui/misc";
import { ImageField } from "@/components/dashboard/media-picker";
import { cn } from "@/lib/utils";
import { HEADER_ID, FOOTER_ID, useEditor } from "./editor-store";
import { ColorControl, ControlRow, FieldControl, SegmentedControl, SliderControl, type FieldContext } from "./field-controls";
import { ThemePanel } from "./theme-panel";

const VIEWPORT_ICONS = { desktop: Monitor, tablet: Tablet, mobile: Smartphone } as const;

export function SettingsPanel({ fieldCtx }: { fieldCtx: FieldContext }) {
  const { selectedId, selectedNode, viewport, updateProps, updateStyles, replaceNode, remove, duplicate } = useEditor();

  if (!selectedId || !selectedNode) return <ThemePanel />;

  const def = getSectionDef(selectedNode.type);
  const structural = selectedId === HEADER_ID || selectedId === FOOTER_ID;
  const effective = mergeStyles(selectedNode, viewport);

  return (
    <div className="flex h-full flex-col bg-sidebar">
      <div className="shrink-0 border-b border-sidebar-border px-3 py-2.5">
        <div className="flex items-center gap-2">
          {def && (
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary-muted text-primary">
              <def.icon className="size-3.5" />
            </span>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-[13px] font-semibold">{sectionLabel(selectedNode.type)}</p>
            <p className="truncate text-[11.5px] text-muted-foreground">
              {structural ? "Shown on every page" : def?.description}
            </p>
          </div>
          {!structural && (
            <>
              <Button size="icon-xs" variant="ghost" onClick={() => duplicate(selectedId)} aria-label="Duplicate section">
                <Copy />
              </Button>
              <Button size="icon-xs" variant="ghost" onClick={() => remove(selectedId)} aria-label="Delete section">
                <Trash2 className="text-destructive" />
              </Button>
            </>
          )}
        </div>
      </div>

      <Tabs defaultValue="content" className="flex min-h-0 flex-1 flex-col">
        <div className="shrink-0 px-3 pt-2.5">
          <TabsList className="w-full">
            <TabsTrigger value="content" className="flex-1">
              Content
            </TabsTrigger>
            <TabsTrigger value="design" className="flex-1">
              Design
            </TabsTrigger>
            <TabsTrigger value="responsive" className="flex-1">
              Device
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin p-3">
          <TabsContent value="content" className="space-y-3.5">
            {def?.fields.length ? (
              def.fields.map((field) => (
                <FieldControl
                  key={field.key}
                  field={field}
                  value={selectedNode.props[field.key]}
                  onChange={(value) => updateProps(selectedId, { [field.key]: value })}
                  ctx={fieldCtx}
                />
              ))
            ) : (
              <p className="rounded-lg border border-dashed border-border p-4 text-center text-[12.5px] text-muted-foreground">
                This section has no content of its own — drop other sections inside it, or style it under Design.
              </p>
            )}
          </TabsContent>

          <TabsContent value="design" className="space-y-5">
            <DesignControls
              effective={effective}
              onChange={(patch) => updateStyles(selectedId, patch)}
            />
          </TabsContent>

          <TabsContent value="responsive" className="space-y-4">
            <ResponsiveControls
              node={selectedNode}
              onReset={(target) =>
                replaceNode(selectedId, (node) => ({
                  ...node,
                  responsiveStyles: { ...(node.responsiveStyles ?? {}), [target]: {} },
                }))
              }
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

function DesignControls({
  effective,
  onChange,
}: {
  effective: StyleProps;
  onChange: (patch: StyleProps) => void;
}) {
  const { viewport } = useEditor();

  return (
    <>
      {viewport !== "desktop" && (
        <p className="rounded-lg border border-primary/25 bg-primary-muted/40 px-3 py-2 text-[11.5px] leading-relaxed text-primary">
          You are editing the <strong className="font-semibold">{viewport}</strong> layout. Changes here only apply to
          this size.
        </p>
      )}

      <Group title="Layout">
        <ControlRow label="Content width">
          <Select value={effective.maxWidth ?? "lg"} onValueChange={(v) => onChange({ maxWidth: v as StyleProps["maxWidth"] })}>
            <SelectTrigger size="sm" className="text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Narrow</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Wide (theme default)</SelectItem>
              <SelectItem value="xl">Extra wide</SelectItem>
              <SelectItem value="full">Full bleed</SelectItem>
            </SelectContent>
          </Select>
        </ControlRow>

        <ControlRow label="Alignment">
          <SegmentedControl
            value={effective.align ?? "left"}
            onChange={(v) => onChange({ align: v as StyleProps["align"] })}
            options={[
              { value: "left", label: "Left" },
              { value: "center", label: "Center" },
              { value: "right", label: "Right" },
            ]}
          />
        </ControlRow>

        <ControlRow label="Vertical padding">
          <SliderControl
            value={effective.paddingY ?? 0}
            onChange={(v) => onChange({ paddingY: v })}
            min={0}
            max={200}
            step={4}
            unit="px"
          />
        </ControlRow>

        <ControlRow label="Horizontal padding">
          <SliderControl
            value={effective.paddingX ?? 0}
            onChange={(v) => onChange({ paddingX: v })}
            min={0}
            max={120}
            step={4}
            unit="px"
          />
        </ControlRow>

        <ControlRow label="Space above">
          <SliderControl
            value={effective.marginTop ?? 0}
            onChange={(v) => onChange({ marginTop: v })}
            min={0}
            max={160}
            step={4}
            unit="px"
          />
        </ControlRow>

        <ControlRow label="Space below">
          <SliderControl
            value={effective.marginBottom ?? 0}
            onChange={(v) => onChange({ marginBottom: v })}
            min={0}
            max={160}
            step={4}
            unit="px"
          />
        </ControlRow>

        <ControlRow label="Minimum height">
          <SliderControl
            value={effective.minHeight ?? 0}
            onChange={(v) => onChange({ minHeight: v })}
            min={0}
            max={900}
            step={20}
            unit="px"
          />
        </ControlRow>

        <ControlRow label="Gap between items">
          <SliderControl
            value={effective.gap ?? 20}
            onChange={(v) => onChange({ gap: v })}
            min={0}
            max={80}
            step={2}
            unit="px"
          />
        </ControlRow>
      </Group>

      <Group title="Background">
        <ControlRow label="Background colour">
          <ColorControl value={effective.background} onChange={(v) => onChange({ background: v })} allowClear />
        </ControlRow>
        <ControlRow label="Background image">
          <ImageField value={effective.backgroundImage} onChange={(v) => onChange({ backgroundImage: v })} />
        </ControlRow>
        {effective.backgroundImage && (
          <ControlRow label="Image darkening" hint="Makes text readable over a photo.">
            <SliderControl
              value={effective.backgroundOverlay ?? 0}
              onChange={(v) => onChange({ backgroundOverlay: v })}
              min={0}
              max={90}
              step={5}
              unit="%"
            />
          </ControlRow>
        )}
      </Group>

      <Group title="Appearance">
        <ControlRow label="Text colour">
          <ColorControl value={effective.color} onChange={(v) => onChange({ color: v })} allowClear />
        </ControlRow>
        <ControlRow label="Corner radius">
          <SliderControl
            value={effective.radius ?? 0}
            onChange={(v) => onChange({ radius: v })}
            min={0}
            max={48}
            step={1}
            unit="px"
          />
        </ControlRow>
        <ControlRow label="Border width">
          <SliderControl
            value={effective.borderWidth ?? 0}
            onChange={(v) => onChange({ borderWidth: v })}
            min={0}
            max={8}
            step={1}
            unit="px"
          />
        </ControlRow>
        {(effective.borderWidth ?? 0) > 0 && (
          <ControlRow label="Border colour">
            <ColorControl value={effective.borderColor} onChange={(v) => onChange({ borderColor: v })} allowClear />
          </ControlRow>
        )}
        <ControlRow label="Shadow">
          <SegmentedControl
            value={effective.shadow ?? "none"}
            onChange={(v) => onChange({ shadow: v as StyleProps["shadow"] })}
            options={[
              { value: "none", label: "None" },
              { value: "sm", label: "S" },
              { value: "md", label: "M" },
              { value: "lg", label: "L" },
            ]}
          />
        </ControlRow>
      </Group>

      <Group title="Typography">
        <ControlRow label="Font" hint="Leave on theme default unless this section needs to stand out.">
          <Select
            value={effective.fontFamily ?? "theme"}
            onValueChange={(v) => onChange({ fontFamily: v === "theme" ? undefined : v })}
          >
            <SelectTrigger size="sm" className="text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="theme">Theme default</SelectItem>
              {FONT_OPTIONS.map((font) => (
                <SelectItem key={font.value} value={font.value}>
                  {font.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ControlRow>
        <ControlRow label="Base font size">
          <SliderControl
            value={effective.fontSize ?? 16}
            onChange={(v) => onChange({ fontSize: v })}
            min={11}
            max={30}
            step={1}
            unit="px"
          />
        </ControlRow>
        <ControlRow label="Weight">
          <SegmentedControl
            value={String(effective.fontWeight ?? 400)}
            onChange={(v) => onChange({ fontWeight: Number(v) })}
            options={[
              { value: "300", label: "Light" },
              { value: "400", label: "Normal" },
              { value: "600", label: "Semi" },
              { value: "700", label: "Bold" },
            ]}
          />
        </ControlRow>
        <ControlRow label="Line height">
          <SliderControl
            value={effective.lineHeight ?? 1.6}
            onChange={(v) => onChange({ lineHeight: v })}
            min={1}
            max={2.4}
            step={0.05}
          />
        </ControlRow>
        <ControlRow label="Letter spacing">
          <SliderControl
            value={effective.letterSpacing ?? 0}
            onChange={(v) => onChange({ letterSpacing: v })}
            min={-2}
            max={8}
            step={0.5}
            unit="px"
          />
        </ControlRow>
      </Group>

      <Group title="Behaviour">
        <ControlRow label="Entry animation" hint="Plays once when the section scrolls into view on the live site.">
          <Select
            value={effective.animation ?? "none"}
            onValueChange={(v) => onChange({ animation: v as StyleProps["animation"] })}
          >
            <SelectTrigger size="sm" className="text-[12.5px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              <SelectItem value="fade">Fade in</SelectItem>
              <SelectItem value="fade-up">Fade up</SelectItem>
              <SelectItem value="zoom">Zoom in</SelectItem>
            </SelectContent>
          </Select>
        </ControlRow>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[12.5px]">Hide this section</span>
          <Switch checked={Boolean(effective.hidden)} onCheckedChange={(v) => onChange({ hidden: v })} />
        </div>
      </Group>
    </>
  );
}

function ResponsiveControls({
  node,
  onReset,
}: {
  node: SectionNode;
  onReset: (viewport: Exclude<Viewport, "desktop">) => void;
}) {
  const { viewport, setViewport } = useEditor();

  return (
    <>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Pick a device, then use the Design tab. Anything you change applies only to that size — everything else falls
        back to your desktop settings.
      </p>

      <div className="grid grid-cols-3 gap-2">
        {(["desktop", "tablet", "mobile"] as const).map((target) => {
          const Icon = VIEWPORT_ICONS[target];
          const overrides = target === "desktop" ? 0 : Object.keys(node.responsiveStyles?.[target] ?? {}).length;
          return (
            <button
              key={target}
              type="button"
              onClick={() => setViewport(target)}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-lg border p-3 transition-all",
                viewport === target ? "border-primary bg-primary-muted/50 text-primary" : "border-border hover:bg-accent",
              )}
              aria-pressed={viewport === target}
            >
              <Icon className="size-4" />
              <span className="text-[11.5px] font-medium capitalize">{target}</span>
              {overrides > 0 && (
                <span className="rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                  {overrides}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <Separator />

      {(["tablet", "mobile"] as const).map((target) => {
        const overrides = Object.entries(node.responsiveStyles?.[target] ?? {});
        return (
          <div key={target} className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-semibold capitalize">{target} overrides</p>
              {overrides.length > 0 && (
                <Button size="xs" variant="ghost" onClick={() => onReset(target)}>
                  <RotateCcw className="size-3" />
                  Reset
                </Button>
              )}
            </div>
            {overrides.length === 0 ? (
              <p className="text-[11.5px] text-muted-foreground">Following desktop.</p>
            ) : (
              <ul className="space-y-1">
                {overrides.map(([key, value]) => (
                  <li
                    key={key}
                    className="flex items-center justify-between rounded-md bg-muted px-2 py-1 text-[11.5px]"
                  >
                    <span className="capitalize text-muted-foreground">
                      {key.replace(/([A-Z])/g, " $1").toLowerCase()}
                    </span>
                    <span className="font-mono">{String(value)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.09em] text-muted-foreground/80">{title}</h4>
      {children}
    </section>
  );
}

export function EmptySelection() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 bg-sidebar p-6 text-center">
      <span className="flex size-10 items-center justify-center rounded-xl border border-dashed border-border text-muted-foreground">
        <MousePointerClick className="size-4" />
      </span>
      <p className="text-[13px] font-medium">Nothing selected</p>
      <p className="text-[12.5px] leading-relaxed text-muted-foreground">
        Click any section on the canvas to edit its content and design.
      </p>
    </div>
  );
}
