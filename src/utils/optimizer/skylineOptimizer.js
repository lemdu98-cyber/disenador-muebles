export const skylineStrategy = {
  id: "skyline",
  label: "Skyline",
  score: ({ free, orientation, waste }) => [free.y + orientation.width, free.x, waste],
};
