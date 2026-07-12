export const PANEL_CLASS =
  "rounded-lg border border-white/10 bg-[#1b172d] shadow-[0_18px_45px_rgba(4,3,16,0.16)]";
export const PANEL_HEADER_CLASS =
  "flex flex-col gap-4 border-b border-white/10 px-5 py-4 sm:flex-row sm:items-center sm:justify-between";
export const ICON_BUTTON_CLASS =
  "inline-flex h-9 w-9 items-center justify-center rounded-md text-[#817a90] transition hover:bg-white/5 hover:text-white focus:outline-none focus:ring-2 focus:ring-[#526dff] focus:ring-offset-2 focus:ring-offset-[#1b172d] disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-transparent disabled:hover:text-[#817a90]";

export function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}
