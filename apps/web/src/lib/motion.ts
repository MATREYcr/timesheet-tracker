export const ENTER = 'animate-in fade-in slide-in-from-bottom-2 duration-500';

export const ITEM_ENTER =
  'animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards duration-300';

export function staggerDelay(index: number, step = 40, cap = 8) {
  return { animationDelay: `${Math.min(index, cap) * step}ms` };
}
