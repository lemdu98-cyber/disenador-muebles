export default function ScrapCard({ scrap, onRemove }) {
  return <article className="scrap-card"><div><b>{scrap.code}</b><span className={`status ${scrap.status === "Disponible" ? "available" : "used"}`}>{scrap.status}</span></div><small>{scrap.lengthCm} × {scrap.widthCm} cm · {(scrap.areaCm2 / 10000).toFixed(2)} m²</small><small>{scrap.material} · {scrap.thicknessMm} mm · {scrap.source}</small><div><b>{scrap.value.toFixed(2)} Bs</b>{onRemove && <button type="button" onClick={() => onRemove(scrap.id)}>Quitar</button>}</div></article>;
}
