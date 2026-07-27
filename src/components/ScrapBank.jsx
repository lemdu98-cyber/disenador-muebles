import ScrapCard from "./ScrapCard";

export default function ScrapBank({ scraps, onRemove }) {
  return <section className="summary-card scrap-bank"><h2>Banco de retazos</h2><p className="summary-title">Los retazos disponibles se prueban antes de abrir una placa nueva.</p>{scraps.length ? <div className="scrap-grid">{scraps.map((scrap) => <ScrapCard key={scrap.id} scrap={scrap} onRemove={onRemove} />)}</div> : <p className="empty-state">No hay retazos reutilizables almacenados.</p>}</section>;
}
