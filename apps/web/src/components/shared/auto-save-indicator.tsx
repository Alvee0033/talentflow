"use client";

import React from "react";
import { Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface AutoSaveIndicatorProps {
  isSaving: boolean;
  lastSavedAt?: Date | null;
  className?: string;
}

export function AutoSaveIndicator({
  isSaving,
  lastSavedAt,
  className,
}: AutoSaveIndicatorProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-opacity",
        className
      )}
      aria-live="polite"
    >
      {isSaving ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
          <span className="font-medium text-primary">Saving changes...</span>
        </>
      ) : lastSavedAt ? (
        <>
          <Check className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          <span className="text-emerald-700 dark:text-emerald-400">
            All changes saved at{" "}
            {lastSavedAt.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </>
      ) : (
        <span>Draft auto-saves automatically</span>
      )}
    </div>
  );
}