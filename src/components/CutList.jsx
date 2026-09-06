import { useMemo, useState } from "react";
import { getCutPieces, getFurnitureLabel } from "../utils/cutPieces";
import { MATERIAL_ORDER } from "../utils/materialConfig";
import { calculateTotalEdgeBanding, edgeBandingKey, edgeBandingSummary, EDGE_BANDING_SIDES, EDGE_BANDING_WASTE_PERCENT } from "../utils/edgeBanding";

const SIDE_LABELS = { top: "superior", right: "derecho", bottom: "inferior", left: "izquierdo" };

function EdgeEditor({ group, onChange }) {
  const piece = group[0];
  const setAll = (enabled) => onChange(group.map((item) => item.id), Object.fromEntries(EDGE_BANDING_SIDES.map((side) => [side, enabled])));
  return <div className="edge-editor-panel"><h3>{piece.name}</h3><p>{piece.length} × {piece.width} cm · Cantidad: {group.length}</p>
    <div className="edge-editor" aria-label={`Canteado de ${piece.name}`}>
      {EDGE_BANDING_SIDES.map((side) => { const enabled = piece.edgeBanding[side]; return <button type="button" key={side} className={`edge-side edge-${side}${enabled ? " enabled" : ""}`} aria-pressed={enabled} aria-label={`${enabled ? "Desactivar" : "Activar"} canto ${SIDE_LABELS[side]}`} onClick={() => onChange(group.map((item) => item.id), { ...piece.edgeBanding, [side]: !enabled })}>{enabled ? "CANTO" : ""}</button>; })}
      <div className="edge-piece-label">PIEZA</div>
    </div>
    <div className="edge-editor-actions"><button type="button" onClick={() => setAll(false)}>Quitar todos los cantos</button><button type="button" onClick={() => setAll(true)}>Cantear los 4 lados</button></div>
  </div>;
}

export default function CutList(props) {
  const pieces = useMemo(() => getCutPieces(props), [props]);
  const groupsByMaterial = useMemo(() => Object.fromEntries(MATERIAL_ORDER.map((materialId) => [materialId, Object.values(pieces.filter((piece) => piece.material.id === materialId).reduce((groups, piece) => { const key = `${piece.name}|${piece.length}|${piece.width}|${piece.grainRequired}|${edgeBandingKey(piece.edgeBanding)}`; (groups[key] ||= []).push(piece); return groups; }, {}))])), [pieces]);
  const melamineGroups = groupsByMaterial.melamine || [];
  const [selectedId, setSelectedId] = useState(null);
  const selectedGroup = melamineGroups.find((group) => group.some((piece) => piece.id === selectedId)) || melamineGroups[0];
  const exact = calculateTotalEdgeBanding(pieces);
  const margin = exact * EDGE_BANDING_WASTE_PERCENT / 100;
  if (props.designValidationError) return <section className="summary-card blocked-card"><h2>Lista de corte bloqueada</h2><p>{props.designValidationError}</p></section>;
  return <section className="summary-card"><h2>Listas de corte</h2><p className="summary-title">{getFurnitureLabel(props.furnitureType)}: {props.widthCm} × {props.heightCm} × {props.depthCm} cm</p>
    <div className="edge-total"><div><span>Canto exacto</span><b>{exact.toFixed(2)} m</b></div><div><span>Margen recomendado (+{EDGE_BANDING_WASTE_PERCENT} %)</span><b>{margin.toFixed(2)} m</b></div><div><span>Comprar aprox.</span><b>{(exact + margin).toFixed(2)} m</b></div></div>
    {selectedGroup && <EdgeEditor group={selectedGroup} onChange={props.onEdgeBandingChange} />}
    {MATERIAL_ORDER.map((materialId) => <div className="cut-list-material" key={materialId}><h3>Lista de Corte - {props.materialConfigs[materialId].label}</h3>{groupsByMaterial[materialId].map((group) => { const summary = edgeBandingSummary(group[0].edgeBanding); return <div className={`cut-piece-row${selectedGroup === group ? " selected" : ""}`} key={`${group[0].id}-${edgeBandingKey(group[0].edgeBanding)}`}><div className="cut-row"><button type="button" className="cut-piece-select" disabled={materialId !== "melamine"} onClick={() => setSelectedId(group[0].id)}>{group[0].name}</button><b>{group.length} · {group[0].length.toFixed(2)} × {group[0].width.toFixed(2)} cm</b></div>{group[0].grainRequired && <div className="cut-piece-details"><span>Veta obligatoria</span></div>}{summary.length > 0 && <div className="cut-piece-details"><span>Canto: {summary.join(", ")}</span></div>}{group[0].mounting && <div className="cut-piece-details"><span>Espesor: {group[0].material.thicknessMm} mm</span><span>Material: {group[0].material.label}</span><span>Ubicación: {group[0].location}</span><span>Instalación: {group[0].installation}</span>{group[0].structuralHeightCm != null && <span>Altura estructural: {group[0].structuralHeightCm} cm</span>}</div>}</div>; })}</div>)}
  </section>;
}
