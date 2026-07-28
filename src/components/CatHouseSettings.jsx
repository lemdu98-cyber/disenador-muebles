const ENTRY_TYPES = {
  none: "Sin perforación (frente completamente abierto)",
  circular: "Entrada circular",
  square: "Entrada cuadrada",
};

export default function CatHouseSettings({ config, onChange, thicknessMm }) {
  const update = (patch) => onChange({ ...config, ...patch });
  const numericUpdate = (key) => (event) => update({ [key]: Math.max(1, Number(event.target.value) || 1) });
  return <section className="configuration cat-house-settings">
    <h2>Casa para Gatos</h2>
    <div className="material-specs"><span>Material</span><b>Melamina</b><span>Espesor de melamina</span><b>{thicknessMm} mm</b></div>
    <label>Tipo de entrada<select value={config.entryType} onChange={(event) => update({ entryType: event.target.value })}>
      {Object.entries(ENTRY_TYPES).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
    </select></label>
    {config.entryType === "circular" && <label>Diámetro de entrada (cm)<input type="number" min="1" step="0.1" value={config.entryDiameterCm} onChange={numericUpdate("entryDiameterCm")} /></label>}
    {config.entryType === "square" && <div className="field-grid">
      <label>Ancho de entrada (cm)<input type="number" min="1" step="0.1" value={config.entryWidthCm} onChange={numericUpdate("entryWidthCm")} /></label>
      <label>Alto de entrada (cm)<input type="number" min="1" step="0.1" value={config.entryHeightCm} onChange={numericUpdate("entryHeightCm")} /></label>
    </div>}
    <label>Color<input type="color" value={config.color} onChange={(event) => update({ color: event.target.value })} /></label>
    {config.entryType !== "none" && <p className="configuration-note">La perforación se realiza en el fondo trasero; el frente permanece completamente abierto.</p>}
  </section>;
}
