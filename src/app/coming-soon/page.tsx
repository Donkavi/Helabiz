import type { Metadata } from "next";
import { comingSoonEnabled } from "@/lib/coming-soon";
import { ComingSoon } from "./coming-soon";

// The teaser is the whole site while the gate is up, so nothing here is cached
// against a deployment that flips the flag.
export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  return {
    // Absolute: the root layout appends "· Helabiz", which would repeat here.
    title: { absolute: "Helabiz — ඉක්මනින්ම · Coming soon" },
    description:
      "ශ්‍රී ලාංකික කුඩා ව්‍යාපාර සඳහාම හදපු platform එකක්. කේත ලියන්නේ නැතිව ඔබේම වෙබ් අඩවියක් හදාගන්න. A website builder and business tools made for Sri Lankan small businesses.",
    // Worth indexing when it is the live site; not worth it when it is a page
    // sitting behind a launched product.
    robots: comingSoonEnabled() ? { index: true, follow: true } : { index: false, follow: false },
  };
}

export default function ComingSoonPage() {
  return (
    <ComingSoon
      facebook={process.env.NEXT_PUBLIC_FACEBOOK_URL || undefined}
      instagram={process.env.NEXT_PUBLIC_INSTAGRAM_URL || undefined}
    />
  );
}
