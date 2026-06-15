import type { InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ReactNode } from "react";
import { cx } from "../util.js";

export function Field({ label, children }: { label?: ReactNode; children: ReactNode }) {
  return (
    <label className="ph-field">
      {label && <span className="ph-label">{label}</span>}
      {children}
    </label>
  );
}

export function Input({ className, mono, ...rest }: InputHTMLAttributes<HTMLInputElement> & { mono?: boolean }) {
  return <input className={cx("ph-input", mono && "ph-input--mono", className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx("ph-textarea", className)} {...rest} />;
}

export function Select({ className, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx("ph-select", className)} {...rest} />;
}
