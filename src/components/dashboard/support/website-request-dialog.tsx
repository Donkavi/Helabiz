"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AlertCircle, CheckCircle2, HeartHandshake, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useLang } from "@/lib/i18n/provider";
import { REQUEST_PAGES, REQUEST_PAGE_LABELS, type RequestPage } from "@/lib/website-request";
import { cn } from "@/lib/utils";
import { submitWebsiteRequestAction, type WebsiteRequestFormInput } from "@/app/(dashboard)/support/actions";
import type { WebsiteRequestView } from "@/services/support-service";
import { SUPPORT_UI, type SupportCopy } from "./copy";

type Field = keyof WebsiteRequestFormInput;

const DEFAULT_PAGES: RequestPage[] = ["home", "shop", "contact"];

/**
 * The server's field errors, said in the person's own language. The server
 * speaks English; which field failed is all this needs from it.
 */
function fieldMessage(field: Field, copy: SupportCopy) {
  if (field === "phone") return copy.fieldErrors.phone;
  if (field === "about") return copy.fieldErrors.about;
  if (field === "pages") return copy.fieldErrors.pages;
  return copy.fieldErrors.tooLong;
}

/**
 * "Build my website for me": the details the Helabiz team needs before they
 * call. Opened from the popup, the banners and the Support page.
 *
 * The action revalidates the page behind, so a banner offering the request
 * turns into its status while the thank-you is still showing. Callers keep
 * this dialog mounted through that change rather than inside the offer.
 */
export function WebsiteRequestDialog({
  open,
  onOpenChange,
  defaultPhone,
  onSubmitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The business's phone, as a starting point. */
  defaultPhone?: string;
  onSubmitted?: (request: WebsiteRequestView) => void;
}) {
  const lang = useLang();
  const copy = SUPPORT_UI[lang];
  const pathname = usePathname();
  const onSupportPage = pathname === "/support";

  const [phone, setPhone] = React.useState(defaultPhone ?? "");
  const [whatsapp, setWhatsapp] = React.useState(true);
  const [bestTime, setBestTime] = React.useState("");
  const [about, setAbout] = React.useState("");
  const [pages, setPages] = React.useState<RequestPage[]>(DEFAULT_PAGES);
  const [style, setStyle] = React.useState("");
  const [links, setLinks] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [errors, setErrors] = React.useState<Partial<Record<Field, string>>>({});
  const [error, setError] = React.useState("");
  const [done, setDone] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const id = React.useId();

  // Opening it again starts at the form, not last time's thank-you.
  const [wasOpen, setWasOpen] = React.useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDone(false);
      setError("");
    }
  }

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    startTransition(async () => {
      try {
        const result = await submitWebsiteRequestAction({ phone, whatsapp, bestTime, about, pages, style, links, notes });
        if (result.ok) {
          setErrors({});
          setDone(true);
          onSubmitted?.(result.request);
          return;
        }
        const next: Partial<Record<Field, string>> = {};
        for (const key of Object.keys(result.fieldErrors ?? {}) as Field[]) next[key] = fieldMessage(key, copy);
        setErrors(next);
        if (result.error) setError(result.error);
        else if (!Object.keys(next).length) setError(copy.genericError);
      } catch {
        setError(copy.genericError);
      }
    });
  };

  const togglePage = (page: RequestPage) =>
    setPages((current) =>
      current.includes(page)
        ? current.filter((item) => item !== page)
        : REQUEST_PAGES.filter((item) => item === page || current.includes(item)),
    );

  const fieldError = (field: Field) =>
    errors[field] ? (
      <p id={`${id}-${field}-error`} className="text-[12.5px] text-destructive">
        {errors[field]}
      </p>
    ) : null;

  const invalid = (field: Field) =>
    errors[field] ? { "aria-invalid": true, "aria-describedby": `${id}-${field}-error` } : {};

  const optional = <span className="font-normal text-muted-foreground">({copy.optional})</span>;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg" lang={lang}>
        {done ? (
          <div className="flex flex-col items-center py-4 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-success/12 text-success">
              <CheckCircle2 className="size-7" />
            </span>
            <DialogHeader className="mt-4 items-center pr-0">
              <DialogTitle>{copy.doneTitle}</DialogTitle>
              <DialogDescription className="max-w-md text-[14px] leading-relaxed">{copy.doneBody}</DialogDescription>
            </DialogHeader>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row">
              {onSupportPage ? (
                <Button onClick={() => onOpenChange(false)}>
                  <MessageCircle className="size-4" />
                  {copy.backToChat}
                </Button>
              ) : (
                <>
                  <Button variant="ghost" onClick={() => onOpenChange(false)}>
                    {copy.close}
                  </Button>
                  <Button asChild>
                    <Link href="/support" onClick={() => onOpenChange(false)}>
                      <MessageCircle className="size-4" />
                      {copy.openChat}
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>{copy.formTitle}</DialogTitle>
              <DialogDescription>{copy.formDescription}</DialogDescription>
            </DialogHeader>

            <p className="flex items-start gap-2.5 rounded-xl border border-primary/20 bg-primary-muted/40 px-3.5 py-3 text-[13px] leading-relaxed text-foreground">
              <HeartHandshake className="mt-0.5 size-4 shrink-0 text-primary" />
              {copy.reassurance}
            </p>

            <form onSubmit={submit} className="space-y-4" noValidate>
              {error && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-lg border border-destructive/25 bg-destructive/8 px-3.5 py-3 text-[13px] text-destructive"
                >
                  <AlertCircle className="mt-px size-4 shrink-0" />
                  {error}
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-phone`}>{copy.phone}</Label>
                  <Input
                    id={`${id}-phone`}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={copy.phonePlaceholder}
                    required
                    {...invalid("phone")}
                  />
                  {fieldError("phone") ?? <p className="text-[12px] text-muted-foreground">{copy.phoneHint}</p>}
                  <label className="flex cursor-pointer items-center gap-2 pt-1 text-[13px]">
                    <input
                      type="checkbox"
                      className="size-4 accent-[var(--primary)]"
                      checked={whatsapp}
                      onChange={(event) => setWhatsapp(event.target.checked)}
                    />
                    {copy.whatsapp}
                  </label>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor={`${id}-time`}>
                    {copy.bestTime} {optional}
                  </Label>
                  <Input
                    id={`${id}-time`}
                    value={bestTime}
                    onChange={(event) => setBestTime(event.target.value)}
                    placeholder={copy.bestTimePlaceholder}
                    maxLength={80}
                    {...invalid("bestTime")}
                  />
                  {fieldError("bestTime")}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${id}-about`}>{copy.about}</Label>
                <Textarea
                  id={`${id}-about`}
                  value={about}
                  onChange={(event) => setAbout(event.target.value)}
                  placeholder={copy.aboutPlaceholder}
                  rows={3}
                  maxLength={1500}
                  required
                  {...invalid("about")}
                />
                {fieldError("about")}
              </div>

              <fieldset className="space-y-2" {...invalid("pages")}>
                <legend className="text-[13px] font-medium">{copy.pages}</legend>
                <div className="flex flex-wrap gap-2">
                  {REQUEST_PAGES.map((page) => {
                    const ticked = pages.includes(page);
                    return (
                      <label
                        key={page}
                        className={cn(
                          "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-1.5 text-[13px] transition-colors",
                          ticked
                            ? "border-primary/55 bg-primary-muted/30 font-medium"
                            : "border-border bg-background hover:bg-accent/40",
                        )}
                      >
                        <input
                          type="checkbox"
                          className="size-4 accent-[var(--primary)]"
                          checked={ticked}
                          onChange={() => togglePage(page)}
                        />
                        {REQUEST_PAGE_LABELS[page][lang]}
                      </label>
                    );
                  })}
                </div>
                {fieldError("pages")}
              </fieldset>

              <div className="space-y-1.5">
                <Label htmlFor={`${id}-style`}>
                  {copy.style} {optional}
                </Label>
                <Textarea
                  id={`${id}-style`}
                  value={style}
                  onChange={(event) => setStyle(event.target.value)}
                  placeholder={copy.stylePlaceholder}
                  rows={2}
                  maxLength={600}
                  className="min-h-16"
                  {...invalid("style")}
                />
                {fieldError("style")}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${id}-links`}>
                  {copy.links} {optional}
                </Label>
                <Textarea
                  id={`${id}-links`}
                  value={links}
                  onChange={(event) => setLinks(event.target.value)}
                  placeholder={copy.linksPlaceholder}
                  rows={2}
                  maxLength={600}
                  className="min-h-16"
                  {...invalid("links")}
                />
                {fieldError("links")}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor={`${id}-notes`}>
                  {copy.notes} {optional}
                </Label>
                <Textarea
                  id={`${id}-notes`}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={copy.notesPlaceholder}
                  rows={2}
                  maxLength={1500}
                  className="min-h-16"
                  {...invalid("notes")}
                />
                {fieldError("notes")}
              </div>

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} disabled={pending}>
                  {copy.cancel}
                </Button>
                <Button type="submit" loading={pending}>
                  {pending ? copy.submitting : copy.submit}
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
