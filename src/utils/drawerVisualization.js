/** Visual-only travel shared by furniture with telescopic drawers. */
export function calculateDrawerOpenOffsetCm(drawerDepthCm, showOpenDrawers) {
  if (!showOpenDrawers) return 0;
  return Math.min(Math.max(0, Number(drawerDepthCm) || 0) * 0.55, 22);
}
