import { useEffect, useState } from "react";
import { deleteDesign, listDesigns, renameDesign } from "../services/furnitureDesigns";

const dateFormatter = new Intl.DateTimeFormat("es", { dateStyle: "medium", timeStyle: "short" });

export default function DesignLibrary({ open, onClose, onLoad, currentDesignId, refreshKey, onDeleted, onRenamed }) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    let active = true;
    listDesigns()
      .then((items) => active && setDesigns(items))
      .catch((reason) => {
        console.error("No se pudieron cargar los diseños:", reason);
        if (active) setError("No se pudieron cargar los diseños.");
      })
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [open, refreshKey]);

  const handleRename = async (design) => {
    const name = window.prompt("Nuevo nombre del diseño:", design.name)?.trim();
    if (!name || name === design.name) return;
    setBusyId(design.id);
    setError("");
    try {
      const updated = await renameDesign(design.id, name);
      setDesigns((items) => items.map((item) => item.id === design.id ? { ...item, ...updated } : item));
      onRenamed(updated);
    } catch (reason) {
      console.error("No se pudo renombrar el diseño:", reason);
      setError("No se pudo renombrar el diseño.");
    } finally { setBusyId(null); }
  };

  const handleDelete = async (design) => {
    if (!window.confirm(`¿Eliminar “${design.name}”?\n\nEsta acción no se puede deshacer.`)) return;
    setBusyId(design.id);
    setError("");
    try {
      await deleteDesign(design.id);
      setDesigns((items) => items.filter((item) => item.id !== design.id));
      onDeleted(design.id);
    } catch (reason) {
      console.error("No se pudo eliminar el diseño:", reason);
      setError("No se pudo eliminar el diseño.");
    } finally { setBusyId(null); }
  };

  if (!open) return null;
  return <section className="design-library summary-card" aria-label="Mis diseños">
    <div className="design-library-heading"><h2>Mis diseños</h2><button type="button" onClick={onClose}>Cerrar</button></div>
    {error && <p className="design-message design-message-error">{error}</p>}
    {loading ? <p className="empty-state">Cargando diseños...</p> : designs.length === 0 ? <p className="empty-state">Todavía no guardaste ningún diseño.</p> :
      <div className="design-list">{designs.map((design) => <article key={design.id} className={design.id === currentDesignId ? "current" : ""}>
        <div><strong>{design.name}</strong><small>{design.furniture_type} · {dateFormatter.format(new Date(design.updated_at))}</small></div>
        <div className="design-row-actions">
          <button type="button" disabled={busyId === design.id} onClick={() => onLoad(design.id)}>Abrir</button>
          <button type="button" disabled={busyId === design.id} onClick={() => handleRename(design)}>Renombrar</button>
          <button type="button" className="danger" disabled={busyId === design.id} onClick={() => handleDelete(design)}>Eliminar</button>
        </div>
      </article>)}</div>}
  </section>;
}
