import { Badge } from "@/components/ui/badge";
import { REQUEST_STATUS_ADMIN_LABELS, type RequestStatus } from "@/lib/website-request";

const VARIANT: Record<RequestStatus, "info" | "warning" | "soft" | "success" | "muted"> = {
  new: "info",
  contacted: "warning",
  building: "soft",
  done: "success",
  cancelled: "muted",
};

/** A website request's status, coloured the same on every admin screen. */
export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <Badge variant={VARIANT[status] ?? "muted"}>{REQUEST_STATUS_ADMIN_LABELS[status] ?? status}</Badge>;
}
