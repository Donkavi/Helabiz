"use client";

import * as React from "react";
import { Mascot } from "page-mascot";
import {
  BadgeCheck,
  Boxes,
  LayoutTemplate,
  Receipt,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { FacebookIcon, InstagramIcon } from "@/components/website/social-icons";
import { COPY, LANGS, type FeatureIcon, type Lang } from "./content";
import { cn } from "@/lib/utils";

const ICONS: Record<FeatureIcon, typeof LayoutTemplate> = {
  builder: LayoutTemplate,
  orders: ShoppingBag,
  stock: Boxes,
  money: Wallet,
  invoice: Receipt,
  free: BadgeCheck,
};

/**
 * The launch teaser.
 *
 * Sinhala is the default because that is who this is for; the toggle is there
 * for everyone else. Both languages ship in the page rather than being fetched,
 * so switching is instant and neither one is the "real" version.
 */
export function ComingSoon({ facebook, instagram }: { facebook?: string; instagram?: string }) {
  const [lang, setLang] = React.useState<Lang>("si");
  const t = COPY[lang];

  return (
    <div className="min-h-dvh bg-[#0B1513] text-[#F4F1EA] antialiased">
      {/* Backdrop: a jade wash behind a faint grid. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 -top-40 size-[34rem] rounded-full bg-[#14776B]/25 blur-[120px]" />
        <div className="absolute -bottom-52 -right-32 size-[38rem] rounded-full bg-[#2FBFAC]/15 blur-[140px]" />
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #ffffff14 1px, transparent 1px), linear-gradient(to bottom, #ffffff14 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            maskImage: "radial-gradient(ellipse at 50% 0%, black, transparent 72%)",
          }}
        />
      </div>

      <div className="relative mx-auto flex min-h-dvh max-w-5xl flex-col px-5 py-8 sm:px-8">
        <header className="flex items-center justify-between gap-4">
          <span className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-[11px] bg-[#2FBFAC] text-[#0B1513]">
              <svg viewBox="0 0 24 24" fill="none" className="size-5">
                <path d="M4 7.5h16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <path
                  d="M6.5 11v6.5M17.5 11v6.5M6.5 14.2h11"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </span>
            <span className="text-[19px] font-bold tracking-[-0.02em]">
              Hela<span className="text-[#2FBFAC]">biz</span>
            </span>
          </span>

          <div
            className="flex items-center gap-0.5 rounded-lg bg-white/8 p-0.5 ring-1 ring-white/10"
            role="group"
            aria-label="Language"
          >
            {LANGS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setLang(option.id)}
                aria-pressed={lang === option.id}
                className={cn(
                  "rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                  lang === option.id ? "bg-[#2FBFAC] text-[#0B1513]" : "text-white/70 hover:text-white",
                )}
              >
                {option.label}
              </button>
            ))}
          </div>
        </header>

        {/* Hero */}
        <section className="grid items-center gap-10 py-16 sm:py-24 lg:grid-cols-[1.35fr_1fr] lg:gap-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-[#2FBFAC]/15 px-3.5 py-1.5 text-[12.5px] font-semibold text-[#2FBFAC] ring-1 ring-[#2FBFAC]/25">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-[#2FBFAC] opacity-75" />
                <span className="relative inline-flex size-1.5 rounded-full bg-[#2FBFAC]" />
              </span>
              {t.badge}
            </span>

            <h1 className="mt-6 whitespace-pre-line text-[34px] font-semibold leading-[1.18] tracking-[-0.03em] sm:text-[46px]">
              {t.headline}
            </h1>

            <p className="mt-6 max-w-xl text-[15.5px] leading-[1.75] text-white/70 text-pretty">{t.lede}</p>

            {(facebook || instagram) && (
              <div className="mt-8 flex flex-wrap gap-2.5">
                {facebook && (
                  <a
                    href={facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-[#2FBFAC] px-4 py-2.5 text-[14px] font-semibold text-[#0B1513] transition-transform hover:-translate-y-0.5"
                  >
                    <FacebookIcon className="size-4" />
                    {t.facebook}
                  </a>
                )}
                {instagram && (
                  <a
                    href={instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-[14px] font-semibold ring-1 ring-white/15 transition-colors hover:bg-white/15"
                  >
                    <InstagramIcon className="size-4" />
                    {t.instagram}
                  </a>
                )}
              </div>
            )}
          </div>

          {/* The mascot watches the cursor and reacts when poked. */}
          <div className="flex flex-col items-center gap-3 lg:items-end lg:pr-6">
            <div className="rounded-[28px] bg-white/5 p-5 ring-1 ring-white/10 backdrop-blur-sm">
              <Mascot
                directions="/mascots/helabiz-directions.webp"
                reactions="/mascots/helabiz-reactions.webp"
                size={176}
                label="Helabiz mascot"
              />
            </div>
            <p className="text-center text-[12.5px] text-white/45">{t.mascotHint}</p>
          </div>
        </section>

        {/* What is coming */}
        <section className="border-t border-white/10 py-14">
          <h2 className="text-[24px] font-semibold tracking-[-0.02em]">{t.whatsComing}</h2>
          <p className="mt-2 text-[14px] text-white/55">{t.whatsComingNote}</p>

          <ul className="mt-9 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {t.features.map((feature) => {
              const Icon = ICONS[feature.icon];
              return (
                <li
                  key={feature.title}
                  className="rounded-2xl bg-white/[0.04] p-5 ring-1 ring-white/10 transition-colors hover:bg-white/[0.07]"
                >
                  <span className="flex size-10 items-center justify-center rounded-xl bg-[#2FBFAC]/15 text-[#2FBFAC]">
                    <Icon className="size-[18px]" />
                  </span>
                  <h3 className="mt-4 text-[14.5px] font-semibold leading-snug">{feature.title}</h3>
                  <p className="mt-2 text-[13px] leading-[1.7] text-white/60">{feature.body}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Price and follow */}
        <section className="grid gap-4 border-t border-white/10 py-14 sm:grid-cols-2">
          <div className="rounded-2xl bg-white/[0.04] p-6 ring-1 ring-white/10">
            <h2 className="text-[16px] font-semibold">{t.priceTitle}</h2>
            <p className="mt-2.5 text-[13.5px] leading-[1.75] text-white/65">{t.priceBody}</p>
          </div>
          <div className="rounded-2xl bg-[#2FBFAC]/10 p-6 ring-1 ring-[#2FBFAC]/25">
            <h2 className="text-[16px] font-semibold">{t.followTitle}</h2>
            <p className="mt-2.5 text-[13.5px] leading-[1.75] text-white/70">{t.followBody}</p>
          </div>
        </section>

        <footer className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-6 text-[12.5px] text-white/40">
          <span>© {new Date().getFullYear()} Helabiz</span>
          <span>{t.madeIn} 🇱🇰</span>
        </footer>
      </div>
    </div>
  );
}
