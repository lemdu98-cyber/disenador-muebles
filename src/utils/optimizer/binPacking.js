export const binPackingStrategies = [
  {
    id: "firstFit",
    label: "First Fit Decreasing",
    score: ({ boardIndex, freeIndex, orientation }) => [boardIndex, freeIndex, orientation.rotated ? 1 : 0],
  },
  {
    id: "bestFit",
    label: "Best Fit Decreasing",
    score: ({ waste, shortSide, boardIndex }) => [waste, shortSide, boardIndex],
  },
  {
    id: "binPacking",
    label: "Bin Packing",
    score: ({ boardWaste, waste, shortSide }) => [boardWaste, waste, shortSide],
  },
  {
    id: "shelf",
    label: "Shelf Packing",
    score: ({ free, waste }) => [free.y, free.x, waste],
  },
];
