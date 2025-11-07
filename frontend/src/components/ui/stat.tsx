import * as React from "react";
import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface StatProps extends React.HTMLAttributes<HTMLDivElement> {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  description?: string;
}

const Stat = React.forwardRef<HTMLDivElement, StatProps>(
  ({ className, label, value, icon: Icon, trend, description, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "rounded-lg border border-neutral-800 bg-neutral-900 p-6 transition-all duration-200 hover:border-neutral-700",
          className
        )}
        {...props}
      >
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-neutral-400">{label}</p>
          {Icon && <Icon className="h-4 w-4 text-neutral-500" />}
        </div>

        <div className="mt-3 flex items-baseline gap-2">
          <p className="text-3xl font-bold text-white">{value}</p>
          {trend && (
            <span
              className={cn(
                "text-sm font-medium",
                trend.isPositive ? "text-green-400" : "text-red-400"
              )}
            >
              {trend.isPositive ? "↑" : "↓"} {Math.abs(trend.value)}%
            </span>
          )}
        </div>

        {description && (
          <p className="mt-2 text-xs text-neutral-500">{description}</p>
        )}
      </div>
    );
  }
);
Stat.displayName = "Stat";

export { Stat };
export type { StatProps };
