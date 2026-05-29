/**
 * ─────────────────────────────────────────────────────────────────
 *  DS.ts — Masarat Wasel School Dashboard | Design System Tokens
 *  Color Palette: Navy (#0f2044) · Gold (#f5b800) · White
 *  Supports: Light Mode & Dark Mode
 * ─────────────────────────────────────────────────────────────────
 */

// ── Static Tokens & Responsive Utilities ──────────────────────────
export const DS_pageWrapper = "px-4 md:px-0 pb-12 space-y-5 md:space-y-8";
export const DS_card = "bg-white dark:bg-[#1a2845] rounded-[18px] md:rounded-[28px] shadow-sm border border-gray-100 dark:border-[#243460] overflow-hidden transition-all duration-300";
export const DS_pageTitle = "font-black text-lg md:text-2xl text-[#0f2044] dark:text-white tracking-tight";
export const DS_statLabel = "text-[9px] md:text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500";
export const DS_statValue = "text-lg md:text-2xl font-black text-[#0f2044] dark:text-white mt-0.5";
export const DS_avatar = "w-8 h-8 md:w-10 md:h-10 rounded-full bg-[#0f2044]/10 dark:bg-[#0f2044]/40 text-[#0f2044] dark:text-[#7ba7e8] flex items-center justify-center font-bold text-xs md:text-sm overflow-hidden flex-shrink-0";
export const DS_tableWrapper = "overflow-x-auto scrollbar-hide -mx-4 md:mx-0 pb-20"; // Negative margin on mobile for edge-to-edge feel
export const DS_tableBase = "w-full text-sm min-w-full";
export const DS_tableHead = "bg-[#0f2044]/[0.03] dark:bg-[#0f2044]/40 border-b border-gray-100 dark:border-[#243460]";
export const DS_tableRow = "hover:bg-[#0f2044]/[0.02] dark:hover:bg-[#0f2044]/20 transition-colors border-b border-gray-50 dark:border-[#243460] last:border-0";
export const DS_tableTd = "px-2 py-3 text-gray-800 dark:text-white align-middle text-xs sm:text-sm";
export const DS_divider = "border-b border-gray-100 dark:border-[#243460]";

// Responsive Layout Helpers
export const DS_grid12 = "grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-8";
export const DS_gridCols = "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6";
export const DS_flexResponsive = "flex flex-col md:flex-row items-center justify-between gap-4";
export const DS_hideOnMobile = "hidden md:block";
export const DS_showOnlyOnMobile = "block md:hidden";

// ── Bus Assignment Specific Tokens ────────────────────────────────
export const DS_panelHeader = "px-5 py-4 bg-[#0f2044] flex items-center gap-3";
export const DS_tripTabGroup = "flex rounded-[14px] bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 p-1";

export const DS_searchInput = "w-full rounded-[14px] px-4 py-2 text-sm bg-[#0f2044]/5 dark:bg-[#0f2044]/30 border border-[#0f2044]/10 dark:border-[#243460] text-gray-800 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#f5b800] transition-all";

export const DS_btnGold = "flex items-center gap-2 px-5 py-2 rounded-[14px] bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044] text-sm font-bold shadow transition-all";
export const DS_btnSuccess = "flex items-center gap-2 px-5 py-2 rounded-[14px] bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044] text-sm font-bold shadow transition-all";
export const DS_btnPrimary = "flex items-center gap-2 px-5 py-2 rounded-[14px] bg-[#0f2044] hover:bg-[#162d60] text-white text-sm font-bold shadow transition-all";
export const DS_btnSecondary = "flex items-center gap-2 px-4 py-2 rounded-[14px] bg-[#0f2044]/[0.08] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-gray-300 text-sm font-bold hover:bg-[#0f2044]/[0.15] dark:hover:bg-[#0f2044]/50 transition-all border border-[#0f2044]/10 dark:border-[#243460]";
export const DS_btnEdit = "px-3 py-1.5 rounded-[10px] bg-[#0f2044]/[0.06] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8] text-xs font-bold hover:bg-[#0f2044]/[0.12] dark:hover:bg-[#0f2044]/50 transition-all";
export const DS_btnDanger = "px-3 py-1.5 rounded-[10px] bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-xs font-bold hover:bg-red-100 dark:hover:bg-red-900/30 transition-all";

export const DS_modalContainer = "w-full overflow-hidden flex flex-col max-h-[85vh]";
export const DS_modalHeaderTitle = "text-lg font-bold text-white";
export const DS_modalTitle = "text-xl font-black text-slate-800 dark:text-white";
export const DS_modalHeaderAccent = "w-2 h-6 bg-[#f5b800] rounded-full flex-shrink-0";
export const DS_modalClose = "p-1.5 rounded-[10px] bg-white/10 text-white hover:bg-white/20 transition-all";
export const DS_modalBody = "p-4 md:p-5 space-y-3 md:space-y-4 overflow-y-auto flex-1 min-h-0";

export const DS_inputCls = "w-full rounded-[14px] px-4 py-2 text-sm bg-[#0f2044]/[0.05] dark:bg-[#0f2044]/30 border border-[#0f2044]/[0.10] dark:border-[#243460] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f5b800] transition-all placeholder-gray-400";
export const DS_selectCls = "w-full rounded-[14px] px-8 py-2 text-sm bg-[#0f2044]/[0.05] dark:bg-[#0f2044]/30 border border-[#0f2044]/[0.10] dark:border-[#243460] text-gray-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#f5b800] transition-all placeholder-gray-400 cursor-pointer";
export const DS_labelCls = "block text-[10px] font-bold uppercase tracking-wider mb-1.5 text-[#0f2044]/60 dark:text-[#7ba7e8]/70";
export const DS_input = DS_inputCls;
export const DS_select = DS_selectCls;
export const DS_label = DS_labelCls;
export const DS_cancelBtn = "px-5 py-2.5 rounded-[14px] bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-gray-300 text-sm font-bold hover:bg-[#0f2044]/[0.14] transition-all";

export const DS_childAvatar = "w-10 h-10 rounded-full bg-[#f5b800]/20 text-[#8a6b00] dark:text-[#f5b800] flex items-center justify-center font-bold overflow-hidden flex-shrink-0";
export const DS_confirmModal = "bg-white dark:bg-[#1a2845] p-8 rounded-[22px] w-full max-w-sm shadow-2xl text-center";

// ── Dynamic Tokens (Functions) ────────────────────────────────────
export function DS_statCard(accent: "navy" | "gold" | "red" | "green" | "blue"): string {
  const base = "flex items-center gap-3 p-3 md:p-5 rounded-[14px] md:rounded-[22px] border shadow-sm transition-all hover:scale-[1.02]";
  if (accent === "gold")  return `${base} bg-white dark:bg-[#1a2845] border-[#f5b800]/20 dark:border-[#f5b800]/10`;
  if (accent === "red")   return `${base} bg-white dark:bg-[#1a2845] border-red-100 dark:border-red-900/20`;
  if (accent === "green") return `${base} bg-white dark:bg-[#1a2845] border-emerald-100 dark:border-emerald-900/20`;
  if (accent === "blue")  return `${base} bg-white dark:bg-[#1a2845] border-sky-100 dark:border-sky-900/20`;
  return `${base} bg-white dark:bg-[#1a2845] border-[#0f2044]/10 dark:border-[#243460]`;
}

export function DS_statIcon(accent: "navy" | "gold" | "red" | "green" | "blue"): string {
  const base = "w-10 h-10 rounded-[12px] flex items-center justify-center flex-shrink-0";
  if (accent === "gold")  return `${base} bg-[#f5b800]/10 dark:bg-[#f5b800]/20 text-[#b38600]`;
  if (accent === "red")   return `${base} bg-red-50 dark:bg-red-900/20 text-red-500`;
  if (accent === "green") return `${base} bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600`;
  if (accent === "blue")  return `${base} bg-sky-50 dark:bg-sky-900/20 text-sky-600`;
  return `${base} bg-[#0f2044]/10 dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-[#7ba7e8]`;
}

export function DS_badge(variant: boolean | "green" | "red" | "navy" | "gold" | "rose"): string {
  const base = "px-2 md:px-3 py-0.5 md:py-1 rounded-full text-[8px] md:text-[10px] font-bold uppercase tracking-widest";
  if (variant === true || variant === "green") return `${base} bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400`;
  if (variant === false || variant === "red" || variant === "rose") return `${base} bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400`;
  if (variant === "navy") return `${base} bg-brand-navy/10 text-brand-navy dark:bg-brand-navy/30 dark:text-brand-navy-light`;
  if (variant === "gold") return `${base} bg-brand-gold/10 text-[#b38600] dark:bg-brand-gold/20 dark:text-brand-gold`;
  return `${base} bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400`;
}

export function DS_filterBtn(active: boolean): string {
  return active
    ? "px-4 py-2 rounded-[12px] text-xs font-bold bg-[#0f2044] text-[#f5b800] shadow transition-all"
    : "px-4 py-2 rounded-[12px] text-xs font-bold bg-[#0f2044]/[0.07] dark:bg-[#0f2044]/30 text-[#0f2044] dark:text-gray-300 hover:bg-[#0f2044]/[0.14] dark:hover:bg-[#0f2044]/50 transition-all";
}

export function DS_tableTh(isRtl: boolean): string {
  return `px-2 py-2.5 text-[11px] sm:text-xs font-bold uppercase tracking-wider text-[#0f2044]/60 dark:text-[#7ba7e8]/70 ${isRtl ? "text-right" : "text-left"}`;
}

export function DS_modalHeader(isRtl: boolean): string {
  return `px-5 py-3 bg-[#0f2044] flex items-center justify-between rounded-t-[22px]`;
}

export function DS_modalFooter(isRtl: boolean): string {
  return `px-5 py-3 bg-gray-50/50 dark:bg-[#0f2044]/20 border-t border-gray-100 dark:border-[#243460] flex items-center justify-end gap-3 rounded-b-[22px]`;
}

export function DS_sectionHeader(isRTL: boolean): string {
  return `p-4 md:p-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 md:gap-8 border-b border-gray-100 dark:border-[#243460]`;
}

export function DS_childItem(isRtl: boolean): string {
  return `flex items-center gap-3 p-3 rounded-[14px] bg-[#0f2044]/[0.05] dark:bg-[#0f2044]/20`;
}

export function DS_submitBtn(processing: boolean): string {
  return `w-full md:w-auto px-6 py-3 md:py-2.5 rounded-[14px] md:rounded-[16px] bg-[#f5b800] hover:bg-[#e0a900] text-[#0f2044] text-sm font-black shadow-lg transition-all active:scale-95 ${processing ? "opacity-50 cursor-not-allowed" : ""}`;
}

export function DS_tripTab(active: boolean, variant: "morning" | "afternoon"): string {
  const base = "px-4 py-1.5 rounded-[10px] text-xs font-bold transition-all flex items-center gap-1.5";
  if (!active) return `${base} text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white`;
  if (variant === "morning") return `${base} bg-[#0f2044] text-[#f5b800] shadow-sm`;
  return `${base} bg-[#f5b800] text-[#0f2044] shadow-sm`;
}

export function DS_statValue2(accent: "navy" | "gold" | "red" | "green" | "blue"): string {
  if (accent === "gold")  return "text-xl font-black text-[#b38600] dark:text-[#f5b800] mt-0.5";
  if (accent === "red")   return "text-xl font-black text-red-600 dark:text-red-400 mt-0.5";
  if (accent === "green") return "text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5";
  if (accent === "blue")  return "text-xl font-black text-sky-600 dark:text-sky-400 mt-0.5";
  return "text-xl font-black text-[#0f2044] dark:text-white mt-0.5";
}
