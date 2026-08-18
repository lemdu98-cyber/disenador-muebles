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
import CatHouseSettings from "./components/CatHouseSettings";
import NightstandStructureSettings from "./components/NightstandStructureSettings";
import DeskSettings from "./components/DeskSettings";
import HardwareSummary from "./components/HardwareSummary";
import TvStandSettings from "./components/TvStandSettings";
import OptimizerSettings from "./components/OptimizerSettings";
import ManufacturingStatus from "./components/ManufacturingStatus";
import { createMaterialConfig } from "./utils/materialConfig";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "./utils/drawerSlides";
import { DEFAULT_DRAWER_FRONT_CONFIG } from "./utils/drawerFront";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE } from "./utils/nightstandStructure";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG } from "./utils/deskStructure";
import { getHardwareItems } from "./utils/hardware";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG } from "./utils/tvStandStructure";
import { DEFAULT_OPTIMIZER_SETTINGS } from "./utils/optimizer/optimizerConfig";
import { getCutPieces } from "./utils/cutPieces";
import { validateAllFurniturePieces } from "./utils/manufacturingValidation";
import { calculateDeskDrawerCapacity, calculateNightstandDrawerCapacity, DESK_DRAWER_LIMITS, NIGHTSTAND_DRAWER_LIMITS } from "./utils/drawerLimits";
import { calculateWardrobeStructure, DEFAULT_WARDROBE_CONFIG, WARDROBE_LIMITS } from "./utils/wardrobeStructure";
import "./App.css";

const MODELS = {
  wardrobe: { label: "Ropero", dimensions: [250, 230, 60] },
  desk: { label: "Escritorio", dimensions: [140, 75, 60] },
  tvStand: { label: "Mueble TV", dimensions: [180, 55, 45] },
  nightstand: { label: "Mesa de noche", dimensions: [50, 55, 40] },
  catHouse: { label: "Casa para Gatos", dimensions: [40, 40, 40] },
};

export default function App() {
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
  const [catHouseConfig, setCatHouseConfig] = useState({ entryType: "none", entryDiameterCm: 22, entryWidthCm: 22, entryHeightCm: 22, color: "#8b5a2b" });
  const [nightstandStructureConfig, setNightstandStructureConfig] = useState(DEFAULT_NIGHTSTAND_STRUCTURE);
  const [deskConfig, setDeskConfig] = useState(DEFAULT_DESK_CONFIG);
  const [tvStandConfig, setTvStandConfig] = useState(DEFAULT_TV_STAND_CONFIG);
  const [wardrobeConfig, setWardrobeConfig] = useState(DEFAULT_WARDROBE_CONFIG);
  const [optimizerSettings, setOptimizerSettings] = useState(DEFAULT_OPTIMIZER_SETTINGS);
  const [drawerAdjustmentMessage, setDrawerAdjustmentMessage] = useState("");
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
  const designInputs = { furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves, drawerSlideConfig, drawerFrontConfig, catHouseConfig, nightstandStructureConfig, deskConfig, tvStandConfig, wardrobeConfig };
  const generatedPieces = getCutPieces({ ...designInputs, materialConfigs });
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
  };
  const updateDimension = (setter, minimum = 1) => (event) => setter(Math.max(minimum, Number(event.target.value) || minimum));
  const updateDrawerCount = (event) => {
    const requested = Math.floor(Number(event.target.value));
    if (!drawerLimits || !Number.isFinite(requested)) return;
    const maximum = Math.max(drawerLimits.min, Math.min(drawerLimits.max, drawerCapacity?.maxAllowed ?? drawerLimits.max));
    const adjusted = Math.max(drawerLimits.min, Math.min(maximum, requested));
    setDrawers(adjusted);
    setDrawerAdjustmentMessage(requested === adjusted ? "" : `La cantidad permitida con la configuración actual es de ${drawerLimits.min} a ${maximum} cajones.`);
  };

  return <main className="app-shell">
    <aside className="control-panel">
      <h1>MuebleCAD</h1>
      <p className="subtitle">Diseño y presupuesto para carpintería</p>
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
      {isCatHouse ? <CatHouseSettings config={catHouseConfig} onChange={setCatHouseConfig} thicknessMm={materialConfigs.melamine.thicknessMm} /> : <>
        {isNightstand && <NightstandStructureSettings config={nightstandStructureConfig} onChange={setNightstandStructureConfig} structure={nightstandStructure} />}
        {isDesk && <DeskSettings config={deskConfig} onChange={setDeskConfig} structure={deskStructure} />}
        {isTvStand && <TvStandSettings config={tvStandConfig} onChange={setTvStandConfig} structure={tvStandStructure} />}
        {isWardrobe && <WardrobeSettings config={wardrobeConfig} onChange={setWardrobeConfig} structure={wardrobeStructure} />}
        {!isTvStand && <DrawerSlideSettings config={drawerSlideConfig} onChange={setDrawerSlideConfig} dimensions={drawerDimensions} disabled={!drawers} forceTelescopic={isDesk || isWardrobe} />}
        {!isDesk && !isTvStand && <DrawerFrontSettings config={drawerFrontConfig} onChange={setDrawerFrontConfig} disabled={!drawers} boxWidthCm={drawerDimensions.externalWidthCm} frontWidthCm={isNightstand ? widthCm : isWardrobe ? wardrobeStructure.openingWidthCm : undefined} forceOverlay={isNightstand || isWardrobe} />}
      </>}
      {activeModule === "design" && <>
        <MaterialSettings configs={materialConfigs} onChange={setMaterialConfigs} />
        <OptimizerSettings settings={optimizerSettings} onChange={setOptimizerSettings} />
        <ManufacturingStatus error={designValidationError} warnings={drawerAdjustmentMessage ? [drawerAdjustmentMessage] : []} />
        <HardwareSummary items={hardwareItems} />
        <CutList {...design} materialConfigs={materialConfigs} />
        <CutOptimizer {...design} materialConfigs={materialConfigs} optimizerSettings={optimizerSettings} />
      </>}
    </aside>
    {activeModule === "production" ? <ProductionPanel design={design} materialConfigs={materialConfigs} setMaterialConfigs={setMaterialConfigs} optimizerSettings={optimizerSettings} setOptimizerSettings={setOptimizerSettings} /> : <section className="viewport">
      <Canvas camera={{ position: [3.8, 2.8, 4.2], fov: 45 }} shadows>
        <color attach="background" args={["#f5f1eb"]} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
        <Bounds fit clip observe margin={1.12}>
          {isCatHouse ? <CatHouse width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} color={catHouseConfig.color} entry={{ type: catHouseConfig.entryType, diameter: catHouseConfig.entryDiameterCm / 100, width: catHouseConfig.entryWidthCm / 100, height: catHouseConfig.entryHeightCm / 100 }} /> : isDesk ? <Desk width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} structure={deskStructure} /> : isTvStand ? <TvStand width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} structure={tvStandStructure} /> : isNightstand ? <Nightstand width={width} height={height} depth={depth} drawers={drawers} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} drawerFrontConfig={drawerFrontConfig} structure={nightstandStructure} /> : <Wardrobe width={width} height={height} depth={depth} drawers={drawers} shelves={shelves} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} drawerFrontConfig={drawerFrontConfig} structure={wardrobeStructure} />}
        </Bounds>
        <Grid args={[10, 10]} cellSize={0.25} cellThickness={0.6} cellColor="#c7bdb0" sectionSize={1} sectionColor="#a99b8a" fadeDistance={8} />
        <OrbitControls makeDefault minDistance={2} maxDistance={10} />
      </Canvas>
    </section>}
  </main>;
}
