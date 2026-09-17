/**
 * Full-screen pages that bring their own chrome — the template previews carry
 * their own header and CTA bar, so they must not sit inside the marketing
 * nav and footer.
 */
export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return children;
}
