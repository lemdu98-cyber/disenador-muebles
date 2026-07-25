import { MELAMINE_BOARD } from "../utils/cutPieces";

export default function MaterialCalculator({ pieces, boards, unplaced }) {
  const boardArea = MELAMINE_BOARD.lengthCm * MELAMINE_BOARD.widthCm;
  const usedArea = pieces.reduce((sum, piece) => sum + piece.areaCm2, 0);
  const purchasedArea = boards.length * boardArea;
  const remainingArea = Math.max(0, purchasedArea - usedArea);
  const wastePercent = purchasedArea ? (remainingArea / purchasedArea) * 100 : 0;
  const cost = boards.length * MELAMINE_BOARD.price;
  const usedMelamineCost = purchasedArea ? (usedArea / purchasedArea) * cost : 0;
  // Calculate the remainder from the total so both monetary values always reconcile.
  const remainingMelamineValue = cost - usedMelamineCost;
  return <section className="summary-card material-card"><h2>Placa de melamina</h2>
    <div className="material-specs"><span>Medida</span><b>275 × 185 cm</b><span>Espesor</span><b>15 mm</b><span>Precio</span><b>605 Bs</b></div>
    <div className="cost-row"><span>Área de la placa</span><b>{(boardArea / 10000).toFixed(4)} m²</b></div>
    <div className="cost-row"><span>Área utilizada</span><b>{(usedArea / 10000).toFixed(2)} m²</b></div>
    <div className="cost-row"><span>Área sobrante</span><b>{(remainingArea / 10000).toFixed(2)} m²</b></div>
    <div className="cost-row"><span>Desperdicio</span><b>{wastePercent.toFixed(1)}%</b></div>
    <div className="cost-row"><span>Placas necesarias</span><b>{boards.length}</b></div>
    <div className="cost-total"><span>Costo total melamina</span><b>{cost.toFixed(2)} Bs</b></div>
    <div className="cost-row material-value"><span>Costo de melamina utilizada en el mueble</span><b>{usedMelamineCost.toFixed(2)} Bs</b></div>
    <div className="cost-row material-value"><span>Valor de melamina sobrante reutilizable</span><b>{remainingMelamineValue.toFixed(2)} Bs</b></div>
    {unplaced.length > 0 && <p className="optimizer-warning">{unplaced.length} pieza(s) exceden el tamaño de la placa y no se pudieron acomodar.</p>}
  </section>;
}
