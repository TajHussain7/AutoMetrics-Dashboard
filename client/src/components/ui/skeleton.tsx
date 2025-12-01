import * as React from "react";

export const Skeleton = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      aria-hidden
      className={"animate-pulse bg-slate-100 rounded " + className}
      {...props}
    >
      {children}
    </div>
  );
});
Skeleton.displayName = "Skeleton";
