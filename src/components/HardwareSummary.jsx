export default function HardwareSummary({ items }) {
  if (!items.length) return null;
  return <section className="summary-card hardware-summary">
    <h2>Herrajes</h2>
    {items.map((item) => <div className="cost-row" key={`${item.furnitureType || "design"}-${item.id}`}>
      <span>{item.name}</span>
      <b>{item.pairs} pares / {item.units} unidades</b>
    </div>)}
  </section>;
}
