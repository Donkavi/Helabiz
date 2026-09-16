"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Printer, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { deleteInvoiceAction, updateInvoiceStatusAction } from "../actions";

export function InvoiceToolbar({
  invoiceId,
  status,
  orderId,
}: {
  invoiceId: string;
  status: string;
  orderId?: string;
}) {
  const router = useRouter();
  const [pending, startTransition] = React.useTransition();

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={status}
        onValueChange={(next) =>
          startTransition(async () => {
            await updateInvoiceStatusAction(invoiceId, next);
            toast.success("Invoice updated");
            router.refresh();
          })
        }
        disabled={pending}
      >
        <SelectTrigger className="w-[130px]" aria-label="Invoice status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {["draft", "sent", "paid", "overdue", "void"].map((value) => (
            <SelectItem key={value} value={value} className="capitalize">
              {value}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {orderId && (
        <Button variant="outline" onClick={() => router.push(`/orders/${orderId}`)}>
          View order
        </Button>
      )}

      <Button onClick={() => window.print()}>
        <Printer className="size-4" />
        Print / Save PDF
      </Button>

      <Button
        variant="ghost"
        size="icon"
        aria-label="Delete invoice"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteInvoiceAction(invoiceId);
            toast.success("Invoice deleted");
            router.push("/invoices");
          })
        }
      >
        <Trash2 className="text-destructive" />
      </Button>
    </div>
  );
}
