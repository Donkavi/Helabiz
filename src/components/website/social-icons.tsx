import * as React from "react";

/**
 * Brand glyphs, drawn inline. Lucide dropped its brand icon set, and these are
 * the only four networks the site renderer offers.
 */
type IconProps = { size?: number; className?: string };

export function FacebookIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06C2 17.08 5.66 21.24 10.44 22v-7.03H7.9v-2.91h2.54V9.85c0-2.51 1.49-3.9 3.77-3.9 1.09 0 2.24.2 2.24.2v2.46h-1.26c-1.24 0-1.63.78-1.63 1.57v1.88h2.78l-.44 2.91h-2.34V22C18.34 21.24 22 17.08 22 12.06Z" />
    </svg>
  );
}

export function InstagramIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" className={className} aria-hidden>
      <rect x="2.5" y="2.5" width="19" height="19" rx="5.4" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function YoutubeIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22.54 6.96a2.78 2.78 0 0 0-1.95-1.97C18.88 4.5 12 4.5 12 4.5s-6.88 0-8.59.49A2.78 2.78 0 0 0 1.46 6.96C1 8.68 1 12.25 1 12.25s0 3.57.46 5.29a2.78 2.78 0 0 0 1.95 1.97c1.71.49 8.59.49 8.59.49s6.88 0 8.59-.49a2.78 2.78 0 0 0 1.95-1.97c.46-1.72.46-5.29.46-5.29s0-3.57-.46-5.29ZM9.75 15.52V8.98l5.75 3.27-5.75 3.27Z" />
    </svg>
  );
}

export function TiktokIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-3.09v12.4a2.59 2.59 0 1 1-1.84-2.48v-3.13a5.67 5.67 0 1 0 4.93 5.61V9.01a7.35 7.35 0 0 0 4.3 1.38V7.3a4.29 4.29 0 0 1-3.24-1.48Z" />
    </svg>
  );
}

export const SOCIAL_ICONS = {
  facebook: FacebookIcon,
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TiktokIcon,
} as const;

export type SocialKey = keyof typeof SOCIAL_ICONS;
