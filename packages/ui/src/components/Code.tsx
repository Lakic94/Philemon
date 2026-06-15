import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../util.js";

export function CodeBlock({ className, ...rest }: HTMLAttributes<HTMLPreElement>) {
  return <pre className={cx("ph-code-block", className)} {...rest} />;
}

export function InlineCode({ children, className }: { children: ReactNode; className?: string }) {
  return <code className={cx("ph-code-inline", className)}>{children}</code>;
}
