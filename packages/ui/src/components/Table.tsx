import type { HTMLAttributes, TableHTMLAttributes } from "react";
import { cx } from "../util.js";

/** Class for right-aligned monospace numeric/ID cells. */
export const numCell = "ph-num";

export function Table({ className, ...rest }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div style={{ overflowX: "auto" }}>
      <table className={cx("ph-table", className)} {...rest} />
    </div>
  );
}

export function TableWrap({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-panel", className)} {...rest} />;
}
