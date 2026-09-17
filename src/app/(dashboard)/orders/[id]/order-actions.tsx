"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Copy, FileText, MessageCircle, MoreHorizontal, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_VALUES } from "@/components/dashboard/order-status-badge";
import { useT } from "@/lib/i18n/provider";
import type { OrderStatus, PaymentStatus } from "@/types";
import { deleteOrderAction, updateOrderStatusAction, updatePaymentStatusAction } from "../actions";
import { createInvoiceAction } from "../../invoices/actions";

export function OrderActions({
  orderId,
  status,
  paymentStatus,
  whatsappHref,
  message,
  invoiceId,
}: {
  orderId: string;
  status: string;
  paymentStatus: string;
  whatsappHref?: string;
  message: string;
  invoiceId?: string;
}) {
  const router = useRouter();
  const t = useT();
  const [pending, startTransition] = React.useTransition();
  const [confirmDelete, setConfirmDelete] = React.useState(false);
  const [previewOpen, setPreviewOpen] = React.useState(false);

  const setStatus = (next: string) => {
    startTransition(async () => {
      await updateOrderStatusAction(orderId, next as OrderStatus);
      toast.success(`Order marked as ${next}`);
      router.refresh();
    });
  };

  const setPayment = (next: string) => {
    startTransition(async () => {
      await updatePaymentStatusAction(orderId, next as PaymentStatus);
      toast.success("Payment status updated");
      router.refresh();
    });
  };

  const makeInvoice = () => {
    if (invoiceId) {
      router.push(`/invoices/${invoiceId}`);
      return;
    }
    startTransition(async () => {
      const result = await createInvoiceAction(orderId);
      if (result?.ok && result.data) router.push(`/invoices/${result.data.id}`);
      else toast.error((result && !result.ok && result.error) || "Could not create the invoice");
    });
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select value={status} onValueChange={setStatus} disabled={pending}>
        <SelectTrigger className="w-[150px]" aria-label="Order status">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUS_VALUES.map((value) => (
            <SelectItem key={value} value={value}>
              {t.enums.orderStatus[value]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {whatsappHref && (
        <Button asChild>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <MessageCircle className="size-4" />
            Send via WhatsApp
          </a>
        </Button>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuLabel>Payment</DropdownMenuLabel>
          {["unpaid", "paid", "partial", "refunded"].map((value) => (
            <DropdownMenuItem key={value} onSelect={() => setPayment(value)} disabled={paymentStatus === value}>
              Mark as {value}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={makeInvoice}>
            <FileText />
            {invoiceId ? "View invoice" : "Create invoice"}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setPreviewOpen(true)}>
            <Copy />
            Copy order message
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirmDelete(true)}>
            <Trash2 />
            Delete order
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Order message</DialogTitle>
            <DialogDescription>
              This is what your customer receives. Copy it to send anywhere, or use the WhatsApp button.
            </DialogDescription>
          </DialogHeader>
          <Textarea readOnly value={message} rows={14} className="font-mono text-[12.5px]" />
          <DialogFooter>
            <Button
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(message);
                  toast.success("Message copied");
                  setPreviewOpen(false);
                } catch {
                  toast.error("Could not copy — select the text and copy manually");
                }
              }}
            >
              <Copy className="size-4" />
              Copy message
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Delete this order?</DialogTitle>
            <DialogDescription>
              Any stock this order was holding is returned to your inventory. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Keep order
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  await deleteOrderAction(orderId);
                })
              }
            >
              Delete order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
