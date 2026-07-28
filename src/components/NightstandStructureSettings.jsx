export default function NightstandStructureSettings({ config, onChange, structure }) {
  const update = (patch) => onChange({ ...config, ...patch });
  const numericUpdate = (key) => (event) => update({ [key]: Math.max(0, Number(event.target.value) || 0) });
  return <section className="configuration">
    <h2>Travesaños estructurales</h2>
    <label className="check-setting"><input type="checkbox" checked={config.rearEnabled} onChange={(event) => update({ rearEnabled: event.target.checked })} />Activar travesaño trasero</label>
    <label>Altura del travesaño trasero (cm)<input type="number" min="1" step="0.1" value={config.rearHeightCm} disabled={!config.rearEnabled} onChange={numericUpdate("rearHeightCm")} /></label>
    <label className="check-setting"><input type="checkbox" checked={config.frontEnabled} onChange={(event) => update({ frontEnabled: event.target.checked })} />Activar travesaño frontal</label>
    <div className="field-grid">
      <label>Altura frontal (cm)<input type="number" min="1" step="0.1" value={config.frontHeightCm} disabled={!config.frontEnabled} onChange={numericUpdate("frontHeightCm")} /></label>
      <label>Profundidad frontal (cm)<input type="number" min="1" step="0.1" value={config.frontDepthCm} disabled={!config.frontEnabled} onChange={numericUpdate("frontDepthCm")} /></label>
      <label>Separación con el cajón (cm)<input type="number" min="0" step="0.1" value={config.frontSafetyGapCm} disabled={!config.frontEnabled} onChange={numericUpdate("frontSafetyGapCm")} /></label>
    </div>
    {!structure.valid && <div className="validation-error"><p>{structure.error}</p><small>Reduzca la altura o separación, modifique los cajones o aumente la altura total del mueble.</small></div>}
  </section>;
}
