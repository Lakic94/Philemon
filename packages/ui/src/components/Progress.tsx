import { cx } from "../util.js";

export function Progress({ value, max, className }: { value: number; max: number; className?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const over = max > 0 && value > max;
  return (
    <div className={cx("ph-progress", className)}>
      <div className={cx("ph-progress__fill", over && "ph-progress__fill--over")} style={{ width: `${pct}%` }} />
    </div>
  );
}
