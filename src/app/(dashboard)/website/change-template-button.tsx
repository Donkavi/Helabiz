"use client";

import * as React from "react";
import { LayoutTemplate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ChangeTemplateDialog } from "./change-template-dialog";

/** The trigger for the change-template dialog, kept apart so the overview page stays a server component. */
export function ChangeTemplateButton({
  currentTemplateId,
  canUsePremium,
  pageTitles,
}: {
  currentTemplateId?: string;
  canUsePremium: boolean;
  pageTitles: { title: string; slug: string; isHome: boolean }[];
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <LayoutTemplate className="size-4" />
        Change template
      </Button>
      <ChangeTemplateDialog
        open={open}
        onOpenChange={setOpen}
        currentTemplateId={currentTemplateId}
        canUsePremium={canUsePremium}
        pageTitles={pageTitles}
      />
    </>
  );
}
