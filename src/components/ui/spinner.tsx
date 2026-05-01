import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";

type SpinnerSize = "sm" | "md" | "lg";

type SpinnerProps = {
  size?: SpinnerSize;
  className?: string;
  label?: string;
};

const sizeClass: Record<SpinnerSize, string> = {
  sm: "size-3.5",
  md: "size-4",
  lg: "size-6",
};

export function Spinner({ size = "md", className, label = "加载中" }: SpinnerProps) {
  return (
    <Loader2
      className={cn("animate-spin", sizeClass[size], className)}
      role="status"
      aria-label={label}
    />
  );
}
