import { calculateDrawerFrontDimensions } from "../utils/drawerFront";

export default function DrawerFrontSettings({ config, onChange, disabled, boxWidthCm, frontWidthCm, forceOverlay = false }) {
  const update = (patch) => onChange({ ...config, ...patch });
  const numericUpdate = (key) => (event) => update({ [key]: Math.max(0, Number(event.target.value) || 0) });
  const front = calculateDrawerFrontDimensions({ boxWidthCm, boxFrontHeightCm: 0, drawerFrontConfig: config });
  return <section className="configuration drawer-front-settings">
    <h2>Frente del cajón</h2>
    <label className="check-setting"><input type="radio" name="drawer-front-type" checked={forceOverlay || config.type === "overlay"} onChange={() => update({ type: "overlay" })} disabled={disabled || forceOverlay} />Frente superpuesto</label>
    <label className="check-setting"><input type="radio" name="drawer-front-type" checked={!forceOverlay && config.type === "inset"} onChange={() => update({ type: "inset" })} disabled={disabled || forceOverlay} />Frente interior</label>
    <div className="field-grid">
      <label>Solape lateral (cm)<input type="number" min="0" step="0.01" value={config.sideOverlayCm} disabled={disabled || forceOverlay || config.type !== "overlay"} onChange={numericUpdate("sideOverlayCm")} /></label>
      <label>Separación entre frentes (mm)<input type="number" min="0" step="0.1" value={config.gapMm} disabled={disabled} onChange={numericUpdate("gapMm")} /></label>
      <label>Solape superior (cm)<input type="number" min="0" step="0.01" value={config.topOverlayCm} disabled={disabled || config.type !== "overlay"} onChange={numericUpdate("topOverlayCm")} /></label>
      <label>Solape inferior (cm)<input type="number" min="0" step="0.01" value={config.bottomOverlayCm} disabled={disabled || config.type !== "overlay"} onChange={numericUpdate("bottomOverlayCm")} /></label>
    </div>
    <div className="front-width-summary"><span>Ancho de la caja</span><b>{boxWidthCm.toFixed(2)} cm</b><span>Ancho del frente</span><b>{(frontWidthCm ?? front.widthCm).toFixed(2)} cm</b></div>
  </section>;
}
