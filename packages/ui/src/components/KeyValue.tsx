import type { ReactNode } from "react";
import { cx } from "../util.js";

export interface KVRow {
  k: ReactNode;
  v: ReactNode;
}

export function KeyValue({ rows, className }: { rows: KVRow[]; className?: string }) {
  return (
    <div className={cx("ph-kv", className)}>
      {rows.map((r, i) => (
        <div key={i} style={{ display: "contents" }}>
          <span className="ph-kv__k">{r.k}</span>
          <span className="ph-kv__v">{r.v}</span>
        </div>
      ))}
    </div>
  );
}
