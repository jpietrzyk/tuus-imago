import { cn } from "@/lib/utils";

type LoadingSpinnerProps = {
  className?: string;
  fullPage?: boolean;
};

export function LoadingSpinner({ className, fullPage }: LoadingSpinnerProps) {
  const spinner = (
    <div
      className={cn(
        "animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full",
        className,
      )}
    />
  );

  if (fullPage) {
    return (
      <div className="flex items-center justify-center h-64">{spinner}</div>
    );
  }

  return spinner;
}
