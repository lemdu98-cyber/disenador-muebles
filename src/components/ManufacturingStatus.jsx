export default function ManufacturingStatus({ error, warnings = [] }) {
  const state = error ? "invalid" : warnings.length ? "warning" : "valid";
  const title = error ? "✕ Configuración no fabricable" : warnings.length ? "⚠ Revisar configuración" : "✓ Configuración fabricable";
  return <section className={`manufacturing-status manufacturing-status-${state}`}>
    <strong>{title}</strong>
    {error && <p>{error}</p>}
    {warnings.map((warning) => <p key={warning}>{warning}</p>)}
  </section>;
}
