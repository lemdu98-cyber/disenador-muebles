import { OPTIMIZATION_MODES } from "../utils/optimizer/optimizerConfig";

export default function OptimizerSettings({ settings, onChange }) {
  const updateNumber = (field, minimum = 0) => (event) => onChange({
    ...settings,
    [field]: Math.max(minimum, Number(event.target.value) || 0),
  });
  const updateMargin = (side) => (event) => onChange({
    ...settings,
    marginsCm: { ...settings.marginsCm, [side]: Math.max(0, Number(event.target.value) || 0) },
  });
  const updateBoolean = (field) => (event) => onChange({ ...settings, [field]: event.target.checked });

  return <section className="summary-card optimizer-settings">
    <h2>Configuración del Optimizador</h2>
    <label>Modo de optimización<select value={settings.mode} onChange={(event) => onChange({ ...settings, mode: event.target.value })}>
      {Object.entries(OPTIMIZATION_MODES).map(([value, mode]) => <option key={value} value={value}>{mode.label} · {mode.attempts} intentos</option>)}
    </select></label>
    <label>Espesor del corte (mm)<input type="number" min="0" step=".1" value={settings.kerfMm} onChange={updateNumber("kerfMm")} /></label>
    <div className="optimizer-margin-grid">
      <label>Margen superior (cm)<input type="number" min="0" step=".1" value={settings.marginsCm.top} onChange={updateMargin("top")} /></label>
      <label>Margen inferior (cm)<input type="number" min="0" step=".1" value={settings.marginsCm.bottom} onChange={updateMargin("bottom")} /></label>
      <label>Margen izquierdo (cm)<input type="number" min="0" step=".1" value={settings.marginsCm.left} onChange={updateMargin("left")} /></label>
      <label>Margen derecho (cm)<input type="number" min="0" step=".1" value={settings.marginsCm.right} onChange={updateMargin("right")} /></label>
    </div>
    <label className="check-setting"><input type="checkbox" checked={settings.allowRotation} onChange={updateBoolean("allowRotation")} /> Permitir rotación</label>
    <label className="check-setting"><input type="checkbox" checked={settings.respectGrain} onChange={updateBoolean("respectGrain")} /> Respetar dirección de veta</label>
    <label className="check-setting"><input type="checkbox" checked={settings.useScrapBank} onChange={updateBoolean("useScrapBank")} /> Utilizar Banco de Retazos</label>
  </section>;
}
