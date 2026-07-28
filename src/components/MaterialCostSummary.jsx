const moneyFormatter = new Intl.NumberFormat("es-BO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const numberFormatter = new Intl.NumberFormat("es-BO", { maximumFractionDigits: 2 });
const money = (value) => `${moneyFormatter.format(value)} Bs`;
const area = (value) => `${numberFormatter.format(value / 10000)} m²`;
const percentage = (value) => `${numberFormatter.format(value)} %`;

export default function MaterialCostSummary({ config, costs }) {
  const summary = costs.economic;
  const rows = [
    ["Placas utilizadas", costs.newBoardCount],
    ["Precio por placa", money(config.price)],
    ["Costo total de placas", money(summary.totalCost)],
    ["Área total disponible", area(summary.totalArea)],
    ["Área utilizada", area(summary.usedArea)],
    ["Área sobrante", area(summary.remainingArea)],
    ["Porcentaje utilizado", percentage(summary.usedPercentage)],
    ["Porcentaje sobrante", percentage(summary.remainingPercentage)],
    ["Porcentaje recuperable", percentage(summary.recoverablePercentage)],
    ["Porcentaje desperdicio real", percentage(summary.wastePercentage)],
    [`Valor de ${config.label.toLowerCase()} utilizado`, money(summary.usedValue)],
    [`Valor de ${config.label.toLowerCase()} sobrante`, money(summary.remainingValue)],
    ["Valor del material recuperable", money(summary.recoverableValue)],
    ["Valor del desperdicio real", money(summary.wasteValue)],
  ];

  return <section className="material-cost-block">
    <h3>RESUMEN ECONÓMICO DE {config.label.toUpperCase()}</h3>
    {rows.map(([label, value]) => <div className="cost-row" key={label}><span>{label}</span><b>{value}</b></div>)}
  </section>;
}
