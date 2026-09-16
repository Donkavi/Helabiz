import Link from "next/link";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function UpgradeNotice({
  title,
  description,
  cta = "See plans",
}: {
  title: string;
  description: string;
  cta?: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-xl border border-primary/25 bg-primary-muted/40 p-4">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <Sparkles className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold">{title}</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">{description}</p>
      </div>
      <Button size="sm" asChild>
        <Link href="/settings/billing">{cta}</Link>
      </Button>
    </div>
  );
}
