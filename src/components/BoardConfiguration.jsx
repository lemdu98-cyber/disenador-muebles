export default function BoardConfiguration({ config, onChange }) {
  const update = (field, minimum) => (event) => {
    const value = Math.max(minimum, Number(event.target.value) || minimum);
    onChange({ ...config, [field]: value });
  };

  return <fieldset className="material-configuration">
    <legend>{config.label}</legend>
    <div className="material-settings-grid">
      <label>Ancho de placa (cm)<input type="number" min="1" value={config.widthCm} onChange={update("widthCm", 1)} /></label>
      <label>Largo de placa (cm)<input type="number" min="1" value={config.lengthCm} onChange={update("lengthCm", 1)} /></label>
      <label>Espesor (mm)<input type="number" min="0.1" step="0.1" value={config.thicknessMm} onChange={update("thicknessMm", 0.1)} /></label>
      <label>Precio por placa (Bs)<input type="number" min="0" step="0.01" value={config.price} onChange={update("price", 0)} /></label>
    </div>
  </fieldset>;
}
