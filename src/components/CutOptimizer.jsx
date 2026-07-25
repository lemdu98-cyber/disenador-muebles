import { useMemo } from "react";
import { getCutPieces } from "../utils/cutPieces";
import { optimizeCuts } from "../utils/cuttingOptimizer";
import MaterialCalculator from "./MaterialCalculator";
import BoardLayout from "./BoardLayout";

export default function CutOptimizer(props) {
  const pieces = useMemo(() => getCutPieces(props), [props]);
  const { boards, unplaced } = useMemo(() => optimizeCuts(pieces), [pieces]);
  return <><MaterialCalculator pieces={pieces} boards={boards} unplaced={unplaced} /><section className="summary-card optimizer-card"><h2>Optimización de corte</h2><p className="summary-title">Acomodado guillotine con giro de 90° cuando mejora el aprovechamiento.</p><BoardLayout boards={boards} /></section></>;
}
