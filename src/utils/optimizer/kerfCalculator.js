export const kerfCm = (settings) => Math.max(0, Number(settings.kerfMm) || 0) / 10;

export function getUsableBoardRect(lengthCm, widthCm, margins) {
  return {
    x: margins.left,
    y: margins.top,
    width: Math.max(0, lengthCm - margins.left - margins.right),
    height: Math.max(0, widthCm - margins.top - margins.bottom),
  };
}

export function splitFreeRect(free, placement, kerf) {
  const remainingWidth = free.width - placement.length;
  const remainingHeight = free.height - placement.width;
  const right = {
    x: free.x + placement.length + (remainingWidth > 0 ? kerf : 0),
    y: free.y,
    width: Math.max(0, remainingWidth - kerf),
    height: placement.width,
  };
  const bottom = {
    x: free.x,
    y: free.y + placement.width + (remainingHeight > 0 ? kerf : 0),
    width: free.width,
    height: Math.max(0, remainingHeight - kerf),
  };
  return [right, bottom].filter((rect) => rect.width > .001 && rect.height > .001);
}
