import { Canvas } from "@react-three/fiber";
import { Bounds, Grid, OrbitControls } from "@react-three/drei";
import { useEffect, useMemo, useState } from "react";
import Wardrobe from "./components/Wardrobe";
import WardrobeSettings from "./components/WardrobeSettings";
import Desk from "./components/Desk";
import TvStand from "./components/TvStand";
import Nightstand from "./components/Nightstand";
import CatHouse from "./components/CatHouse";
import CutList from "./components/CutList";
import CutOptimizer from "./components/CutOptimizer";
import ProductionPanel from "./components/ProductionPanel";
import MaterialSettings from "./components/MaterialSettings";
import DrawerSlideSettings from "./components/DrawerSlideSettings";
import DrawerFrontSettings from "./components/DrawerFrontSettings";
import NightstandStructureSettings from "./components/NightstandStructureSettings";
import DeskSettings from "./components/DeskSettings";
import HardwareSummary from "./components/HardwareSummary";
import TvStandSettings from "./components/TvStandSettings";
import OptimizerSettings from "./components/OptimizerSettings";
import ManufacturingStatus from "./components/ManufacturingStatus";
import DesignLibrary from "./components/DesignLibrary";
import FurnitureImageImporter from "./components/FurnitureImageImporter";
import FurnitureModelInspector from "./components/FurnitureModelInspector";
import { buildFurnitureModel, getHighlightedComponentIds, normalizeFurnitureComponentSelection } from "./utils/furnitureModel";
import { createMaterialConfig } from "./utils/materialConfig";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "./utils/drawerSlides";
import { DEFAULT_DRAWER_FRONT_CONFIG } from "./utils/drawerFront";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE, equalDrawerHeightRatios } from "./utils/nightstandStructure";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG } from "./utils/deskStructure";
import { getHardwareItems } from "./utils/hardware";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG } from "./utils/tvStandStructure";
import { DEFAULT_OPTIMIZER_SETTINGS } from "./utils/optimizer/optimizerConfig";
import { getCutPieces } from "./utils/cutPieces";
import { validateAllFurniturePieces } from "./utils/manufacturingValidation";
import { useAuth } from "./auth/useAuth";
import { calculateDeskDrawerCapacity, calculateNightstandDrawerCapacity, DESK_DRAWER_LIMITS, NIGHTSTAND_DRAWER_LIMITS } from "./utils/drawerLimits";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG, WARDROBE_LIMITS } from "./utils/wardrobeStructure";
import { createDesign, getDesign, updateDesign } from "./services/furnitureDesigns";
import { assertSupportedDesign, deserializeDesignConfig, serializeDesignConfig } from "./utils/designPersistence";
import { proposalToNormalizedConfig } from "./utils/imageFurnitureProposal";
import "./App.css";

const MODELS = {
  wardrobe: { label: "Ropero", dimensions: [250, 230, 60] },
  desk: { label: "Escritorio", dimensions: [140, 75, 60] },
  tvStand: { label: "Mueble TV", dimensions: [180, 55, 45] },
  nightstand: { label: "Mesa de noche", dimensions: [50, 55, 40] },
  catHouse: { label: "Casa para Gatos", dimensions: [40, 40, 40] },
};

export default function App() {
  const { user, logout } = useAuth();
  const [furnitureType, setFurnitureType] = useState("wardrobe");
  const [widthCm, setWidthCm] = useState(250);
  const [heightCm, setHeightCm] = useState(230);
  const [depthCm, setDepthCm] = useState(60);
  const [doors, setDoors] = useState(3);
  const [drawers, setDrawers] = useState(6);
  const [shelves, setShelves] = useState(3);
  const [activeModule, setActiveModule] = useState("design");
  const [materialConfigs, setMaterialConfigs] = useState(createMaterialConfig);
  const [drawerSlideConfig, setDrawerSlideConfig] = useState(DEFAULT_DRAWER_SLIDE_CONFIG);
  const [drawerFrontConfig, setDrawerFrontConfig] = useState(DEFAULT_DRAWER_FRONT_CONFIG);
  const [catHouseConfig, setCatHouseConfig] = useState({});
  const [nightstandStructureConfig, setNightstandStructureConfig] = useState(DEFAULT_NIGHTSTAND_STRUCTURE);
  const [deskConfig, setDeskConfig] = useState(DEFAULT_DESK_CONFIG);
  const [tvStandConfig, setTvStandConfig] = useState(DEFAULT_TV_STAND_CONFIG);
  const [wardrobeConfig, setWardrobeConfig] = useState(DEFAULT_WARDROBE_CONFIG);
  const [optimizerSettings, setOptimizerSettings] = useState(DEFAULT_OPTIMIZER_SETTINGS);
  const [edgeBanding, setEdgeBanding] = useState({});
  const [drawerAdjustmentMessage, setDrawerAdjustmentMessage] = useState("");
  const [currentDesign, setCurrentDesign] = useState(null);
  const [designName, setDesignName] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [designBusy, setDesignBusy] = useState(false);
  const [designMessage, setDesignMessage] = useState(null);
  const [libraryRefreshKey, setLibraryRefreshKey] = useState(0);
  const [imageImporterOpen, setImageImporterOpen] = useState(false);
  const [selectedFurnitureComponentId, setSelectedFurnitureComponentId] = useState(null);
  const isDesk = furnitureType === "desk";
  const isTvStand = furnitureType === "tvStand";
  const isNightstand = furnitureType === "nightstand";
  const isCatHouse = furnitureType === "catHouse";
  const isWardrobe = furnitureType === "wardrobe";
  const width = widthCm / 100;
  const height = heightCm / 100;
  const depth = depthCm / 100;
  const melamineThickness = materialConfigs.melamine.thicknessMm / 1000;
  const hardboardThickness = materialConfigs.hardboard.thicknessMm / 1000;
  const drawerCapacity = useMemo(() => isDesk
    ? calculateDeskDrawerCapacity({ heightCm, thicknessCm: melamineThickness * 100, deskConfig })
    : isNightstand
      ? calculateNightstandDrawerCapacity({ heightCm, thicknessCm: melamineThickness * 100, drawerFrontConfig, structureConfig: nightstandStructureConfig })
      : null,
  [isDesk, isNightstand, heightCm, melamineThickness, deskConfig, drawerFrontConfig, nightstandStructureConfig]);
  const drawerLimits = isDesk ? DESK_DRAWER_LIMITS : isNightstand ? NIGHTSTAND_DRAWER_LIMITS : null;
  useEffect(() => {
    if (!drawerLimits || !drawerCapacity || drawers <= drawerCapacity.maxAllowed || drawerCapacity.maxAllowed < drawerLimits.min) return;
    const previous = drawers;
    const timer = window.setTimeout(() => {
      setDrawers(drawerCapacity.maxAllowed);
      setDrawerAdjustmentMessage(`La nueva altura permite un máximo de ${drawerCapacity.maxAllowed} cajones. La cantidad fue ajustada de ${previous} a ${drawerCapacity.maxAllowed}.`);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [drawerCapacity, drawerLimits, drawers]);
  const drawerDimensions = useMemo(() => calculateDrawerSlideDimensions({
    furnitureType, widthCm, depthCm, drawers, thicknessCm: melamineThickness * 100, drawerSlideConfig, deskConfig, wardrobeConfig,
  }), [furnitureType, widthCm, depthCm, drawers, melamineThickness, drawerSlideConfig, deskConfig, wardrobeConfig]);
  const drawerValidationError = drawerDimensions.hasEnoughDepth ? "" : "No existe profundidad suficiente para instalar una corredera de este tamaño.";
  const nightstandStructure = useMemo(() => calculateNightstandStructure({
    widthCm, heightCm, depthCm, thicknessCm: melamineThickness * 100, drawers, drawerFrontConfig,
    structureConfig: nightstandStructureConfig,
  }), [widthCm, heightCm, depthCm, melamineThickness, drawers, drawerFrontConfig, nightstandStructureConfig]);
  const structureValidationError = isNightstand ? nightstandStructure.error : "";
  const deskStructure = useMemo(() => calculateDeskStructure({
    widthCm, heightCm, depthCm, thicknessCm: melamineThickness * 100, bottomThicknessCm: hardboardThickness * 100,
    drawers, drawerDimensions, deskConfig,
  }), [widthCm, heightCm, depthCm, melamineThickness, hardboardThickness, drawers, drawerDimensions, deskConfig]);
  const deskValidationError = isDesk ? deskStructure.error : "";
  const tvStandStructure = useMemo(() => calculateTvStandStructure({
    widthCm, heightCm, depthCm, thicknessCm: melamineThickness * 100, tvStandConfig,
  }), [widthCm, heightCm, depthCm, melamineThickness, tvStandConfig]);
  const tvStandValidationError = isTvStand ? tvStandStructure.error : "";
  const wardrobeStructure = useMemo(() => calculateWardrobeStructure({ widthCm, heightCm, depthCm, thicknessCm: melamineThickness * 100, bottomThicknessCm: hardboardThickness * 100, drawers, shelves, drawerDimensions, wardrobeConfig }), [widthCm, heightCm, depthCm, melamineThickness, hardboardThickness, drawers, shelves, drawerDimensions, wardrobeConfig]);
  const wardrobeValidationError = isWardrobe ? wardrobeStructure.error : "";
  const geometryValidationError = drawerValidationError || structureValidationError || deskValidationError || tvStandValidationError || wardrobeValidationError;
  const designInputs = { furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves, drawerSlideConfig, drawerFrontConfig, catHouseConfig, nightstandStructureConfig, deskConfig, tvStandConfig, wardrobeConfig, edgeBanding };
  const generatedPieces = getCutPieces({ ...designInputs, materialConfigs });
  const furnitureModel = useMemo(() => {
    try {
      const structure = isNightstand ? nightstandStructure : isDesk ? deskStructure : isTvStand ? tvStandStructure : isWardrobe ? wardrobeStructure : null;
      return { model: buildFurnitureModel({ furnitureType, widthCm, heightCm, depthCm, drawers, shelves, generatedPieces, structure }), error: null };
    } catch (error) { return { model: null, error: error.message || "FurnitureModel could not be built." }; }
  // generatedPieces is intentionally an input: the projection validates its current source IDs.
  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  }, [furnitureType, widthCm, heightCm, depthCm, drawers, shelves, generatedPieces, isNightstand, isDesk, isTvStand, isWardrobe, nightstandStructure, deskStructure, tvStandStructure, wardrobeStructure]);
  const highlightedComponentIds = useMemo(
    () => new Set(furnitureModel.model ? getHighlightedComponentIds(furnitureModel.model, selectedFurnitureComponentId) : []),
    [furnitureModel, selectedFurnitureComponentId],
  );
  useEffect(() => {
    if (!selectedFurnitureComponentId || normalizeFurnitureComponentSelection(furnitureModel.model, selectedFurnitureComponentId)) return;
    const timer = window.setTimeout(() => setSelectedFurnitureComponentId(null), 0);
    return () => window.clearTimeout(timer);
  }, [furnitureModel, selectedFurnitureComponentId]);
  const pieceValidation = validateAllFurniturePieces(generatedPieces, materialConfigs, optimizerSettings);
  const designValidationError = geometryValidationError || pieceValidation.error;
  const design = { ...designInputs, wardrobeMainDoorHeightsCm: wardrobeStructure.mainDoorHeightsCm, drawerValidationError, structureValidationError, deskValidationError, tvStandValidationError, wardrobeValidationError, pieceValidation, optimizerSettings, designValidationError };
  const hardwareItems = getHardwareItems(design);
  const updateType = (type) => {
    const [newWidth, newHeight, newDepth] = MODELS[type].dimensions;
    setFurnitureType(type);
    setWidthCm(newWidth);
    setHeightCm(newHeight);
    setDepthCm(newDepth);
    setDoors(type === "tvStand" ? 0 : type === "wardrobe" ? 3 : 2);
    setDrawers(type === "wardrobe" ? 6 : type === "desk" ? 3 : type === "catHouse" || type === "tvStand" ? 0 : 2);
    setShelves(type === "tvStand" ? 0 : 3);
    if (type === "desk") setDrawerSlideConfig((current) => ({ ...current, type: "telescopic", lengthMm: 350 }));
    setCurrentDesign(null);
    setDesignName("");
    setDesignMessage(null);
    setEdgeBanding({});
    if (type === "nightstand") setNightstandStructureConfig((current) => ({ ...current, drawerHeightRatios: equalDrawerHeightRatios(2) }));
  };
  const updateDimension = (setter, minimum = 1) => (event) => setter(Math.max(minimum, Number(event.target.value) || minimum));
  const updateDrawerCount = (event) => {
    const requested = Math.floor(Number(event.target.value));
    if (!drawerLimits || !Number.isFinite(requested)) return;
    const maximum = Math.max(drawerLimits.min, Math.min(drawerLimits.max, drawerCapacity?.maxAllowed ?? drawerLimits.max));
    const adjusted = Math.max(drawerLimits.min, Math.min(maximum, requested));
    setDrawers(adjusted);
    if (isNightstand && adjusted !== drawers) setNightstandStructureConfig((current) => ({ ...current, drawerHeightRatios: equalDrawerHeightRatios(adjusted) }));
    setDrawerAdjustmentMessage(requested === adjusted ? "" : `La cantidad permitida con la configuración actual es de ${drawerLimits.min} a ${maximum} cajones.`);
  };

  const configForPersistence = () => serializeDesignConfig({
    ...designInputs, materialConfigs, optimizerSettings,
  });

  const saveDesign = async (asNew = false) => {
    const name = designName.trim();
    if (!name) {
      setDesignMessage({ type: "error", text: "Escribe un nombre para guardar el diseño." });
      return;
    }
    setDesignBusy(true);
    setDesignMessage(null);
    try {
      const payload = { name, furnitureType, config: configForPersistence() };
      const saved = currentDesign && !asNew
        ? await updateDesign(currentDesign.id, payload)
        : await createDesign(payload);
      setCurrentDesign({ id: saved.id, name: saved.name });
      setDesignName(saved.name);
      setLibraryRefreshKey((value) => value + 1);
      setDesignMessage({ type: "success", text: currentDesign && !asNew ? "Cambios guardados." : "Diseño guardado." });
    } catch (reason) {
      console.error("No se pudo guardar el diseño:", reason);
      setDesignMessage({ type: "error", text: "No se pudo guardar el diseño." });
    } finally { setDesignBusy(false); }
  };

  const applyNormalizedConfiguration = (normalized) => {
    const { furnitureType: type, dimensions, quantities = {}, furniture = {}, materialThicknesses = {}, edgeBanding: restoredEdgeBanding = {}, useConstructiveDefaults = false } = normalized;
    setFurnitureType(type);
    setWidthCm(dimensions.widthCm);
    setHeightCm(dimensions.heightCm);
    setDepthCm(dimensions.depthCm);
    setDoors(quantities.doors ?? (type === "wardrobe" ? 3 : type === "tvStand" ? 0 : 2));
    setDrawers(quantities.drawers ?? (type === "wardrobe" ? 6 : 0));
    setShelves(quantities.shelves ?? (type === "wardrobe" ? 3 : 0));
    setDrawerSlideConfig({ ...DEFAULT_DRAWER_SLIDE_CONFIG, ...(useConstructiveDefaults ? {} : furniture.drawerSlideConfig) });
    setDrawerFrontConfig({ ...DEFAULT_DRAWER_FRONT_CONFIG, ...(useConstructiveDefaults ? {} : furniture.drawerFrontConfig) });
    setCatHouseConfig({});
    setNightstandStructureConfig({ ...DEFAULT_NIGHTSTAND_STRUCTURE, ...(useConstructiveDefaults ? {} : furniture.nightstandStructureConfig), ...(furniture.nightstandStructureConfig?.drawerHeightRatios ? { drawerHeightRatios: furniture.nightstandStructureConfig.drawerHeightRatios } : {}) });
    setDeskConfig({ ...DEFAULT_DESK_CONFIG, ...furniture.deskConfig });
    setTvStandConfig({ ...DEFAULT_TV_STAND_CONFIG, ...furniture.tvStandConfig });
    setWardrobeConfig({ ...DEFAULT_WARDROBE_CONFIG, ...furniture.wardrobeConfig });
    setEdgeBanding(restoredEdgeBanding);
    setMaterialConfigs((current) => ({
      melamine: { ...current.melamine, ...(materialThicknesses.melamine === undefined ? {} : { thicknessMm: materialThicknesses.melamine }) },
      hardboard: { ...current.hardboard, ...(materialThicknesses.hardboard === undefined ? {} : { thicknessMm: materialThicknesses.hardboard }) },
    }));
    setActiveModule("design");
  };

  const validateConstructiveProposal = (proposal) => {
    try {
      const normalized = proposalToNormalizedConfig(proposal);
      const candidate = {
        furnitureType: normalized.furnitureType,
        ...normalized.dimensions,
        doors: normalized.quantities.doors ?? (normalized.furnitureType === "wardrobe" ? 3 : 0),
        drawers: normalized.quantities.drawers ?? 0,
        shelves: normalized.quantities.shelves ?? 0,
        drawerSlideConfig: DEFAULT_DRAWER_SLIDE_CONFIG,
        drawerFrontConfig: DEFAULT_DRAWER_FRONT_CONFIG,
        nightstandStructureConfig: { ...DEFAULT_NIGHTSTAND_STRUCTURE, ...normalized.furniture.nightstandStructureConfig },
        deskConfig: { ...DEFAULT_DESK_CONFIG, ...normalized.furniture.deskConfig },
        tvStandConfig: { ...DEFAULT_TV_STAND_CONFIG, ...normalized.furniture.tvStandConfig },
        wardrobeConfig: { ...DEFAULT_WARDROBE_CONFIG, ...normalized.furniture.wardrobeConfig },
        materialConfigs,
      };
      const thicknessCm = materialConfigs.melamine.thicknessMm / 10;
      const bottomThicknessCm = materialConfigs.hardboard.thicknessMm / 10;
      const candidateDrawerDimensions = calculateDrawerSlideDimensions({ ...candidate, thicknessCm });
      let geometryError = candidateDrawerDimensions.hasEnoughDepth ? "" : "No existe profundidad suficiente para instalar la corredera seleccionada.";
      if (!geometryError && candidate.furnitureType === "nightstand") geometryError = calculateNightstandStructure({ ...candidate, thicknessCm, drawerFrontConfig: DEFAULT_DRAWER_FRONT_CONFIG, structureConfig: candidate.nightstandStructureConfig }).error;
      if (!geometryError && candidate.furnitureType === "desk") geometryError = calculateDeskStructure({ ...candidate, thicknessCm, bottomThicknessCm, drawerDimensions: candidateDrawerDimensions, deskConfig: DEFAULT_DESK_CONFIG }).error;
      if (!geometryError && candidate.furnitureType === "tvStand") geometryError = calculateTvStandStructure({ ...candidate, thicknessCm, tvStandConfig: DEFAULT_TV_STAND_CONFIG }).error;
      if (!geometryError && candidate.furnitureType === "wardrobe") geometryError = calculateWardrobeStructure({ ...candidate, thicknessCm, bottomThicknessCm, drawerDimensions: candidateDrawerDimensions, wardrobeConfig: candidate.wardrobeConfig }).error;
      if (geometryError) return [geometryError];
      const validation = validateAllFurniturePieces(getCutPieces(candidate), materialConfigs, optimizerSettings);
      return validation.error ? [validation.error] : [];
    } catch (reason) { return [reason.message]; }
  };

  const applyImageDesign = (normalized) => {
    applyNormalizedConfiguration(normalized);
    setCurrentDesign(null);
    setDesignName("");
    setImageImporterOpen(false);
    setDesignMessage({ type: "success", text: "Propuesta aplicada. Revisa el modelo y guárdalo cuando esté listo." });
  };

  const loadDesign = async (id) => {
    setDesignBusy(true);
    setDesignMessage(null);
    try {
      const saved = assertSupportedDesign(await getDesign(id));
      if (!MODELS[saved.furniture_type]) throw new Error(`Tipo de mueble desconocido: ${saved.furniture_type}.`);
      applyNormalizedConfiguration({ furnitureType: saved.furniture_type, ...deserializeDesignConfig(saved.furniture_type, saved.config) });
      setCurrentDesign({ id: saved.id, name: saved.name });
      setDesignName(saved.name);
      setActiveModule("design");
      setLibraryOpen(false);
      setDesignMessage({ type: "success", text: `Diseño “${saved.name}” abierto.` });
    } catch (reason) {
      console.error("No se pudo abrir el diseño:", reason);
      setDesignMessage({ type: "error", text: reason.message || "No se pudo abrir el diseño." });
    } finally { setDesignBusy(false); }
  };

  return <main className="app-shell">
    <aside className="control-panel">
      <div className="app-heading">
        <div><h1>MuebleCAD</h1><p className="session-user" title={user?.email}>Sesión: {user?.email}</p></div>
        <button type="button" className="logout-button" onClick={logout}>Cerrar sesión</button>
      </div>
      <p className="subtitle">Diseño y presupuesto para carpintería</p>
      <button type="button" className="image-import-launch" onClick={() => setImageImporterOpen(true)}>Crear desde imagen</button>
      <FurnitureImageImporter open={imageImporterOpen} onCancel={() => setImageImporterOpen(false)} onApply={applyImageDesign} validateConstructiveProposal={validateConstructiveProposal} melamineThicknessMm={materialConfigs.melamine.thicknessMm} />
      <section className="design-actions" aria-label="Persistencia de diseños">
        <label>Nombre del diseño<input type="text" maxLength="160" placeholder={`${MODELS[furnitureType].label} sin nombre`} value={designName} onChange={(event) => setDesignName(event.target.value)} /></label>
        <div>
          <button type="button" className="primary-action" disabled={designBusy} onClick={() => saveDesign(false)}>{currentDesign ? "Guardar cambios" : "Guardar diseño"}</button>
          {currentDesign && <button type="button" disabled={designBusy} onClick={() => saveDesign(true)}>Guardar como nuevo</button>}
          <button type="button" disabled={designBusy} onClick={() => setLibraryOpen((value) => !value)}>Mis diseños</button>
        </div>
        {designMessage && <p className={`design-message design-message-${designMessage.type}`}>{designMessage.text}</p>}
      </section>
      <DesignLibrary open={libraryOpen} onClose={() => setLibraryOpen(false)} onLoad={loadDesign} currentDesignId={currentDesign?.id} refreshKey={libraryRefreshKey} onDeleted={(id) => {
        if (currentDesign?.id === id) { setCurrentDesign(null); setDesignName(""); }
      }} onRenamed={(renamed) => {
        if (currentDesign?.id === renamed.id) {
          setCurrentDesign({ id: renamed.id, name: renamed.name });
          setDesignName(renamed.name);
        }
      }} />
      <div className="module-tabs">
        <button type="button" className={activeModule === "design" ? "active" : ""} onClick={() => setActiveModule("design")}>Diseño</button>
        <button type="button" className={activeModule === "production" ? "active" : ""} onClick={() => setActiveModule("production")}>Producción</button>
      </div>
      <label>Tipo de mueble<select value={furnitureType} onChange={(event) => updateType(event.target.value)}>{Object.entries(MODELS).map(([value, model]) => <option key={value} value={value}>{model.label}</option>)}</select></label>
      <div className="field-grid">
        <label>Ancho (cm)<input type="number" min="1" value={widthCm} onChange={updateDimension(setWidthCm)} /></label>
        <label>Alto (cm)<input type="number" min="1" value={heightCm} onChange={updateDimension(setHeightCm)} /></label>
        <label>Fondo (cm)<input type="number" min="1" value={depthCm} onChange={updateDimension(setDepthCm)} /></label>
      </div>
      <section className="configuration">
        <h2>Configuración</h2>
        {isCatHouse || isTvStand ? <p className="configuration-note">Estructura abierta sin puertas ni cajones.</p> : isDesk || isNightstand ? <>
          <label>Cajones<input type="number" min={drawerLimits.min} max={Math.max(drawerLimits.min, drawerCapacity?.maxAllowed ?? drawerLimits.max)} value={drawers} onChange={updateDrawerCount} /></label>
          {drawerAdjustmentMessage && <p className="configuration-warning">{drawerAdjustmentMessage}</p>}
          {drawerCapacity && drawerCapacity.maxAllowed >= drawerLimits.min && <p className="configuration-note">Máximo permitido con la altura actual: {drawerCapacity.maxAllowed} cajones.</p>}
        </> : <>
          <p className="configuration-note">Tres puertas y seis cajones fijos: tres en Cuerpo 1 y tres en Cuerpo 3.</p>
          <label>Repisas para zapatos<input type="number" min={WARDROBE_LIMITS.shoeShelves.min} max={WARDROBE_LIMITS.shoeShelves.max} value={shelves} onChange={(event) => setShelves(Math.max(WARDROBE_LIMITS.shoeShelves.min, Math.min(WARDROBE_LIMITS.shoeShelves.max, Math.floor(Number(event.target.value) || WARDROBE_LIMITS.shoeShelves.min))))} /></label>
        </>}
      </section>
      {!isCatHouse && <>
        {isNightstand && <NightstandStructureSettings config={nightstandStructureConfig} onChange={setNightstandStructureConfig} structure={nightstandStructure} />}
        {isDesk && <DeskSettings config={deskConfig} onChange={setDeskConfig} structure={deskStructure} />}
        {isTvStand && <TvStandSettings config={tvStandConfig} onChange={setTvStandConfig} structure={tvStandStructure} />}
        {isWardrobe && <WardrobeSettings config={wardrobeConfig} onChange={setWardrobeConfig} structure={wardrobeStructure} />}
        {!isTvStand && <DrawerSlideSettings config={drawerSlideConfig} onChange={setDrawerSlideConfig} dimensions={drawerDimensions} disabled={!drawers} forceTelescopic={isDesk || isWardrobe} />}
        {!isDesk && !isTvStand && <DrawerFrontSettings config={drawerFrontConfig} onChange={setDrawerFrontConfig} disabled={!drawers} boxWidthCm={isWardrobe ? wardrobeStructure.drawerBoxWidthsCm[0] : drawerDimensions.externalWidthCm} frontWidthCm={isNightstand ? widthCm : isWardrobe ? wardrobeStructure.sectionWidthsCm[0] : undefined} forceOverlay={isNightstand || isWardrobe} />}
      </>}
      {activeModule === "design" && <>
        <MaterialSettings configs={materialConfigs} onChange={setMaterialConfigs} />
        <OptimizerSettings settings={optimizerSettings} onChange={setOptimizerSettings} />
        <ManufacturingStatus error={designValidationError} warnings={drawerAdjustmentMessage ? [drawerAdjustmentMessage] : []} />
        <HardwareSummary items={hardwareItems} />
        <CutList {...design} materialConfigs={materialConfigs} onEdgeBandingChange={(pieceIds, next) => setEdgeBanding((current) => {
          const updated = { ...current };
          pieceIds.forEach((id) => { updated[id] = next; });
          return updated;
        })} />
        <CutOptimizer {...design} materialConfigs={materialConfigs} optimizerSettings={optimizerSettings} />
        {import.meta.env.DEV && (furnitureModel.model ? <FurnitureModelInspector model={furnitureModel.model} generatedPieces={generatedPieces} selectedId={selectedFurnitureComponentId} onSelectComponent={setSelectedFurnitureComponentId} /> : <details className="furniture-model-inspector"><summary>FurnitureModel Inspector · Error</summary><p>{furnitureModel.error}</p></details>)}
      </>}
    </aside>
    {activeModule === "production" ? <ProductionPanel design={design} materialConfigs={materialConfigs} setMaterialConfigs={setMaterialConfigs} optimizerSettings={optimizerSettings} setOptimizerSettings={setOptimizerSettings} /> : <section className="viewport">
      <Canvas camera={{ position: [3.8, 2.8, 4.2], fov: 45 }} shadows>
        <color attach="background" args={["#f5f1eb"]} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
        <Bounds fit clip observe margin={1.12}>
          {isCatHouse ? <CatHouse width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} manufacturingPieces={generatedPieces} highlightedComponentIds={highlightedComponentIds} /> : isDesk ? <Desk width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} structure={deskStructure} manufacturingPieces={generatedPieces} highlightedComponentIds={highlightedComponentIds} /> : isTvStand ? <TvStand width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} structure={tvStandStructure} manufacturingPieces={generatedPieces} highlightedComponentIds={highlightedComponentIds} /> : isNightstand ? <Nightstand width={width} height={height} depth={depth} drawers={drawers} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} drawerFrontConfig={drawerFrontConfig} structure={nightstandStructure} manufacturingPieces={generatedPieces} highlightedComponentIds={highlightedComponentIds} /> : <Wardrobe width={width} height={height} depth={depth} drawers={drawers} shelves={shelves} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} drawerFrontConfig={drawerFrontConfig} structure={wardrobeStructure} manufacturingPieces={generatedPieces} highlightedComponentIds={highlightedComponentIds} />}
        </Bounds>
        <Grid args={[10, 10]} cellSize={0.25} cellThickness={0.6} cellColor="#c7bdb0" sectionSize={1} sectionColor="#a99b8a" fadeDistance={8} />
        <OrbitControls makeDefault minDistance={2} maxDistance={10} />
      </Canvas>
    </section>}
  </main>;
}
