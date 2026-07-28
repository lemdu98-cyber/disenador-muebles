export const maxRectsStrategy = {
  id: "maxRects",
  label: "MaxRects",
  score: ({ shortSide, longSide, waste, free }) => [shortSide, longSide, waste, free.y, free.x],
};
