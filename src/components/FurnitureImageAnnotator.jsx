import { useEffect, useMemo, useState } from "react";
import {
  ANNOTATION_LABELS,
  ANNOTATION_TYPES,
  countAnnotations,
  createAnnotation,
  MIN_ANNOTATION_SIZE,
  removeAnnotation,
  updateAnnotation,
} from "../utils/furnitureImageAnnotations.js";
import { deriveFurnitureLayoutFromAnnotations } from "../utils/furnitureAnnotationGeometry.js";

const TYPE_CLASS = { drawer: "drawer", door: "door", shelf: "shelf", section: "section" };
const PLURAL_LABELS = { drawer: "cajones", door: "puertas", shelf: "repisas" };

function imagePoint(event, element) {
  const bounds = element.getBoundingClientRect();
  return {
    x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)),
    y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)),
  };
}

export default function FurnitureImageAnnotator({ previewUrl, dimensions, annotations, onChange, onFinish, onBack }) {
  const [drawType, setDrawType] = useState("drawer");
  const [selectedId, setSelectedId] = useState(null);
  const [interaction, setInteraction] = useState(null);
  const counts = useMemo(() => countAnnotations(annotations), [annotations]);
  const layout = useMemo(() => deriveFurnitureLayoutFromAnnotations({ annotations, dimensions }), [annotations, dimensions]);
  const sectionContents = useMemo(() => layout.sectionLayout.map((section) => {
    const assigned = layout.elementAssignments.filter((element) => element.sectionIndex === section.index && element.assignment === "assigned");
    return ANNOTATION_TYPES.filter((type) => type !== "section").map((type) => [type, assigned.filter((element) => element.type === type).length]).filter(([, count]) => count > 0);
  }), [layout]);

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === "Escape") setInteraction(null);
      if (event.key === "Delete" && selectedId && !["INPUT", "SELECT", "TEXTAREA"].includes(document.activeElement?.tagName)) {
        onChange(removeAnnotation(annotations, selectedId));
        setSelectedId(null);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [annotations, onChange, selectedId]);

  const startDrawing = (event) => {
    if (event.button !== 0 || event.target !== event.currentTarget) return;
    const point = imagePoint(event, event.currentTarget);
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(null);
    setInteraction({ mode: "draw", pointerId: event.pointerId, start: point, current: point });
  };

  const startEdit = (event, annotation, mode) => {
    if (event.button !== 0) return;
    event.stopPropagation();
    const surface = event.currentTarget.closest(".annotation-surface");
    const point = imagePoint(event, surface);
    event.currentTarget.setPointerCapture(event.pointerId);
    setSelectedId(annotation.id);
    setInteraction({ mode, pointerId: event.pointerId, start: point, original: annotation, surface });
  };

  const movePointer = (event) => {
    if (!interaction || event.pointerId !== interaction.pointerId) return;
    const surface = interaction.surface || event.currentTarget;
    const point = imagePoint(event, surface);
    if (interaction.mode === "draw") setInteraction((current) => ({ ...current, current: point }));
    if (interaction.mode === "move") {
      const dx = point.x - interaction.start.x;
      const dy = point.y - interaction.start.y;
      onChange(updateAnnotation(annotations, interaction.original.id, {
        x: Math.min(1 - interaction.original.width, Math.max(0, interaction.original.x + dx)),
        y: Math.min(1 - interaction.original.height, Math.max(0, interaction.original.y + dy)),
      }));
    }
    if (interaction.mode === "resize") {
      onChange(updateAnnotation(annotations, interaction.original.id, {
        width: Math.max(MIN_ANNOTATION_SIZE, point.x - interaction.original.x),
        height: Math.max(MIN_ANNOTATION_SIZE, point.y - interaction.original.y),
      }));
    }
  };

  const finishPointer = (event) => {
    if (!interaction || event.pointerId !== interaction.pointerId) return;
    if (interaction.mode === "draw") {
      const annotation = createAnnotation({
        id: `annotation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        type: drawType,
        startX: interaction.start.x,
        startY: interaction.start.y,
        endX: interaction.current.x,
        endY: interaction.current.y,
      });
      if (annotation) {
        onChange([...annotations, annotation]);
        setSelectedId(annotation.id);
      }
    }
    setInteraction(null);
  };

  const draft = interaction?.mode === "draw" ? createAnnotation({
    id: "annotation-draft", type: drawType,
    startX: interaction.start.x, startY: interaction.start.y,
    endX: interaction.current.x, endY: interaction.current.y,
  }) : null;

  const indexedLabels = useMemo(() => {
    const indexes = Object.fromEntries(ANNOTATION_TYPES.map((type) => [type, 0]));
    return Object.fromEntries(annotations.map((annotation) => {
      indexes[annotation.type] += 1;
      return [annotation.id, `${ANNOTATION_LABELS[annotation.type]} ${indexes[annotation.type]}`];
    }));
  }, [annotations]);

  const clearAll = () => {
    if (!annotations.length || window.confirm("¿Eliminar todas las marcas actuales?")) {
      onChange([]); setSelectedId(null); setInteraction(null);
    }
  };

  return <div className="annotation-editor">
    <div className="annotation-instructions">
      <strong>1. Selecciona qué quieres marcar</strong>
      <span>2. Arrastra sobre la imagen</span><span>3. Revisa la estructura</span><span>4. Aplica el diseño</span>
    </div>
    <p className="configuration-note">Para mejores resultados utiliza una fotografía tomada lo más de frente posible.</p>
    <div className="annotation-toolbar" role="toolbar" aria-label="Tipo de marca">
      {ANNOTATION_TYPES.map((type) => <button type="button" key={type} className={drawType === type ? "active" : ""} aria-pressed={drawType === type} onClick={() => setDrawType(type)}>{type === "section" ? "Cuerpo / sección" : ANNOTATION_LABELS[type]}</button>)}
      <button type="button" className="danger" disabled={!annotations.length} onClick={clearAll}>Limpiar marcas</button>
    </div>
    <div className="annotation-layout">
      <div className="annotation-canvas-column">
        <div className="annotation-image-frame">
          <img src={previewUrl} alt="Fotografía del mueble para marcar su estructura" draggable="false" />
          <div className="annotation-surface" aria-label="Área para marcar la estructura" onPointerDown={startDrawing} onPointerMove={movePointer} onPointerUp={finishPointer} onPointerCancel={() => setInteraction(null)}>
            {annotations.map((annotation) => <div
              key={annotation.id}
              className={`image-annotation type-${TYPE_CLASS[annotation.type]} ${selectedId === annotation.id ? "selected" : ""}`}
              style={{ left: `${annotation.x * 100}%`, top: `${annotation.y * 100}%`, width: `${annotation.width * 100}%`, height: `${annotation.height * 100}%` }}
              role="button" tabIndex="0" aria-label={`${indexedLabels[annotation.id]}. Arrastra para mover.`}
              onClick={(event) => { event.stopPropagation(); setSelectedId(annotation.id); }}
              onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); setSelectedId(annotation.id); } }}
              onPointerDown={(event) => startEdit(event, annotation, "move")}
              onPointerMove={movePointer} onPointerUp={finishPointer} onPointerCancel={() => setInteraction(null)}
            >
              <span>{ANNOTATION_LABELS[annotation.type]}</span>
              <i aria-label={`Redimensionar ${indexedLabels[annotation.id]}`} onPointerDown={(event) => startEdit(event, annotation, "resize")} onPointerMove={movePointer} onPointerUp={finishPointer} />
            </div>)}
            {draft && <div className={`image-annotation draft type-${TYPE_CLASS[draft.type]}`} style={{ left: `${draft.x * 100}%`, top: `${draft.y * 100}%`, width: `${draft.width * 100}%`, height: `${draft.height * 100}%` }}><span>{ANNOTATION_LABELS[draft.type]}</span></div>}
          </div>
        </div>
      </div>
      <aside className="annotation-sidebar">
        <section className="annotation-summary" aria-live="polite">
          <h3>Estructura marcada</h3>
          <dl><div><dt>Cuerpos</dt><dd>{counts.sections}</dd></div><div><dt>Puertas</dt><dd>{counts.doors}</dd></div><div><dt>Cajones</dt><dd>{counts.drawers}</dd></div><div><dt>Repisas</dt><dd>{counts.shelves}</dd></div></dl>
        </section>
        {!!layout.sectionLayout.length && <section className={`annotation-proportions quality-${layout.quality}`} aria-live="polite">
          <h3>Distribución aproximada</h3>
          <p>Medidas visuales previas a espesores y holguras.</p>
          {layout.sectionLayout.map((section) => <div key={section.annotationId}>
            <strong>Cuerpo {section.index + 1}: {Math.round(section.widthRatio * 100)} % · ~{Math.round(section.approxWidthCm)} cm</strong>
            {!!sectionContents[section.index].length && <small>{sectionContents[section.index].map(([type, count]) => `${count} ${count === 1 ? ANNOTATION_LABELS[type].toLocaleLowerCase() : PLURAL_LABELS[type]}`).join(" · ")}</small>}
          </div>)}
          {layout.warnings.map((warning) => <p className="configuration-warning" key={warning}>{warning}</p>)}
        </section>}
        <div className="annotation-list" aria-label="Lista de marcas">
          {!annotations.length && <p>Arrastra sobre la fotografía para crear la primera marca.</p>}
          {annotations.map((annotation) => <div key={annotation.id} className={selectedId === annotation.id ? "selected" : ""}>
            <button type="button" className="annotation-select" onClick={() => setSelectedId(annotation.id)}>{indexedLabels[annotation.id]}</button>
            <select aria-label={`Tipo de ${indexedLabels[annotation.id]}`} value={annotation.type} onChange={(event) => onChange(updateAnnotation(annotations, annotation.id, { type: event.target.value }))}>
              {ANNOTATION_TYPES.map((type) => <option key={type} value={type}>{ANNOTATION_LABELS[type]}</option>)}
            </select>
            <button type="button" className="danger" aria-label={`Eliminar ${indexedLabels[annotation.id]}`} onClick={() => { onChange(removeAnnotation(annotations, annotation.id)); if (selectedId === annotation.id) setSelectedId(null); }}>Eliminar</button>
          </div>)}
        </div>
      </aside>
    </div>
    <div className="annotation-footer"><button type="button" onClick={onBack}>Volver</button><button type="button" className="primary-action" onClick={onFinish}>Revisar estructura</button></div>
  </div>;
}
