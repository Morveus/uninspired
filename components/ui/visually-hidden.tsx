import { cn } from "@/lib/utils"

type VisuallyHiddenProps = React.HTMLAttributes<HTMLSpanElement>

export function VisuallyHidden({ className, ...props }: VisuallyHiddenProps) {
  return (
    <span
      className={cn(
        "absolute h-px w-px p-0 -m-px overflow-hidden whitespace-nowrap border-0",
        className
      )}
      {...props}
    />
  )
} 