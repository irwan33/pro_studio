import { InputHTMLAttributes } from "react";
import { clsx } from "clsx";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={clsx("h-11 w-full rounded-2xl border border-studio-border bg-studio-input px-3 text-sm text-studio-text outline-none placeholder:text-studio-muted shadow-inner focus:border-studio-accent", className)} {...props} />;
}
