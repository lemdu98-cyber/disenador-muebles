import { MELAMINE_BOARD } from "./cutPieces";

export const DEFAULT_SCRAP_SETTINGS = { minWidthCm: 30, minHeightCm: 25 };

export function classifyFreeRects(boards, settings = DEFAULT_SCRAP_SETTINGS) {
  const recoverable = [];
  const waste = [];
  boards.forEach((board) => board.freeRects.forEach((rect, index) => {
    const item = {
      id: `${board.source}-${board.number}-${index}-${Math.round(rect.x)}-${Math.round(rect.y)}`,
      code: `RET-${String(board.number).padStart(3, "0")}-${index + 1}`,
      lengthCm: Number(rect.width.toFixed(1)), widthCm: Number(rect.height.toFixed(1)),
      areaCm2: rect.width * rect.height, boardNumber: board.number, source: board.label,
      material: "Melamina", thicknessMm: MELAMINE_BOARD.thicknessMm,
    };
    if (item.lengthCm >= settings.minWidthCm && item.widthCm >= settings.minHeightCm) recoverable.push(item);
    else waste.push(item);
  }));
  return { recoverable, waste };
}

export function makeBankEntries(scraps) {
  const valuePerCm2 = MELAMINE_BOARD.price / (MELAMINE_BOARD.lengthCm * MELAMINE_BOARD.widthCm);
  return scraps.map((scrap) => ({ ...scrap, value: scrap.areaCm2 * valuePerCm2, date: new Date().toISOString().slice(0, 10), status: "Disponible" }));
}
