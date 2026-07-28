import { DEFAULT_MATERIAL_CONFIG } from "./materialConfig";

export const DEFAULT_SCRAP_SETTINGS = { minWidthCm: 30, minHeightCm: 25 };

export function classifyFreeRects(boards, settings = DEFAULT_SCRAP_SETTINGS, materialConfig = DEFAULT_MATERIAL_CONFIG.melamine) {
  const recoverable = [];
  const waste = [];
  boards.forEach((board) => {
    board.freeRects.forEach((rect, index) => {
      const item = {
        id: `${materialConfig.id}-${board.source}-${board.number}-${index}-${Math.round(rect.x)}-${Math.round(rect.y)}`,
        code: `${materialConfig.id === "melamine" ? "MEL" : "CAR"}-${String(board.number).padStart(3, "0")}-${index + 1}`,
        lengthCm: Number(rect.width.toFixed(1)),
        widthCm: Number(rect.height.toFixed(1)),
        areaCm2: rect.width * rect.height,
        boardNumber: board.number,
        boardSource: board.source,
        source: board.label,
        material: materialConfig.label,
        materialId: materialConfig.id,
        thicknessMm: materialConfig.thicknessMm,
      };
      if (item.lengthCm >= settings.minWidthCm && item.widthCm >= settings.minHeightCm) recoverable.push(item);
      else waste.push(item);
    });
    const boardArea = board.lengthCm * board.widthCm;
    const pieceArea = board.pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
    const freeRectArea = board.freeRects.reduce((sum, rect) => sum + rect.width * rect.height, 0);
    const processWasteArea = Math.max(0, boardArea - pieceArea - freeRectArea);
    if (processWasteArea > .001) {
      waste.push({
        id: `${materialConfig.id}-${board.source}-${board.number}-process-waste`,
        code: `CORTE-${String(board.number).padStart(3, "0")}`,
        lengthCm: 0,
        widthCm: 0,
        areaCm2: processWasteArea,
        boardNumber: board.number,
        boardSource: board.source,
        source: board.label,
        material: materialConfig.label,
        materialId: materialConfig.id,
        thicknessMm: materialConfig.thicknessMm,
        reason: "Márgenes y espesor de corte",
      });
    }
  });
  return { recoverable, waste };
}

export function makeBankEntries(scraps, materialConfig = DEFAULT_MATERIAL_CONFIG.melamine) {
  const valuePerCm2 = materialConfig.price / (materialConfig.lengthCm * materialConfig.widthCm);
  return scraps.map((scrap) => ({ ...scrap, value: scrap.areaCm2 * valuePerCm2, date: new Date().toISOString().slice(0, 10), status: "Disponible" }));
}
