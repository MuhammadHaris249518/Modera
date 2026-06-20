import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function AppShell({
  children,
  className,
  isDarkMode,
}: {
  children: ReactNode;
  className?: string;
  isDarkMode?: boolean;
}) {
  return (
    <div
      className={cn(
        "min-h-screen bg-canvas p-3 text-ink sm:p-4 lg:p-6",
        isDarkMode === true && "dark",
        isDarkMode === false && "light",
        className
      )}
    >
      <div
        className={cn(
          "relative min-h-[calc(100vh-1.5rem)] overflow-hidden rounded-[18px] bg-canvas text-ink shadow-card-raised sm:min-h-[calc(100vh-3rem)] lg:min-h-[calc(100vh-3rem)]",
        )}
      >
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

export function Surface({
  children,
  className,
  isDarkMode,
}: {
  children: ReactNode;
  className?: string;
  isDarkMode?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-surface text-ink shadow-card-rest",
        isDarkMode === true && "dark",
        isDarkMode === false && "light",
        className
      )}
    >
      {children}
    </div>
  );
}
