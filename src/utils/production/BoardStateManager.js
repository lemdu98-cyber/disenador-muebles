export const BOARD_STATES = {
  DRAFT: "draft",
  FIXED: "fixed",
  CONFIRMED: "confirmed",
  CUT: "cut",
};

export const BOARD_STATE_LABELS = {
  [BOARD_STATES.DRAFT]: "Borrador",
  [BOARD_STATES.FIXED]: "Fijada",
  [BOARD_STATES.CONFIRMED]: "Confirmada",
  [BOARD_STATES.CUT]: "Cortada",
};

export const BOARD_STATE_ICONS = {
  [BOARD_STATES.DRAFT]: "🟡",
  [BOARD_STATES.FIXED]: "🟢",
  [BOARD_STATES.CONFIRMED]: "🔴",
  [BOARD_STATES.CUT]: "⚫",
};

export const canAcceptPieces = (board) => board.status === BOARD_STATES.FIXED;

export function setBoardsStatus(results, status) {
  return Object.fromEntries(Object.entries(results).map(([materialId, result]) => [
    materialId,
    {
      ...result,
      boards: result.boards.map((board) => board.status === BOARD_STATES.CUT ? board : ({
        ...board,
        status,
        pieces: board.pieces.map((piece) => ({ ...piece, locked: status !== BOARD_STATES.DRAFT })),
      })),
    },
  ]));
}
