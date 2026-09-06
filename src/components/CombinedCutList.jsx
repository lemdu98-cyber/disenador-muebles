import { MATERIAL_ORDER } from "../utils/materialConfig";
import { calculateTotalEdgeBanding, edgeBandingKey, edgeBandingSummary, EDGE_BANDING_WASTE_PERCENT } from "../utils/edgeBanding";

function MaterialCutList({ config, pieces }) {
  const consolidated = Object.values(pieces.reduce((result, piece) => {
    const key = `${piece.name}|${piece.length}|${piece.width}|${piece.grainRequired}|${edgeBandingKey(piece.edgeBanding)}`;
    (result[key] ||= { ...piece, quantity: 0 });
    result[key].quantity += 1;
    return result;
  }, {})).sort((a, b) => b.areaCm2 - a.areaCm2);

  return <section className="summary-card material-cut-list">
    <p className="eyebrow">LISTA DE CORTE</p>
    <h2>{config.label}</h2>
    {consolidated.length ? consolidated.map((item) => <div className="cut-piece-row" key={`${item.name}-${item.length}-${item.width}`}>
      <div className="cut-row"><span>{item.name}</span><b>{item.quantity} · {item.length.toFixed(1)} × {item.width.toFixed(1)} cm</b></div>
      {item.grainRequired && <div className="cut-piece-details"><span>Veta obligatoria</span></div>}
      {item.material.id === "melamine" && edgeBandingSummary(item.edgeBanding).length > 0 && <div className="cut-piece-details"><span>Canto: {edgeBandingSummary(item.edgeBanding).join(", ")}</span></div>}
      {item.mounting && <div className="cut-piece-details">
        <span>{item.material.thicknessMm} mm</span>
        <span>{item.location}</span>
        <span>{item.installation}</span>
      </div>}
    </div>) : <p className="empty-state">No hay piezas de {config.label.toLowerCase()}.</p>}
  </section>;
}

export default function CombinedCutList({ pieces, configs }) {
  const exact = calculateTotalEdgeBanding(pieces);
  const margin = exact * EDGE_BANDING_WASTE_PERCENT / 100;
  return <><section className="summary-card edge-total"><h2>Canto total de producción</h2><div><span>Exacto</span><b>{exact.toFixed(2)} m</b></div><div><span>Margen recomendado (+{EDGE_BANDING_WASTE_PERCENT} %)</span><b>{margin.toFixed(2)} m</b></div><div><span>Comprar aprox.</span><b>{(exact + margin).toFixed(2)} m</b></div></section><div className="production-lists">
    {MATERIAL_ORDER.map((id) => <MaterialCutList key={id} config={configs[id]} pieces={pieces.filter((piece) => piece.material.id === id)} />)}
  </div></>;
}
