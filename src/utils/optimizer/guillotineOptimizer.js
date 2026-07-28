export const guillotineStrategy = {
  id: "guillotine",
  label: "Guillotine Cutting",
  score: ({ waste, shortSide, free, orientation }) => [waste, shortSide, free.y, free.x, orientation.rotated ? 1 : 0],
};
