import { useMemo } from "react";
import { getCutPieces, getFurnitureLabel } from "../utils/cutPieces";

export default function CutList(props) {
  const pieces = useMemo(() => getCutPieces(props), [props]);
  const grouped = Object.values(pieces.reduce((groups, piece) => {
    const key = `${piece.name}|${piece.length}|${piece.width}`;
    (groups[key] ||= []).push(piece);
    return groups;
  }, {}));
  return <section className="summary-card"><h2>Lista de corte</h2><p className="summary-title">{getFurnitureLabel(props.furnitureType)}: {props.widthCm} × {props.heightCm} × {props.depthCm} cm</p><ul>
    {grouped.map((group) => <li key={group[0].id}><b>{group[0].name}:</b> {group.length} pieza(s) de {group[0].length.toFixed(1)} × {group[0].width.toFixed(1)} cm <em>({(group.reduce((sum, piece) => sum + piece.areaCm2, 0) / 10000).toFixed(2)} m²)</em></li>)}
  </ul></section>;
}
