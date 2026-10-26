import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const variants = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-border bg-background hover:bg-foreground/5",
  ghost: "hover:bg-foreground/5",
  link: "h-auto px-0 text-primary underline-offset-4 hover:underline",
} as const;

type ButtonProps = ComponentProps<"button"> & { variant?: keyof typeof variants };

export function Button({ className, variant = "default", type = "button", ...props }: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex h-12 items-center justify-center gap-2 rounded-lg px-5 text-base font-medium transition-colors",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}
