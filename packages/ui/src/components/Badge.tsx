import type { ReactNode } from "react";
import { cx } from "../util.js";
import type { ItemStatus } from "@philemon/types";

export function Badge({
  children,
  variant,
  dot,
  className,
}: {
  children: ReactNode;
  variant?: "needed" | "ordered" | "bought" | "accent";
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={cx("ph-badge", variant && `ph-badge--${variant}`, className)}>
      {dot && <span className="ph-badge__dot" />}
      {children}
    </span>
  );
}

const STATUS_LABEL: Record<ItemStatus, string> = {
  needed: "Needed",
  ordered: "Ordered",
  bought: "Bought",
};

export function StatusBadge({ status }: { status: ItemStatus }) {
  return (
    <Badge variant={status} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
