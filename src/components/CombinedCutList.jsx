import { MATERIAL_ORDER } from "../utils/materialConfig";

function MaterialCutList({ config, pieces }) {
  const consolidated = Object.values(pieces.reduce((result, piece) => {
    const key = `${piece.name}|${piece.length}|${piece.width}`;
    (result[key] ||= { ...piece, quantity: 0 });
    result[key].quantity += 1;
    return result;
  }, {})).sort((a, b) => b.areaCm2 - a.areaCm2);

  return <section className="summary-card material-cut-list">
    <p className="eyebrow">LISTA DE CORTE</p>
    <h2>{config.label}</h2>
    {consolidated.length ? consolidated.map((item) => <div className="cut-piece-row" key={`${item.name}-${item.length}-${item.width}`}>
      <div className="cut-row"><span>{item.name}</span><b>{item.quantity} · {item.length.toFixed(1)} × {item.width.toFixed(1)} cm</b></div>
      {item.mounting && <div className="cut-piece-details">
        <span>{item.material.thicknessMm} mm</span>
        <span>{item.location}</span>
        <span>{item.installation}</span>
      </div>}
    </div>) : <p className="empty-state">No hay piezas de {config.label.toLowerCase()}.</p>}
  </section>;
}

export default function CombinedCutList({ pieces, configs }) {
  return <div className="production-lists">
    {MATERIAL_ORDER.map((id) => <MaterialCutList key={id} config={configs[id]} pieces={pieces.filter((piece) => piece.material.id === id)} />)}
  </div>;
}
