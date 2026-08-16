export default function WardrobeSettings({ config, onChange, structure }) {
  const update = (key) => (event) => onChange({ ...config, [key]: event.target.type === "checkbox" ? event.target.checked : Number(event.target.value) });
  return <section className="configuration"><h2>Distribución del ropero</h2>
    <label>Ancho zona izquierda (cm)<input type="number" min="45" step="1" value={config.leftZoneWidthCm} onChange={update("leftZoneWidthCm")} /></label>
    <label>Altura zona de cajones (cm)<input type="number" min="25" step="1" value={config.drawerRegionHeightCm} onChange={update("drawerRegionHeightCm")} /></label>
    <label className="checkbox-row"><input type="checkbox" checked={config.showOpenDoors} onChange={update("showOpenDoors")} /> Mostrar puertas abiertas</label>
    <label className="checkbox-row"><input type="checkbox" checked={config.showOpenDrawers} onChange={update("showOpenDrawers")} /> Mostrar cajones abiertos</label>
    <label className="checkbox-row"><input type="checkbox" checked={config.showStructure} onChange={update("showStructure")} /> Mostrar estructura</label>
    <p className="configuration-note">Zona colgada libre: {Math.max(0, structure.rightOpeningWidthCm).toFixed(1)} cm.</p>
  </section>;
}
