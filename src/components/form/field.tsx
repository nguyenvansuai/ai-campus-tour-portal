import type { ComponentProps } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const selectClass = "h-12 w-full rounded-lg border border-border bg-background px-3 text-base";

export function TextField({ label, id, ...props }: ComponentProps<"input"> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...props} />
    </div>
  );
}

export function SelectField({ label, id, className, children, ...props }: ComponentProps<"select"> & { label: string; id: string }) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <select id={id} className={cn(selectClass, className)} {...props}>
        {children}
      </select>
    </div>
  );
}

export function CheckboxField({ label, id, ...props }: ComponentProps<"input"> & { label: string; id: string }) {
  return (
    <label htmlFor={id} className="flex items-start gap-3 text-base">
      <input id={id} type="checkbox" className="mt-1 size-5 shrink-0" {...props} />
      <span>{label}</span>
    </label>
  );
}
