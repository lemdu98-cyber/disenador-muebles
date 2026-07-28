import { useMemo } from "react";
import { getCutPieces, getFurnitureLabel } from "../utils/cutPieces";
import { MATERIAL_ORDER } from "../utils/materialConfig";

export default function CutList(props) {
  const pieces = useMemo(() => getCutPieces(props), [props]);
  return <section className="summary-card">
    <h2>Listas de corte</h2>
    <p className="summary-title">{getFurnitureLabel(props.furnitureType)}: {props.widthCm} × {props.heightCm} × {props.depthCm} cm</p>
    {MATERIAL_ORDER.map((materialId) => {
      const materialPieces = pieces.filter((piece) => piece.material.id === materialId);
      const grouped = Object.values(materialPieces.reduce((groups, piece) => {
        const key = `${piece.name}|${piece.length}|${piece.width}`;
        (groups[key] ||= []).push(piece);
        return groups;
      }, {}));
      const label = props.materialConfigs[materialId].label;
      return <div className="cut-list-material" key={materialId}>
        <h3>Lista de Corte - {label}</h3>
        {grouped.map((group) => <div className="cut-piece-row" key={group[0].id}>
          <div className="cut-row"><span>{group[0].name}</span><b>{group.length} · {group[0].length.toFixed(1)} × {group[0].width.toFixed(1)} cm</b></div>
          {group[0].mounting && <div className="cut-piece-details">
            <span>Espesor: {group[0].material.thicknessMm} mm</span>
            <span>Material: {group[0].material.label}</span>
            <span>Ubicación: {group[0].location}</span>
            <span>Instalación: {group[0].installation}</span>
          </div>}
        </div>)}
      </div>;
    })}
  </section>;
}
