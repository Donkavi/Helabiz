import { useMemo, useRef, useState } from "react";
import { View, type GestureResponderEvent, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Stop } from "react-native-svg";
import { formatCurrency } from "@/lib/format";
import { haptics } from "@/lib/haptics";
import { CHART_COLORS, radius } from "@/lib/theme";
import { useTheme } from "@/lib/theme-provider";
import { Text } from "./text";

/**
 * Charts drawn to match the web's Recharts setup (`components/charts/
 * revenue-chart.tsx`): monotone curves, a jade area fading to nothing,
 * dashed horizontal grid, compact rupee axis. Phones have no hover, so
 * pressing and dragging across a chart reads out each day instead.
 */

export type ChartSeries = { name: string; values: number[]; color?: string; fill?: boolean };

const AXIS_WIDTH = 40;

/** Short axis figures — "75K", "1.2M" — so they never wrap; the tooltip has the full amount. */
function axisLabel(value: number) {
  const abs = Math.abs(value);
  const short = (n: number) => String(Math.round(n * 10) / 10);
  if (abs >= 1_000_000) return `${short(value / 1_000_000)}M`;
  if (abs >= 1_000) return `${short(value / 1_000)}K`;
  return String(Math.round(value));
}
const TOP = 10;
const X_LABELS = 22;

/** Round axis steps: 1, 2, 2.5 or 5 times a power of ten. */
function niceTicks(min: number, max: number, count = 4) {
  if (max === min) max = min + 1;
  const raw = (max - min) / (count - 1);
  const power = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = ([1, 2, 2.5, 5, 10].find((m) => m * power >= raw) ?? 10) * power;
  const start = Math.floor(min / step) * step;
  const ticks: number[] = [];
  for (let value = start; value <= max + step * 0.5 && ticks.length < 8; value += step) ticks.push(value);
  if (ticks[ticks.length - 1] < max) ticks.push(ticks[ticks.length - 1] + step);
  return ticks;
}

/** d3's `curveMonotoneX`: smooth, but never overshoots a data point. */
function monotonePath(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n === 0) return "";
  if (n === 1) return `M${points[0].x},${points[0].y}`;

  const dx: number[] = [];
  const slope: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx.push(points[i + 1].x - points[i].x);
    slope.push((points[i + 1].y - points[i].y) / (dx[i] || 1));
  }
  const tangent: number[] = [slope[0]];
  for (let i = 1; i < n - 1; i++) {
    tangent.push(slope[i - 1] * slope[i] <= 0 ? 0 : (3 * (dx[i - 1] + dx[i])) /
      ((2 * dx[i] + dx[i - 1]) / slope[i - 1] + (dx[i] + 2 * dx[i - 1]) / slope[i]));
  }
  tangent.push(slope[n - 2]);

  let d = `M${points[0].x},${points[0].y}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += `C${points[i].x + h},${points[i].y + h * tangent[i]} ${points[i + 1].x - h},${points[i + 1].y - h * tangent[i + 1]} ${points[i + 1].x},${points[i + 1].y}`;
  }
  return d;
}

export function TrendChart({
  labels,
  series,
  height = 200,
  money = true,
}: {
  labels: string[];
  series: ChartSeries[];
  height?: number;
  money?: boolean;
}) {
  const { colors: c } = useTheme();
  const [width, setWidth] = useState(0);
  const [active, setActive] = useState<number | null>(null);
  const lastIndex = useRef<number | null>(null);

  const n = labels.length;
  const plotWidth = Math.max(0, width - AXIS_WIDTH - 6);
  const plotHeight = height - TOP - X_LABELS;

  const geometry = useMemo(() => {
    const all = series.flatMap((s) => s.values);
    const ticks = niceTicks(Math.min(0, ...all), Math.max(0, ...all));
    const bottom = ticks[0];
    const top = ticks[ticks.length - 1];
    const x = (i: number) => AXIS_WIDTH + (n <= 1 ? plotWidth / 2 : (i * plotWidth) / (n - 1));
    const y = (v: number) => TOP + ((top - v) / (top - bottom || 1)) * plotHeight;
    const lines = series.map((s) => {
      const points = s.values.map((v, i) => ({ x: x(i), y: y(v) }));
      const line = monotonePath(points);
      const base = y(Math.max(bottom, 0));
      const area = points.length ? `${line}L${points[points.length - 1].x},${base}L${points[0].x},${base}Z` : "";
      return { line, area };
    });
    return { ticks, x, y, lines };
  }, [series, n, plotWidth, plotHeight]);

  const pickIndex = (event: GestureResponderEvent) => {
    if (n === 0 || plotWidth <= 0) return;
    const ratio = (event.nativeEvent.locationX - AXIS_WIDTH) / plotWidth;
    const index = Math.min(n - 1, Math.max(0, Math.round(ratio * (n - 1))));
    if (index !== lastIndex.current) {
      lastIndex.current = index;
      setActive(index);
      haptics.select();
    }
  };
  const release = () => {
    lastIndex.current = null;
    setActive(null);
  };

  // A handful of evenly spaced dates along the bottom, like `interval` on the web.
  const labelCount = Math.min(n, 5);
  const labelIndexes = labelCount <= 1 ? [0] : Array.from({ length: labelCount }, (_, k) => Math.round((k * (n - 1)) / (labelCount - 1)));
  const tooltipWidth = 150;

  return (
    <View onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)} style={{ height }}>
      {width > 0 && (
        <>
          <Svg width={width} height={height - X_LABELS + 2}>
            <Defs>
              {series.map((s, i) => (
                <LinearGradient key={s.name} id={`fill-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0%" stopColor={s.color ?? c.primary} stopOpacity={0.24} />
                  <Stop offset="100%" stopColor={s.color ?? c.primary} stopOpacity={0} />
                </LinearGradient>
              ))}
            </Defs>
            {geometry.ticks.map((tick) => (
              <Line
                key={tick}
                x1={AXIS_WIDTH}
                x2={width}
                y1={geometry.y(tick)}
                y2={geometry.y(tick)}
                stroke={c.border}
                strokeDasharray="3 3"
                strokeWidth={1}
              />
            ))}
            {series.map((s, i) => (
              <G key={s.name}>
                {s.fill && <Path d={geometry.lines[i].area} fill={`url(#fill-${i})`} />}
                <Path d={geometry.lines[i].line} stroke={s.color ?? c.primary} strokeWidth={2} fill="none" strokeLinejoin="round" />
              </G>
            ))}
            {active !== null && (
              <G>
                <Line x1={geometry.x(active)} x2={geometry.x(active)} y1={TOP} y2={TOP + plotHeight} stroke={c.mutedForeground} strokeOpacity={0.35} strokeWidth={1} />
                {series.map((s) => (
                  <Circle
                    key={s.name}
                    cx={geometry.x(active)}
                    cy={geometry.y(s.values[active] ?? 0)}
                    r={4}
                    fill={c.card}
                    stroke={s.color ?? c.primary}
                    strokeWidth={2}
                  />
                ))}
              </G>
            )}
          </Svg>

          {/* Axis text as real Text, so it renders in Geist like everything else. */}
          {geometry.ticks.map((tick) => (
            <Text
              key={tick}
              size={10.5}
              tone="muted"
              tabular
              numberOfLines={1}
              style={{ position: "absolute", left: 0, width: AXIS_WIDTH - 8, top: geometry.y(tick) - 8, textAlign: "right" }}
            >
              {axisLabel(tick)}
            </Text>
          ))}
          {labelIndexes.map((index, k) => {
            const edge = k === 0 ? "left" : k === labelIndexes.length - 1 ? "right" : "center";
            const x = geometry.x(index);
            return (
              <Text
                key={`${index}-${labels[index]}`}
                size={10.5}
                tone="muted"
                numberOfLines={1}
                style={{
                  position: "absolute",
                  bottom: 0,
                  width: 64,
                  left: edge === "left" ? x - 4 : edge === "right" ? x - 60 : x - 32,
                  textAlign: edge,
                }}
              >
                {labels[index]}
              </Text>
            );
          })}

          {/* The touch surface over the plot. */}
          <View
            style={{ position: "absolute", left: 0, right: 0, top: 0, bottom: 0 }}
            onStartShouldSetResponder={() => true}
            onResponderGrant={pickIndex}
            onResponderMove={pickIndex}
            onResponderRelease={release}
            onResponderTerminate={release}
            onResponderTerminationRequest={() => true}
          />

          {active !== null && (
            <View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: Math.min(Math.max(geometry.x(active) - tooltipWidth / 2, 0), width - tooltipWidth),
                width: tooltipWidth,
                backgroundColor: c.card,
                borderColor: c.border,
                borderWidth: 1,
                borderRadius: radius.lg,
                paddingHorizontal: 10,
                paddingVertical: 8,
                gap: 4,
                shadowColor: "#000",
                shadowOpacity: 0.12,
                shadowRadius: 10,
                shadowOffset: { width: 0, height: 4 },
                elevation: 6,
              }}
            >
              <Text size={10.5} weight="semibold" tone="muted" tracking={0.06} style={{ textTransform: "uppercase" }}>
                {labels[active]}
              </Text>
              {series.map((s) => (
                <View key={s.name} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: s.color ?? c.primary }} />
                  <Text size={12.5} tone="muted" style={{ flex: 1 }}>
                    {s.name}
                  </Text>
                  <Text size={12.5} weight="semibold" tabular>
                    {money ? formatCurrency(s.values[active] ?? 0) : (s.values[active] ?? 0).toLocaleString("en-LK")}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );
}

/** Coloured dots naming each line of a multi-series chart. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <View style={{ flexDirection: "row", gap: 16, marginTop: 12 }}>
      {items.map((item) => (
        <View key={item.label} style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: item.color }} />
          <Text size={12} tone="muted">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** The web's `DonutChart`: a ring with gaps between slices and a legend of shares. */
export function DonutChart({ data, size = 150 }: { data: { label: string; value: number }[]; size?: number }) {
  const total = data.reduce((sum, d) => sum + d.value, 0);
  const outer = size / 2;
  const inner = outer * 0.64;
  const gap = data.length > 1 ? (2 * Math.PI) / 180 : 0;

  let angle = -Math.PI / 2;
  const arcs = data.map((d, i) => {
    const sweep = total ? (d.value / total) * Math.PI * 2 : 0;
    const start = angle + gap / 2;
    const end = angle + sweep - gap / 2;
    angle += sweep;
    if (end <= start) return null;
    const large = end - start > Math.PI ? 1 : 0;
    const point = (r: number, a: number) => `${outer + r * Math.cos(a)},${outer + r * Math.sin(a)}`;
    const path =
      sweep >= Math.PI * 2 - 0.0001
        ? // A single category: two half rings, since one arc cannot close on itself.
          `M${point(outer, 0)}A${outer},${outer} 0 1 1 ${point(outer, Math.PI)}A${outer},${outer} 0 1 1 ${point(outer, 0)}` +
          `M${point(inner, 0)}A${inner},${inner} 0 1 0 ${point(inner, Math.PI)}A${inner},${inner} 0 1 0 ${point(inner, 0)}Z`
        : `M${point(outer, start)}A${outer},${outer} 0 ${large} 1 ${point(outer, end)}L${point(inner, end)}A${inner},${inner} 0 ${large} 0 ${point(inner, start)}Z`;
    return <Path key={d.label} d={path} fill={CHART_COLORS[i % CHART_COLORS.length]} fillRule="evenodd" />;
  });

  return (
    <View style={{ gap: 18 }}>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Svg width={size} height={size}>{arcs}</Svg>
        <View style={{ position: "absolute", alignItems: "center" }}>
          <Text size={16} weight="semibold" tabular tracking={-0.02}>
            {formatCurrency(total, { compact: true })}
          </Text>
          <Text size={11} tone="muted">
            total
          </Text>
        </View>
      </View>
      <View style={{ gap: 9 }}>
        {data.map((d, i) => (
          <View key={d.label} style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
            <Text size={13} tone="muted" style={{ flex: 1, textTransform: "capitalize" }} numberOfLines={1}>
              {d.label}
            </Text>
            <Text size={13} weight="medium" tabular>
              {formatCurrency(d.value)}
            </Text>
            <Text size={12} tone="muted" tabular style={{ width: 38, textAlign: "right" }}>
              {total ? Math.round((d.value / total) * 100) : 0}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
