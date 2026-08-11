import { ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "outline" | "ghost" | "danger"; size?: "sm" | "md" | "icon" };

export function Button({ className, variant = "outline", size = "md", ...props }: Props) {
  return (
    <button
      className={clsx(
        "inline-flex items-center justify-center gap-2 rounded-2xl border font-semibold shadow-sm transition disabled:cursor-not-allowed disabled:opacity-50",
        size === "sm" && "h-8 px-3 text-xs",
        size === "md" && "h-11 px-4 text-sm",
        size === "icon" && "h-10 w-10 p-0",
        variant === "primary" && "border-studio-accent bg-studio-accent text-white hover:bg-[#333333]",
        variant === "outline" && "border-studio-border bg-studio-elevated text-studio-text hover:bg-studio-accentHover",
        variant === "ghost" && "border-transparent bg-transparent text-studio-secondaryText shadow-none hover:bg-studio-elevated hover:text-studio-accent",
        variant === "danger" && "border-red-200 bg-red-50 text-red-600",
        className
      )}
      {...props}
    />
  );
}
