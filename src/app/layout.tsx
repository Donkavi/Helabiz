import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_URL } from "@/lib/website/urls";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(APP_URL),
  title: {
    default: "Helabiz — Your business. Your website. One simple platform.",
    template: "%s · Helabiz",
  },
  description:
    "Manage your products, orders, customers and profits — and build your own professional website without writing code. Made for Sri Lankan small businesses.",
  keywords: ["Sri Lanka business software", "website builder", "online store", "POS", "small business", "Helabiz"],
  openGraph: {
    type: "website",
    locale: "en_LK",
    siteName: "Helabiz",
    title: "Helabiz — Your business. Your website. One simple platform.",
    description:
      "Manage your products, orders, customers and profits — and build your own professional website without writing code.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0f12" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Applies the stored theme before paint so there is no light/dark flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('helabiz-theme')||'system';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
