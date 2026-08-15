const cm = (value) => Number(value).toLocaleString("es-BO", { maximumFractionDigits: 1 });

export default function DeskSettings({ config, onChange, structure }) {
  const update = (patch) => onChange({ ...config, ...patch });
  const numericUpdate = (key) => (event) => update({ [key]: Math.max(0, Number(event.target.value) || 0) });
  return <section className="configuration">
    <h2>Módulo estructural de cajones</h2>
    <label>Posición de cajones<select value={config.drawerPosition} onChange={(event) => update({ drawerPosition: event.target.value })}>
      <option value="right">Derecha</option>
      <option value="left">Izquierda</option>
    </select></label>
    <div className="field-grid">
      <label>Ancho módulo de cajones (cm)<input type="number" min="1" step="0.1" value={config.drawerModuleWidthCm} onChange={numericUpdate("drawerModuleWidthCm")} /></label>
      <label>Separación entre frentes (cm)<input type="number" min="0.1" step="0.1" value={config.drawerFrontGapCm} onChange={numericUpdate("drawerFrontGapCm")} /></label>
      <label>Altura del travesaño trasero (cm)<input type="number" min="1" step="0.1" value={config.rearCrossbarHeightCm} onChange={numericUpdate("rearCrossbarHeightCm")} /></label>
    </div>
    <label className="check-setting"><input type="checkbox" checked={config.showOpenDrawers} onChange={(event) => update({ showOpenDrawers: event.target.checked })} />Mostrar cajones abiertos</label>
    <div className="slide-summary">
      <div><span>Ancho libre para piernas</span><b>{cm(structure.legroomWidthCm)} cm</b></div>
      <div><span>Altura libre para piernas</span><b>{cm(structure.legroomHeightCm)} cm</b></div>
      <div><span>Ancho interior del módulo</span><b>{cm(structure.drawerOpeningWidthCm)} cm</b></div>
    </div>
    {!structure.valid && <p className="validation-error">{structure.error}</p>}
  </section>;
}
