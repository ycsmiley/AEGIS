import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        default: "bg-white text-black hover:bg-neutral-200 active:bg-neutral-300",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 active:bg-red-800",
        outline:
          "border border-neutral-700 bg-transparent text-white hover:bg-neutral-900 hover:border-neutral-600 active:bg-neutral-800",
        secondary:
          "bg-neutral-800 text-white hover:bg-neutral-700 active:bg-neutral-600",
        ghost: "text-neutral-300 hover:bg-neutral-900 hover:text-white active:bg-neutral-800",
        link: "text-white underline-offset-4 hover:underline hover:text-neutral-300",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-11 rounded-md px-8 text-base",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };

