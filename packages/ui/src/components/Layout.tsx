import type { HTMLAttributes } from "react";
import { cx } from "../util.js";

export function Stack({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-stack", className)} {...rest} />;
}

export function Row({ between, className, ...rest }: HTMLAttributes<HTMLDivElement> & { between?: boolean }) {
  return <div className={cx("ph-row", between && "ph-row--between", className)} {...rest} />;
}
