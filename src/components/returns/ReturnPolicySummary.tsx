"use client";

import { ChevronDown, RotateCcw } from "lucide-react";
import Link from "next/link";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  RETURN_POLICY_EXPANDABLE_BULLETS,
  RETURN_POLICY_PATH,
  RETURN_POLICY_SUMMARY,
} from "@/lib/content/returns";
import { cn } from "@/lib/utils";

interface ReturnPolicySummaryProps {
  variant: "inline" | "expandable";
  className?: string;
}

export function ReturnPolicySummary({ variant, className }: ReturnPolicySummaryProps) {
  const summaryAndLink = (
    <>
      <span className="text-muted-foreground">{RETURN_POLICY_SUMMARY}</span>{" "}
      <Link
        href={RETURN_POLICY_PATH}
        className="font-medium text-primary hover:underline inline-flex items-center gap-0.5"
      >
        Full return policy
        <span aria-hidden>→</span>
      </Link>
    </>
  );

  if (variant === "inline") {
    return (
      <p className={cn("text-sm", className)} data-testid="return-policy-inline">
        {summaryAndLink}
      </p>
    );
  }

  return (
    <Collapsible className={cn("mt-6", className)} data-testid="return-policy-expandable">
      <div className="rounded-lg border border-border bg-card p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-primary/10 rounded-lg shrink-0">
            <RotateCcw className="h-4 w-4 text-primary" aria-hidden />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {summaryAndLink}
            </p>
            <CollapsibleTrigger className="mt-2 flex items-center gap-1 text-sm font-medium text-primary hover:underline [&[data-state=open]>svg]:rotate-180">
              <ChevronDown className="h-4 w-4 transition-transform" aria-hidden />
              <span>Details</span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground list-disc list-inside">
                {RETURN_POLICY_EXPANDABLE_BULLETS.map((bullet, i) => (
                  <li key={i}>{bullet}</li>
                ))}
              </ul>
              <p className="mt-2 text-sm">
                <Link
                  href={RETURN_POLICY_PATH}
                  className="font-medium text-primary hover:underline"
                >
                  Full return policy →
                </Link>
              </p>
            </CollapsibleContent>
          </div>
        </div>
      </div>
    </Collapsible>
  );
}
