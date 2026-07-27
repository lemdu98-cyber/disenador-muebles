export default function ProductionSummary({ orderItems, pieces, costs, boards }) {
  const totalFurniture = orderItems.reduce((sum, item) => sum + item.quantity, 0);
  const rows = [
    ["Muebles", totalFurniture], ["Piezas", pieces.length], ["Placas nuevas", costs.newBoardCount], ["Retazos utilizados", boards.filter((board) => board.source === "scrap" && board.pieces.length).length],
    ["Área utilizada", `${(costs.usedArea / 10000).toFixed(2)} m²`], ["Área recuperable", `${(costs.recoverableArea / 10000).toFixed(2)} m²`], ["Desperdicio", `${(costs.wasteArea / 10000).toFixed(2)} m²`],
    ["Aprovechamiento", `${costs.percent(costs.usedArea).toFixed(1)}%`], ["Recuperable", `${costs.percent(costs.recoverableArea).toFixed(1)}%`], ["Desperdicio", `${costs.percent(costs.wasteArea).toFixed(1)}%`],
  ];
  return <section className="summary-card production-summary"><h2>Resumen general</h2>{rows.map(([label, value], index) => <div className="cost-row" key={`${label}-${index}`}><span>{label}</span><b>{value}</b></div>)}</section>;
}
