"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import type { SectionNode } from "@/types";
import type { SiteContext } from "@/lib/website/render-types";
import { SectionHeading, SiteButton, SiteImage, SiteLink, cardClass, embedUrl } from "../primitives";

type P = { node: SectionNode; ctx: SiteContext };
const str = (v: unknown, fallback = "") => (typeof v === "string" ? v : fallback);
const num = (v: unknown, fallback = 0) => (typeof v === "number" ? v : fallback);
const bool = (v: unknown, fallback = false) => (typeof v === "boolean" ? v : fallback);
const arr = <T,>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);

type GalleryItem = { src?: string; caption?: string; link?: string };

/* ── Gallery ──────────────────────────────────────────────────────────── */
export function GallerySection({ node, ctx }: P) {
  const p = node.props;
  const items = arr<GalleryItem>(p.items);
  const layout = str(p.layout, "grid");
  const columns = num(p.columns, 3);
  const hover = str(p.hoverEffect, "zoom");
  const [lightbox, setLightbox] = React.useState<number | null>(null);
  const canLightbox = bool(p.lightbox, true) && !ctx.editor;

  const hoverStyle: React.CSSProperties =
    hover === "zoom"
      ? { transition: "transform .45s cubic-bezier(.22,1,.36,1)" }
      : hover === "fade"
        ? { transition: "opacity .3s ease" }
        : {};

  const tile = (item: GalleryItem, i: number) => {
    const inner = (
      <figure
        className={`w-gal-tile w-gal-${hover}`}
        style={{
          margin: 0,
          borderRadius: "var(--sec-radius)",
          overflow: "hidden",
          background: "var(--w-surface)",
          cursor: canLightbox || item.link ? "pointer" : undefined,
          aspectRatio: layout === "masonry" ? undefined : "1/1",
          transition: "transform .25s ease, box-shadow .25s ease",
        }}
      >
        <SiteImage src={item.src} alt={item.caption ?? ""} className="w-img" style={hoverStyle} />
        {item.caption && (
          <figcaption className="w-muted" style={{ padding: "10px 12px", fontSize: 13 }}>
            {item.caption}
          </figcaption>
        )}
      </figure>
    );

    if (item.link) {
      return (
        <SiteLink ctx={ctx} href={item.link} key={i}>
          {inner}
        </SiteLink>
      );
    }
    return (
      <div key={i} onClick={canLightbox ? () => setLightbox(i) : undefined} role={canLightbox ? "button" : undefined} tabIndex={canLightbox ? 0 : undefined}
        onKeyDown={canLightbox ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setLightbox(i); } } : undefined}>
        {inner}
      </div>
    );
  };

  return (
    <div className="w-in">
      {str(p.title) && <SectionHeading title={str(p.title)} align={node.styles.align ?? "center"} />}

      {layout === "scroll" ? (
        <div
          className="w-scroll-row"
          style={{ display: "flex", gap: "var(--sec-gap,14px)", overflowX: "auto", paddingBottom: 10, scrollSnapType: "x mandatory" }}
        >
          {items.map((item, i) => (
            <div key={i} style={{ flex: `0 0 ${100 / Math.min(columns, 4)}%`, minWidth: 220, scrollSnapAlign: "start" }}>
              {tile(item, i)}
            </div>
          ))}
        </div>
      ) : layout === "masonry" ? (
        <div style={{ columnCount: columns, columnGap: "var(--sec-gap,14px)" }}>
          {items.map((item, i) => (
            <div key={i} style={{ breakInside: "avoid", marginBottom: "var(--sec-gap,14px)" }}>
              {tile(item, i)}
            </div>
          ))}
        </div>
      ) : (
        <div className="w-grid" style={{ "--sec-cols": columns } as React.CSSProperties}>
          {items.map(tile)}
        </div>
      )}

      {lightbox !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image preview"
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,.9)",
            display: "grid",
            placeItems: "center",
            padding: 24,
          }}
        >
          <button
            type="button"
            aria-label="Close preview"
            onClick={() => setLightbox(null)}
            style={{ position: "absolute", top: 20, right: 20, background: "none", border: 0, color: "#fff", cursor: "pointer" }}
          >
            <X size={26} />
          </button>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => ((i ?? 0) - 1 + items.length) % items.length); }}
            style={{ position: "absolute", left: 16, background: "none", border: 0, color: "#fff", cursor: "pointer" }}
          >
            <ChevronLeft size={34} />
          </button>
          <SiteImage
            src={items[lightbox]?.src}
            alt={items[lightbox]?.caption ?? ""}
            style={{ maxWidth: "92vw", maxHeight: "86vh", objectFit: "contain" }}
          />
          <button
            type="button"
            aria-label="Next image"
            onClick={(e) => { e.stopPropagation(); setLightbox((i) => ((i ?? 0) + 1) % items.length); }}
            style={{ position: "absolute", right: 16, background: "none", border: 0, color: "#fff", cursor: "pointer" }}
          >
            <ChevronRight size={34} />
          </button>
        </div>
      )}
    </div>
  );
}

/* ── Slider ───────────────────────────────────────────────────────────── */
type Slide = { image?: string; heading?: string; description?: string; buttonText?: string; buttonUrl?: string };

export function SliderSection({ node, ctx }: P) {
  const p = node.props;
  const slides = arr<Slide>(p.slides);
  const [index, setIndex] = React.useState(0);
  const autoplay = bool(p.autoplay, true) && !ctx.editor && slides.length > 1;
  const duration = Math.max(2, num(p.duration, 5)) * 1000;
  const fade = str(p.transition, "slide") === "fade";
  const height = num(p.height, 460);

  React.useEffect(() => {
    if (!autoplay) return;
    const id = setInterval(() => setIndex((i) => (i + 1) % slides.length), duration);
    return () => clearInterval(id);
  }, [autoplay, duration, slides.length]);

  // Deleting slides in the builder can leave `index` past the end. Clamping
  // during render avoids a second pass.
  const current = slides.length ? Math.min(index, slides.length - 1) : 0;

  if (!slides.length) {
    return (
      <div className="w-in" style={{ padding: 40, textAlign: "center" }}>
        <p className="w-muted">Add your first slide in the settings panel.</p>
      </div>
    );
  }

  return (
    <div style={{ position: "relative", height, overflow: "hidden", borderRadius: "var(--sec-radius)" }}>
      <div
        style={
          fade
            ? { position: "absolute", inset: 0 }
            : {
                display: "flex",
                height: "100%",
                width: `${slides.length * 100}%`,
                transform: `translateX(-${current * (100 / slides.length)}%)`,
                transition: "transform .7s cubic-bezier(.22,1,.36,1)",
              }
        }
      >
        {slides.map((slide, i) => (
          <div
            key={i}
            style={
              fade
                ? { position: "absolute", inset: 0, opacity: i === current ? 1 : 0, transition: "opacity .7s ease" }
                : { width: `${100 / slides.length}%`, height: "100%", position: "relative", flexShrink: 0 }
            }
            aria-hidden={i !== current}
          >
            <SiteImage src={slide.image} alt="" className="w-img" priority={i === 0} />
            <span className="w-overlay" style={{ opacity: "var(--sec-overlay,.42)" }} />
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                color: "#fff",
                padding: 28,
                zIndex: 2,
              }}
            >
              {slide.heading && (
                <h2 style={{ fontSize: "clamp(26px,4vw,46px)", fontWeight: 600, maxWidth: 780 }}>{slide.heading}</h2>
              )}
              {slide.description && (
                <p style={{ marginTop: 14, fontSize: 16.5, maxWidth: 560, color: "rgba(255,255,255,.88)" }}>
                  {slide.description}
                </p>
              )}
              {slide.buttonText && (
                <div style={{ marginTop: 26 }}>
                  <SiteButton ctx={ctx} href={slide.buttonUrl} label={slide.buttonText} size="lg" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {bool(p.arrows, true) && slides.length > 1 && (
        <>
          <SliderArrow side="left" onClick={() => setIndex((i) => (i - 1 + slides.length) % slides.length)} />
          <SliderArrow side="right" onClick={() => setIndex((i) => (i + 1) % slides.length)} />
        </>
      )}

      {bool(p.dots, true) && slides.length > 1 && (
        <div style={{ position: "absolute", bottom: 18, left: 0, right: 0, display: "flex", justifyContent: "center", gap: 7, zIndex: 3 }}>
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === current}
              onClick={() => setIndex(i)}
              style={{
                width: i === current ? 22 : 7,
                height: 7,
                borderRadius: 999,
                border: 0,
                cursor: "pointer",
                background: i === current ? "#fff" : "rgba(255,255,255,.5)",
                transition: "width .3s ease, background .3s ease",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SliderArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={side === "left" ? "Previous slide" : "Next slide"}
      style={{
        position: "absolute",
        top: "50%",
        [side]: 16,
        transform: "translateY(-50%)",
        width: 40,
        height: 40,
        borderRadius: 999,
        border: 0,
        background: "rgba(255,255,255,.9)",
        color: "#111",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
        zIndex: 3,
      }}
    >
      <Icon size={19} />
    </button>
  );
}

/* ── Carousel ─────────────────────────────────────────────────────────── */
export function CarouselSection({ node, ctx }: P) {
  const p = node.props;
  const items = arr<{ image?: string; title?: string; description?: string; link?: string }>(p.items);
  const perView = num(p.perView, 3);
  const trackRef = React.useRef<HTMLDivElement>(null);

  const scrollBy = (dir: number) => {
    const el = trackRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.8, behavior: "smooth" });
  };

  return (
    <div className="w-in">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22, gap: 16 }}>
        {str(p.title) && <h2 style={{ fontSize: "clamp(22px,2.8vw,30px)", fontWeight: 600 }}>{str(p.title)}</h2>}
        {!ctx.editor && items.length > perView && (
          <div style={{ display: "flex", gap: 8 }}>
            <CarouselNav onClick={() => scrollBy(-1)} label="Scroll left" icon={ChevronLeft} />
            <CarouselNav onClick={() => scrollBy(1)} label="Scroll right" icon={ChevronRight} />
          </div>
        )}
      </div>
      <div
        ref={trackRef}
        className="w-scroll-row"
        style={{ display: "flex", gap: "var(--sec-gap,18px)", overflowX: "auto", scrollSnapType: "x mandatory", paddingBottom: 8 }}
      >
        {items.map((item, i) => (
          <SiteLink
            ctx={ctx}
            href={item.link}
            key={i}
            className={cardClass(ctx)}
            style={{ flex: `0 0 calc((100% - (var(--sec-gap,18px) * ${perView - 1})) / ${perView})`, minWidth: 220, scrollSnapAlign: "start", display: "block" }}
          >
            <div style={{ aspectRatio: "4/3", background: "var(--w-surface)" }}>
              <SiteImage src={item.image} alt={item.title ?? ""} className="w-img" />
            </div>
            <div style={{ padding: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 600 }}>{item.title}</h3>
              {item.description && (
                <p className="w-muted" style={{ marginTop: 6, fontSize: 13.5, lineHeight: 1.6 }}>
                  {item.description}
                </p>
              )}
            </div>
          </SiteLink>
        ))}
      </div>
    </div>
  );
}

function CarouselNav({ onClick, label, icon: Icon }: { onClick: () => void; label: string; icon: typeof ChevronLeft }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      style={{
        width: 34,
        height: 34,
        borderRadius: 999,
        border: "1px solid color-mix(in srgb,var(--w-text) 16%,transparent)",
        background: "transparent",
        color: "inherit",
        display: "grid",
        placeItems: "center",
        cursor: "pointer",
      }}
    >
      <Icon size={16} />
    </button>
  );
}

/* ── Video section ────────────────────────────────────────────────────── */
export function VideoBlockSection({ node }: P) {
  const p = node.props;
  const src = embedUrl(str(p.url));
  const side = str(p.layout, "below") === "side";

  const player = (
    <div style={{ borderRadius: "var(--sec-radius)", overflow: "hidden", aspectRatio: "16/9", background: "var(--w-surface)" }}>
      {src ? (
        <iframe
          src={src}
          title={str(p.title) || "Video"}
          style={{ width: "100%", height: "100%", border: 0 }}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
        />
      ) : (
        <div style={{ display: "grid", placeItems: "center", height: "100%", color: "var(--w-muted)", fontSize: 14 }}>
          Paste a YouTube or Vimeo link
        </div>
      )}
    </div>
  );

  if (side) {
    return (
      <div className="w-in" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(300px,1fr))", gap: 40, alignItems: "center" }}>
        <div>
          <h2 style={{ fontSize: "clamp(22px,2.8vw,32px)", fontWeight: 600 }}>{str(p.title)}</h2>
          {str(p.description) && (
            <p className="w-muted" style={{ marginTop: 14, fontSize: 15.5, lineHeight: 1.7 }}>
              {str(p.description)}
            </p>
          )}
        </div>
        {player}
      </div>
    );
  }

  return (
    <div className="w-in">
      <SectionHeading title={str(p.title)} subtitle={str(p.description)} align={node.styles.align ?? "center"} />
      {player}
    </div>
  );
}
