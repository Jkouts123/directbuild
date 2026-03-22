// Shared brand styling constants for all estimator components
// All buttons enforce 48px min-height for mobile thumb-friendliness

export const BTN_NEXT =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-orange-safety px-6 min-h-[48px] text-sm font-bold text-black-deep hover:bg-orange-hover cursor-pointer";

export const BTN_BACK =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-steel/20 px-5 min-h-[48px] text-sm font-semibold text-gray-text hover:text-white cursor-pointer";

export const INPUT =
  "w-full rounded-lg border border-gray-light bg-gray-mid px-4 py-3 text-sm text-white placeholder:text-gray-text focus:border-orange-safety focus:outline-none min-h-[48px]";

export const TILE =
  "flex w-full items-center gap-3 rounded-lg border border-gray-light bg-gray-mid px-4 min-h-[48px] text-left text-sm hover:border-orange-safety/50 cursor-pointer";

export const TILE_SELECTED =
  "flex w-full items-center gap-3 rounded-lg border-2 border-orange-safety bg-orange-safety/10 px-4 min-h-[48px] text-left text-sm cursor-pointer";

export const CHECKBOX_LABEL =
  "flex items-center gap-3 rounded-lg border border-gray-light bg-gray-mid px-4 min-h-[48px] cursor-pointer hover:border-orange-safety/50";

export const UPLOAD_BTN =
  "flex items-center justify-center gap-3 rounded-lg border-2 border-dashed border-orange-safety/40 bg-orange-safety/5 px-6 min-h-[72px] text-base font-semibold text-orange-safety hover:border-orange-safety hover:bg-orange-safety/10 cursor-pointer w-full";

export const UPLOAD_BTN_LARGE =
  "flex items-center justify-center gap-3 rounded-xl border-2 border-dashed border-orange-safety/50 bg-orange-safety/5 px-6 min-h-[96px] text-lg font-bold text-orange-safety hover:border-orange-safety hover:bg-orange-safety/10 cursor-pointer w-full";
