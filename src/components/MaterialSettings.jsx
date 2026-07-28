import BoardConfiguration from "./BoardConfiguration";
import { MATERIAL_ORDER } from "../utils/materialConfig";

export default function MaterialSettings({ configs, onChange }) {
  return <section className="summary-card material-settings">
    <h2>Configuración de materiales</h2>
    <p className="summary-title">Los cambios recalculan placas, aprovechamiento y costos automáticamente.</p>
    {MATERIAL_ORDER.map((id) => <BoardConfiguration
      key={id}
      config={configs[id]}
      onChange={(nextConfig) => onChange({ ...configs, [id]: nextConfig })}
    />)}
  </section>;
}
