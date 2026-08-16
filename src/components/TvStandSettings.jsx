const cm = (value) => Number(value).toLocaleString("es-BO", { maximumFractionDigits: 1 });

export default function TvStandSettings({ config, onChange, structure }) {
  const update = (patch) => onChange({ ...config, ...patch });
  const numericUpdate = (key) => (event) => update({ [key]: Math.max(0, Number(event.target.value) || 0) });
  return <section className="configuration">
    <h2>Estructura del TV Stand</h2>
    <label>Altura de repisa interior (cm)<input type="number" min="1" step="0.1" value={config.shelfHeightCm} onChange={numericUpdate("shelfHeightCm")} /></label>
    <label className="check-setting"><input type="checkbox" checked={config.dividerEnabled} onChange={(event) => update({ dividerEnabled: event.target.checked })} />Activar divisor central</label>
    <h2>Travesaños traseros</h2>
    <label className="check-setting"><input type="checkbox" checked={config.upperRearEnabled} onChange={(event) => update({ upperRearEnabled: event.target.checked })} />Activar travesaño trasero superior</label>
    <label>Altura del travesaño superior (cm)<input type="number" min="1" step="0.1" value={config.upperRearHeightCm} disabled={!config.upperRearEnabled} onChange={numericUpdate("upperRearHeightCm")} /></label>
    <label className="check-setting"><input type="checkbox" checked={config.lowerRearEnabled} onChange={(event) => update({ lowerRearEnabled: event.target.checked })} />Activar travesaño trasero inferior</label>
    <label>Altura del travesaño inferior (cm)<input type="number" min="1" step="0.1" value={config.lowerRearHeightCm} disabled={!config.lowerRearEnabled} onChange={numericUpdate("lowerRearHeightCm")} /></label>
    <label className="check-setting"><input type="checkbox" checked={config.showStructure} onChange={(event) => update({ showStructure: event.target.checked })} />Mostrar estructura</label>
    <div className="slide-summary">
      <div><span>Luz horizontal por compartimento</span><b>{cm(structure.shelfSpanCm)} cm</b></div>
      <div><span>Espacio inferior útil</span><b>{cm(structure.lowerClearHeightCm)} cm</b></div>
      <div><span>Espacio superior útil</span><b>{cm(structure.upperClearHeightCm)} cm</b></div>
    </div>
    {structure.warning && <p className="optimizer-warning">Advertencia: {structure.warning}</p>}
    {!structure.valid && <p className="validation-error">{structure.error}</p>}
  </section>;
}
