import type { ButtonHTMLAttributes } from "react";
import { cx } from "../util.js";

type Variant = "primary" | "ghost" | "outline" | "danger";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md";
}

export function Button({ variant = "ghost", size = "md", className, ...rest }: ButtonProps) {
  return (
    <button
      className={cx("ph-btn", `ph-btn--${variant}`, size === "sm" && "ph-btn--sm", className)}
      {...rest}
    />
  );
}
