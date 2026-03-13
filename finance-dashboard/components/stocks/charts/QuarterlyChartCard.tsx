"use client";

import type { ReactNode } from "react";

interface QuarterlyChartCardProps {
  title: string;
  description: string;
  emptyMessage: string;
  hasData: boolean;
  children: ReactNode;
}

export function QuarterlyChartCard({
  title,
  description,
  emptyMessage,
  hasData,
  children,
}: QuarterlyChartCardProps) {
  return (
    <div className="rounded-2xl border border-slate-700/80 bg-slate-950/40 p-4">
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>

      {hasData ? (
        <div className="mt-4 h-[340px]">{children}</div>
      ) : (
        <p className="mt-4 text-sm font-medium text-slate-300">{emptyMessage}</p>
      )}
    </div>
  );
}
