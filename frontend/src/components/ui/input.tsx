// Caminho: /frontend/src/components/ui/input.tsx
// Input shadcn com contraste dark (Obsidian Precision).

import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        ref={ref}
        className={cn(
          "flex h-9 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-1 text-sm text-slate-100 shadow-sm transition-colors",
          "placeholder:text-slate-500",
          "focus-visible:outline-none focus-visible:border-indigo-500 focus-visible:ring-1 focus-visible:ring-indigo-500/40",
          "disabled:cursor-not-allowed disabled:opacity-50",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-slate-100",
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";