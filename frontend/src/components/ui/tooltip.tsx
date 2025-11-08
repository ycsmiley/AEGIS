'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

interface TooltipProps {
  children: React.ReactNode;
  content: string;
  className?: string;
}

export function Tooltip({ children, content, className }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  return (
    <div className="relative inline-flex">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div
          className={cn(
            "absolute z-50 px-3 py-2 text-sm text-white bg-neutral-800 rounded-md shadow-lg",
            "border border-neutral-700 min-w-[200px] max-w-md whitespace-normal break-words",
            "bottom-full left-1/2 -translate-x-1/2 mb-2",
            "animate-in fade-in-0 zoom-in-95 duration-100",
            className
          )}
        >
          <div className="relative">
            {content}
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-neutral-800" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
