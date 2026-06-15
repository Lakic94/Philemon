import type { HTMLAttributes, ReactNode } from "react";
import { cx } from "../util.js";

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-card", className)} {...rest} />;
}

export function Panel({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-panel", className)} {...rest} />;
}

export function PanelHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-panel__header", className)} {...rest} />;
}

export function PanelBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx("ph-panel__body", className)} {...rest} />;
}

export function Kicker({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("ph-kicker", className)}>{children}</div>;
}
