import type { BookingStatus } from "@prisma/client";
import { statusMeta } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function StatusBadge({ status }: { status: BookingStatus }) {
  const meta = statusMeta[status];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ring-1 ring-inset",
        meta.className,
      )}
    >
      {meta.label}
    </span>
  );
}
