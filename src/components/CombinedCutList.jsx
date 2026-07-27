export default function CombinedCutList({ grouped, consolidated }) {
  return <div className="production-lists">
    <section className="summary-card"><h2>Lista de corte por mueble</h2>{grouped.length ? grouped.map((item) => <div className="cut-group" key={item.furnitureType}><b>{item.label.toUpperCase()} ({item.quantity})</b>{item.groups.map((group) => <div key={`${item.furnitureType}-${group[0].id}`} className="cut-row"><span>{group[0].name}</span><span>{group.length * item.quantity} · {group[0].length.toFixed(1)} × {group[0].width.toFixed(1)}</span></div>)}</div>) : <p className="empty-state">Seleccione muebles para crear un pedido.</p>}</section>
    <section className="summary-card"><h2>Lista de corte consolidada</h2>{consolidated.length ? consolidated.map((item) => <div className="cut-row" key={`${item.length}-${item.width}`}><span>{item.length} × {item.width} cm</span><b>{item.quantity} piezas</b></div>) : <p className="empty-state">Aquí se agruparán las piezas iguales.</p>}</section>
  </div>;
}
