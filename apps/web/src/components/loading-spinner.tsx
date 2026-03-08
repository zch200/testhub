import { cn } from "../lib/utils";

interface LoadingSpinnerProps {
  label?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function LoadingSpinner({
  label,
  className,
  size = "md"
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-[1.5px]",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-[2.5px]"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-primary/30 border-t-primary",
          sizeClasses[size]
        )}
      />
      {label && (
        <span className="text-sm text-muted-foreground animate-pulse">
          {label}
        </span>
      )}
    </div>
  );
}
