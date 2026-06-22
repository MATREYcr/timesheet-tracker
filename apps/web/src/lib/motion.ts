// Enter animations (tw-animate-css). prefers-reduced-motion neutralizes
// `.animate-in` in app/global.css, so these stay presentation-only.

export const ENTER = 'animate-in fade-in slide-in-from-bottom-2 duration-500';

// fill-mode-backwards holds opacity 0 during the stagger delay, so a row never
// flashes its final state before its turn to animate.
export const ITEM_ENTER =
  'animate-in fade-in slide-in-from-bottom-1 fill-mode-backwards duration-300';

export function staggerDelay(index: number, step = 40, cap = 8) {
  return { animationDelay: `${Math.min(index, cap) * step}ms` };
}
