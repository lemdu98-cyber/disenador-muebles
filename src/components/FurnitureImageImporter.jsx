import { useEffect, useState } from "react";
import { ANALYSIS_PROVIDER, analyzeFurnitureImage, DETECTABLE_FURNITURE_TYPES, validateFurnitureImage } from "../services/furnitureImageAnalysis";
import { proposalToNormalizedConfig, PROPOSAL_TYPES, updateProposal, validateFurnitureProposal } from "../utils/imageFurnitureProposal";
import { annotationsToFurnitureProposal } from "../utils/furnitureImageAnnotations.js";
import FurnitureImageAnnotator from "./FurnitureImageAnnotator.jsx";
import { getWardrobeSectionGeometry, normalizeWardrobeSectionWidthRatios } from "../utils/wardrobeStructure.js";
import { getDeskSectionGeometry } from "../utils/deskStructure.js";

const LABELS = { unknown: "No reconocido", nightstand: "Mesa de noche", desk: "Escritorio", tvStand: "Mueble TV", catHouse: "Casa para Gatos", wardrobe: "Ropero" };
const initialDimensions = { widthCm: "", heightCm: "", depthCm: "" };

export default function FurnitureImageImporter({ open, onCancel, onApply, validateConstructiveProposal, melamineThicknessMm = 15 }) {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [dimensions, setDimensions] = useState(initialDimensions);
  const [mockType, setMockType] = useState("nightstand");
  const [manualType, setManualType] = useState("nightstand");
  const [annotations, setAnnotations] = useState([]);
  const [proposal, setProposal] = useState(null);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const reset = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(null); setPreviewUrl(""); setDimensions(initialDimensions); setProposal(null); setAnnotations([]); setStatus("idle"); setError("");
  };
  const cancel = () => { reset(); onCancel(); };
  const selectFile = (event) => {
    const next = event.target.files?.[0];
    if (!next) return;
    if (annotations.length && !window.confirm("Cambiar la imagen eliminará las marcas actuales.\n¿Continuar?")) { event.target.value = ""; return; }
    const message = validateFurnitureImage(next);
    if (message) { setError(message); event.target.value = ""; return; }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(next); setPreviewUrl(URL.createObjectURL(next)); setStatus("image-selected"); setProposal(null); setAnnotations([]); setError("");
  };
  const startAnnotating = () => {
    if (!file) { setError("Selecciona una imagen válida."); return; }
    if (![dimensions.widthCm, dimensions.heightCm, dimensions.depthCm].every((value) => Number(value) > 0)) { setError("Introduce ancho, alto y fondo."); return; }
    setError(""); setStatus("annotating");
  };
  const finishAnnotating = () => {
    try {
      setProposal(annotationsToFurnitureProposal({ detectedType: manualType, dimensions, annotations }));
      setStatus("reviewing"); setError("");
    } catch (reason) { setError(reason.message); }
  };
  const analyze = async () => {
    setStatus("analyzing"); setError("");
    try {
      const result = await analyzeFurnitureImage({ file, dimensions, mockDetectedType: mockType });
      setProposal(result); setStatus("reviewing");
    } catch (reason) { setStatus(file ? "image-selected" : "idle"); setError(reason.message || "No se pudo analizar la imagen."); }
  };
  const changeProposal = (section, key, value) => setProposal((current) => updateProposal(current, section, key, value));
  const apply = () => {
    const errors = validateFurnitureProposal(proposal);
    if (!errors.length && validateConstructiveProposal) errors.push(...validateConstructiveProposal(proposal));
    if (errors.length) { setError(errors[0]); return; }
    setStatus("applying");
    onApply(proposalToNormalizedConfig(proposal));
    reset();
  };

  if (!open) return null;
  const lowConfidence = proposal && proposal.confidence < 0.7;
  const proposalErrors = proposal ? validateFurnitureProposal(proposal) : [];
  const wardrobeRatioSummary = proposal?.detectedType === "wardrobe" && proposal.structure.sectionLayout?.length === 3 && proposal.structure.layoutCanNormalizeSections === true ? (() => {
    const normalized = normalizeWardrobeSectionWidthRatios(proposal.structure.sectionLayout.map(({ widthRatio }) => widthRatio));
    return normalized.valid ? getWardrobeSectionGeometry({ widthCm: Number(proposal.dimensions.widthCm), thicknessCm: melamineThicknessMm / 10, sectionWidthRatios: normalized.ratios }) : null;
  })() : null;
  const deskModuleSummary = proposal?.detectedType === "desk" && proposal.structure.drawerModule?.valid ? getDeskSectionGeometry({ widthCm: Number(proposal.dimensions.widthCm), thicknessCm: melamineThicknessMm / 10, deskConfig: { drawerModuleSide: proposal.structure.drawerModule.side, drawerModuleWidthRatio: proposal.structure.drawerModule.widthRatio } }) : null;
  return <div className="image-import-overlay" role="dialog" aria-modal="true" aria-label="Crear desde imagen">
    <section className={`image-import-dialog ${status === "annotating" ? "annotating" : ""}`}>
      <div className="image-import-heading"><div>{ANALYSIS_PROVIDER === "mock" && <p className="eyebrow">ANÁLISIS SIMULADO · DESARROLLO</p>}<h2>{status === "annotating" ? "Editar estructura en la imagen" : proposal ? "Revisar diseño" : "Crear desde imagen"}</h2></div><button type="button" onClick={cancel}>Cancelar</button></div>
      {status === "annotating" ? <FurnitureImageAnnotator previewUrl={previewUrl} dimensions={dimensions} annotations={annotations} onChange={setAnnotations} onBack={() => setStatus("image-selected")} onFinish={finishAnnotating} /> : !proposal ? <>
        <label>Imagen JPG, PNG o WEBP (máximo 10 MB)<input type="file" accept="image/jpeg,image/png,image/webp" onChange={selectFile} /></label>
        {previewUrl && <div className="image-preview"><img src={previewUrl} alt="Vista previa del mueble seleccionado" /><div><strong>{file.name}</strong><button type="button" onClick={() => { if (!annotations.length || window.confirm("Quitar la imagen eliminará las marcas actuales. ¿Continuar?")) reset(); }}>Quitar imagen</button></div></div>}
        <div className="field-grid">
          {[["widthCm", "Ancho total (cm)"], ["heightCm", "Alto total (cm)"], ["depthCm", "Fondo (cm)"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="1" value={dimensions[key]} onChange={(event) => setDimensions((current) => ({ ...current, [key]: event.target.value }))} /></label>)}
        </div>
        <label>Tipo de mueble<select value={manualType} onChange={(event) => setManualType(event.target.value)}>{DETECTABLE_FURNITURE_TYPES.map((type) => <option key={type} value={type}>{LABELS[type]}</option>)}</select></label>
        <p className="configuration-note">Para mejores resultados utiliza una fotografía tomada lo más de frente posible.</p>
        <button type="button" className="manual-annotation-launch" onClick={startAnnotating}>Editar estructura en la imagen</button>
        {ANALYSIS_PROVIDER === "mock" && <><label>Tipo devuelto por el mock<select value={mockType} onChange={(event) => setMockType(event.target.value)}><option value="unknown">No reconocido</option>{DETECTABLE_FURNITURE_TYPES.map((type) => <option key={type} value={type}>{LABELS[type]}</option>)}</select></label><p className="configuration-note">Este modo no analiza realmente la fotografía. Simula la respuesta para probar revisión, aplicación y guardado.</p></>}
        <button type="button" className="primary-action" disabled={status === "analyzing"} onClick={analyze}>{status === "analyzing" ? "Analizando..." : "Analizar imagen"}</button>
      </> : <>
        <p className={lowConfidence ? "configuration-warning" : "configuration-note"}>{proposal.provider === "manual" ? "Definido manualmente" : <>Confianza del análisis: {Math.round(proposal.confidence * 100)} %{lowConfidence ? " · Revisa cuidadosamente la propuesta." : ""}</>}</p>
        <label>Tipo de mueble<select value={proposal.detectedType} onChange={(event) => setProposal((current) => ({ ...current, detectedType: event.target.value }))}>{PROPOSAL_TYPES.map((type) => <option key={type} value={type}>{LABELS[type]}</option>)}</select></label>
        <div className="field-grid">{[["widthCm", "Ancho (cm)"], ["heightCm", "Alto (cm)"], ["depthCm", "Fondo (cm)"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="1" value={proposal.dimensions[key]} onChange={(event) => changeProposal("dimensions", key, event.target.value)} /></label>)}</div>
        {proposal.provider === "manual" ? <div className="field-grid">{[["sections", "Cuerpos"], ["doors", "Puertas"], ["drawers", "Cajones"], ["shelves", "Repisas"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={proposal.structure[key] ?? 0} onChange={(event) => changeProposal("structure", key, Number(event.target.value))} /></label>)}</div> : <>{(["nightstand", "desk"].includes(proposal.detectedType)) && <label>Cajones<input type="number" min="0" value={proposal.structure.drawers ?? ""} onChange={(event) => changeProposal("structure", "drawers", Number(event.target.value))} /></label>}{proposal.detectedType === "wardrobe" && <div className="field-grid">{[["sections", "Cuerpos"], ["doors", "Puertas"], ["drawers", "Cajones"], ["shelves", "Repisas"]].map(([key, label]) => <label key={key}>{label}<input type="number" min="0" value={proposal.structure[key] ?? ""} onChange={(event) => changeProposal("structure", key, Number(event.target.value))} /></label>)}</div>}</>}
        {proposal.notes.map((note) => <p className="configuration-note" key={note}>{note}</p>)}
        {proposal.warnings.map((warning) => <p className="configuration-warning" key={warning}>{warning}</p>)}
        {wardrobeRatioSummary && <section className="image-ratio-summary"><b>Distribución que se aplicará</b>{wardrobeRatioSummary.sectionWidthRatios.map((ratio, index) => <span key={index}>Cuerpo {index + 1}: {(ratio * 100).toFixed(1)} % · aprox. {wardrobeRatioSummary.sectionWidthsCm[index].toFixed(1)} cm interiores</span>)}<p>La proporción visual fue estimada desde la imagen. Verifica las divisiones antes de fabricar.</p></section>}
        {deskModuleSummary && <section className="image-ratio-summary"><b>Módulo de cajones que se aplicará</b><span>Lado: {deskModuleSummary.drawerModuleSide === "left" ? "Izquierdo" : "Derecho"}</span><span>Ancho visual: {(deskModuleSummary.drawerModuleWidthRatio * 100).toFixed(1)} %</span><span>Ancho real aproximado: {deskModuleSummary.moduleWidthCm.toFixed(1)} cm</span><p>La posición y proporción se estimaron visualmente. Verifica las medidas antes de fabricar.</p></section>}
        {proposalErrors.map((message) => <p className="configuration-warning" key={message}>{message}</p>)}
        <div className="review-actions">{proposal.provider === "manual" && <button type="button" onClick={() => { setStatus("annotating"); setError(""); }}>Volver a editar marcas</button>}<button type="button" className="primary-action" disabled={status === "applying" || proposal.detectedType === "unknown" || proposalErrors.length > 0} onClick={apply}>Aplicar diseño</button></div>
      </>}
      {error && <p className="design-message design-message-error">{error}</p>}
    </section>
  </div>;
}
