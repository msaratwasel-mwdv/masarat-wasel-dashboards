import React from "react";

interface SidebarTooltipProps {
  label: string;
  isRTL?: boolean;
}

/**
 * Modern speech-bubble tooltip for collapsed sidebar items (Laravel 13 style)
 * Features a crisp white container, subtle shadow, and directional caret pointer.
 */
export default function SidebarTooltip({ label, isRTL = false }: SidebarTooltipProps) {
  return (
    <div
      role="tooltip"
      className={`
        pointer-events-none absolute top-1/2 -translate-y-1/2 z-[9999]
        opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100
        transition-all duration-150 ease-out whitespace-nowrap
        ${isRTL ? "right-full mr-3" : "left-full ml-3"}
      `}
    >
      <div className="relative flex items-center bg-white text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-xl shadow-xl border border-slate-100/90 dark:border-slate-200 select-none">
        {/* Directional Caret / Arrow pointing towards the sidebar icon */}
        <div
          className={`
            absolute top-1/2 -translate-y-1/2 w-2 h-2 rotate-45 bg-white
            ${isRTL ? "-right-1 border-r border-t border-slate-100/90" : "-left-1 border-l border-b border-slate-100/90"}
          `}
        />
        <span className="relative z-10 leading-tight">{label}</span>
      </div>
    </div>
  );
}
