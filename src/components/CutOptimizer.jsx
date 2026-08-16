import { useMemo } from "react";
import { getCutPieces } from "../utils/cutPieces";
import { optimizeAllMaterials } from "../utils/materialOptimizer";
import BoardLayout from "./BoardLayout";
import { MATERIAL_ORDER } from "../utils/materialConfig";

export default function CutOptimizer(props) {
  const pieces = useMemo(() => getCutPieces(props), [props]);
  const options = useMemo(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [id, { optimizerSettings: props.optimizerSettings }])), [props.optimizerSettings]);
  const results = useMemo(() => optimizeAllMaterials(props.designValidationError ? [] : pieces, props.materialConfigs, options), [pieces, props.materialConfigs, props.designValidationError, options]);
  if (props.designValidationError) return null;

  return <>{MATERIAL_ORDER.map((id) => {
    const config = props.materialConfigs[id];
    const result = results[id];
    return <section className="summary-card optimizer-card" key={id}>
      <p className="eyebrow">PLACAS DE {config.label.toUpperCase()}</p>
      <h2>Optimización de {config.label}</h2>
      <div className="board-total"><span>{config.lengthCm} × {config.widthCm} cm · {config.thicknessMm} mm</span><b>{result.boards.length} placas · {(result.boards.length * config.price).toFixed(2)} Bs</b></div>
      {result.boards.length ? <BoardLayout boards={result.boards} /> : <p className="empty-state">Sin piezas para optimizar.</p>}
      {result.unplaced.length > 0 && <p className="optimizer-warning">{result.unplaced.length} pieza(s) no caben.</p>}
    </section>;
  })}</>;
}
