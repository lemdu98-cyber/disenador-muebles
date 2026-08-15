import { DRAWER_SLIDE_LENGTHS_MM, DRAWER_SLIDE_TYPES } from "../utils/drawerSlides";

const cm = (value) => Number(value).toLocaleString("es-BO", { maximumFractionDigits: 2 });

export default function DrawerSlideSettings({ config, onChange, dimensions, disabled, forceTelescopic = false }) {
  const update = (patch) => onChange({ ...config, ...patch });
  const numericUpdate = (key) => (event) => update({ [key]: Math.max(0, Number(event.target.value) || 0) });
  return <section className="configuration slide-settings">
    <h2>Configuración de correderas</h2>
    <label>Tipo de corredera<select value={forceTelescopic ? "telescopic" : config.type} onChange={(event) => update({ type: event.target.value })} disabled={disabled || forceTelescopic}>
      {Object.entries(DRAWER_SLIDE_TYPES).map(([value, option]) => <option key={value} value={value}>{option.label}</option>)}
    </select></label>
    {config.type === "concealed" && <label>Holgura lateral por lado (cm)<input type="number" min="0" step="0.01" value={config.concealedClearanceCm} onChange={numericUpdate("concealedClearanceCm")} /></label>}
    {config.type === "custom" && <>
      <label className="check-setting"><input type="checkbox" checked={config.useSameCustomClearance} onChange={(event) => update({ useSameCustomClearance: event.target.checked })} />Utilizar el mismo valor para ambos lados</label>
      <div className="field-grid">
        <label>Holgura izquierda (cm)<input type="number" min="0" step="0.01" value={config.customLeftClearanceCm} onChange={numericUpdate("customLeftClearanceCm")} /></label>
        <label>Holgura derecha (cm)<input type="number" min="0" step="0.01" value={config.useSameCustomClearance ? config.customLeftClearanceCm : config.customRightClearanceCm} disabled={config.useSameCustomClearance} onChange={numericUpdate("customRightClearanceCm")} /></label>
      </div>
    </>}
    <label>Largo de corredera<select value={config.lengthMm} onChange={(event) => update({ lengthMm: Number(event.target.value) })} disabled={disabled}>
      {DRAWER_SLIDE_LENGTHS_MM.map((length) => <option key={length} value={length}>{length} mm</option>)}
    </select></label>
    {!dimensions.hasEnoughDepth && <p className="validation-error">No existe profundidad suficiente para instalar una corredera de este tamaño.</p>}
    <div className="slide-summary" aria-live="polite">
      <div><span>Tipo de corredera</span><b>{dimensions.typeLabel}</b></div>
      <div><span>Holgura por lado</span><b>{dimensions.leftClearanceCm === dimensions.rightClearanceCm ? `${cm(dimensions.leftClearanceCm)} cm` : `${cm(dimensions.leftClearanceCm)} / ${cm(dimensions.rightClearanceCm)} cm`}</b></div>
      <div><span>Holgura total</span><b>{cm(dimensions.totalClearanceCm)} cm</b></div>
      <div><span>Largo de corredera</span><b>{config.lengthMm} mm</b></div>
      <div><span>Ancho interior del mueble</span><b>{cm(dimensions.interiorWidthCm)} cm</b></div>
      <div><span>Ancho exterior del cajón</span><b>{cm(dimensions.externalWidthCm)} cm</b></div>
      <div><span>Ancho de la trasera</span><b>{cm(dimensions.backWidthCm)} cm</b></div>
      <div><span>Largo del lateral</span><b>{cm(dimensions.sideLengthCm)} cm</b></div>
    </div>
  </section>;
}
