import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

/** Page links that keep whatever filters are already in the URL. */
export function Pagination({ page, pages, basePath }: { page: number; pages: number; basePath: string }) {
  if (pages <= 1) return null;

  const href = (target: number) => {
    const [path, query] = basePath.split("?");
    const params = new URLSearchParams(query);
    if (target > 1) params.set("page", String(target));
    else params.delete("page");
    const qs = params.toString();
    return `${path}${qs ? `?${qs}` : ""}`;
  };

  const step = "inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-[13px] transition-colors";

  return (
    <nav className="flex items-center justify-between gap-3 pt-1" aria-label="Pages">
      <Link
        href={href(page - 1)}
        aria-disabled={page <= 1}
        tabIndex={page <= 1 ? -1 : undefined}
        className={cn(step, page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-accent")}
      >
        <ChevronLeft className="size-3.5" />
        Previous
      </Link>

      <span className="text-[12.5px] text-muted-foreground">
        Page {page} of {pages}
      </span>

      <Link
        href={href(page + 1)}
        aria-disabled={page >= pages}
        tabIndex={page >= pages ? -1 : undefined}
        className={cn(step, page >= pages ? "pointer-events-none opacity-40" : "hover:bg-accent")}
      >
        Next
        <ChevronRight className="size-3.5" />
      </Link>
    </nav>
  );
}
