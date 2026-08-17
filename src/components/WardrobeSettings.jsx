export default function WardrobeSettings({ config, onChange, structure }) {
  const update = (key) => (event) => onChange({ ...config, [key]: event.target.type === "checkbox" ? event.target.checked : Number(event.target.value) });
  return <section className="configuration"><h2>Distribución del ropero</h2>
    <fieldset className="material-configuration"><legend>Tipo de puertas</legend>
      <label className="checkbox-row"><input type="radio" name="wardrobe-door-type" checked={config.doorType === "hinged"} onChange={() => onChange({ ...config, doorType: "hinged" })} /> Puertas normales</label>
      <label className="checkbox-row"><input type="radio" name="wardrobe-door-type" checked={config.doorType === "sliding"} onChange={() => onChange({ ...config, doorType: "sliding" })} /> Puertas corredizas</label>
    </fieldset>
    {config.doorType === "sliding" && <>
      <label>Extensión frontal sistema corredizo (cm)<input type="number" min="2" step="0.5" value={config.slidingDoorExtensionCm} onChange={update("slidingDoorExtensionCm")} /></label>
      <label>Altura soporte riel inferior (cm)<input type="number" min="5" step="1" value={config.slidingLowerSupportHeightCm} onChange={update("slidingLowerSupportHeightCm")} /></label>
      <label>Solapamiento puertas corredizas (cm)<input type="number" min="0.5" step="0.5" value={config.slidingDoorOverlapCm} onChange={update("slidingDoorOverlapCm")} /></label>
    </>}
    <label>Altura compartimento superior (cm)<input type="number" min="25" step="1" value={config.upperCompartmentHeightCm} onChange={update("upperCompartmentHeightCm")} /></label>
    <label>Altura zona de cajones (cm)<input type="number" min="25" step="1" value={config.drawerRegionHeightCm} onChange={update("drawerRegionHeightCm")} /></label>
    <label>Altura zona zapatero (cm)<input type="number" min="35" step="1" value={config.shoeRegionHeightCm} onChange={update("shoeRegionHeightCm")} /></label>
    <label>Altura travesaño inferior (cm)<input type="number" min="5" step="1" value={config.lowerCrossbarHeightCm} onChange={update("lowerCrossbarHeightCm")} /></label>
    <label className="checkbox-row"><input type="checkbox" checked={config.showDoors} onChange={update("showDoors")} /> Mostrar puertas</label>
    <label className="checkbox-row"><input type="checkbox" checked={config.showOpenDoors} onChange={update("showOpenDoors")} /> Mostrar puertas abiertas</label>
    <label className="checkbox-row"><input type="checkbox" checked={config.showOpenDrawers} onChange={update("showOpenDrawers")} /> Mostrar cajones abiertos</label>
    <label className="checkbox-row"><input type="checkbox" checked={config.showStructure} onChange={update("showStructure")} /> Mostrar estructura</label>
    <p className="configuration-note">Ancho útil por cuerpo: {Math.max(0, structure.openingWidthCm).toFixed(1)} cm · 6 cajones fijos.</p>
  </section>;
}
