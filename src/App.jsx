import { Canvas } from "@react-three/fiber";
import { Bounds, Grid, OrbitControls } from "@react-three/drei";
import { useMemo, useState } from "react";
import Wardrobe from "./components/Wardrobe";
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
import { createMaterialConfig } from "./utils/materialConfig";
import { calculateDrawerSlideDimensions, DEFAULT_DRAWER_SLIDE_CONFIG } from "./utils/drawerSlides";
import { DEFAULT_DRAWER_FRONT_CONFIG } from "./utils/drawerFront";
import { calculateNightstandStructure, DEFAULT_NIGHTSTAND_STRUCTURE } from "./utils/nightstandStructure";
import { calculateDeskStructure, DEFAULT_DESK_CONFIG } from "./utils/deskStructure";
import { getHardwareItems } from "./utils/hardware";
import { calculateTvStandStructure, DEFAULT_TV_STAND_CONFIG } from "./utils/tvStandStructure";
import "./App.css";

const MODELS = {
  wardrobe: { label: "Ropero", dimensions: [180, 220, 60] },
  desk: { label: "Escritorio", dimensions: [140, 75, 60] },
  tvStand: { label: "Mueble TV", dimensions: [180, 55, 45] },
  nightstand: { label: "Mesa de noche", dimensions: [50, 55, 40] },
  catHouse: { label: "Casa para Gatos", dimensions: [40, 40, 40] },
};

export default function App() {
  const [furnitureType, setFurnitureType] = useState("wardrobe");
  const [widthCm, setWidthCm] = useState(180);
  const [heightCm, setHeightCm] = useState(220);
  const [depthCm, setDepthCm] = useState(60);
  const [doors, setDoors] = useState(2);
  const [drawers, setDrawers] = useState(2);
  const [shelves, setShelves] = useState(3);
  const [activeModule, setActiveModule] = useState("design");
  const [materialConfigs, setMaterialConfigs] = useState(createMaterialConfig);
  const [drawerSlideConfig, setDrawerSlideConfig] = useState(DEFAULT_DRAWER_SLIDE_CONFIG);
  const [drawerFrontConfig, setDrawerFrontConfig] = useState(DEFAULT_DRAWER_FRONT_CONFIG);
  const [catHouseConfig, setCatHouseConfig] = useState({ entryType: "none", entryDiameterCm: 22, entryWidthCm: 22, entryHeightCm: 22, color: "#8b5a2b" });
  const [nightstandStructureConfig, setNightstandStructureConfig] = useState(DEFAULT_NIGHTSTAND_STRUCTURE);
  const [deskConfig, setDeskConfig] = useState(DEFAULT_DESK_CONFIG);
  const [tvStandConfig, setTvStandConfig] = useState(DEFAULT_TV_STAND_CONFIG);
  const isDesk = furnitureType === "desk";
  const isTvStand = furnitureType === "tvStand";
  const isNightstand = furnitureType === "nightstand";
  const isCatHouse = furnitureType === "catHouse";
  const width = widthCm / 100;
  const height = heightCm / 100;
  const depth = depthCm / 100;
  const melamineThickness = materialConfigs.melamine.thicknessMm / 1000;
  const hardboardThickness = materialConfigs.hardboard.thicknessMm / 1000;
  const drawerDimensions = useMemo(() => calculateDrawerSlideDimensions({
    furnitureType, widthCm, depthCm, drawers, thicknessCm: melamineThickness * 100, drawerSlideConfig, deskConfig,
  }), [furnitureType, widthCm, depthCm, drawers, melamineThickness, drawerSlideConfig, deskConfig]);
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
  const designValidationError = drawerValidationError || structureValidationError || deskValidationError || tvStandValidationError;
  const design = { furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves, drawerSlideConfig, drawerFrontConfig, catHouseConfig, nightstandStructureConfig, deskConfig, tvStandConfig, drawerValidationError, structureValidationError, deskValidationError, tvStandValidationError, designValidationError };
  const hardwareItems = getHardwareItems(design);
  const updateType = (type) => {
    const [newWidth, newHeight, newDepth] = MODELS[type].dimensions;
    setFurnitureType(type);
    setWidthCm(newWidth);
    setHeightCm(newHeight);
    setDepthCm(newDepth);
    setDoors(type === "tvStand" ? 0 : 2);
    setDrawers(type === "desk" ? 3 : type === "catHouse" || type === "tvStand" ? 0 : 2);
    setShelves(type === "tvStand" ? 0 : 3);
    if (type === "desk") setDrawerSlideConfig((current) => ({ ...current, type: "telescopic", lengthMm: 350 }));
  };
  const updateDimension = (setter, minimum = 1) => (event) => setter(Math.max(minimum, Number(event.target.value) || minimum));

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
          <label>Cajones<input type="number" min="0" max="6" value={drawers} onChange={updateDimension(setDrawers, 0)} /></label>
        </> : <>
          <label>Puertas<input type="number" min="1" max="6" value={doors} onChange={updateDimension(setDoors)} /></label>
          <label>Cajones<input type="number" min="0" max="6" value={drawers} onChange={updateDimension(setDrawers, 0)} /></label>
          <label>Repisas<input type="number" min="0" max="10" value={shelves} onChange={updateDimension(setShelves, 0)} /></label>
        </>}
      </section>
      {isCatHouse ? <CatHouseSettings config={catHouseConfig} onChange={setCatHouseConfig} thicknessMm={materialConfigs.melamine.thicknessMm} /> : <>
        {isNightstand && <NightstandStructureSettings config={nightstandStructureConfig} onChange={setNightstandStructureConfig} structure={nightstandStructure} />}
        {isDesk && <DeskSettings config={deskConfig} onChange={setDeskConfig} structure={deskStructure} />}
        {isTvStand && <TvStandSettings config={tvStandConfig} onChange={setTvStandConfig} structure={tvStandStructure} />}
        {!isTvStand && <DrawerSlideSettings config={drawerSlideConfig} onChange={setDrawerSlideConfig} dimensions={drawerDimensions} disabled={!drawers} forceTelescopic={isDesk} />}
        {!isDesk && !isTvStand && <DrawerFrontSettings config={drawerFrontConfig} onChange={setDrawerFrontConfig} disabled={!drawers} boxWidthCm={drawerDimensions.externalWidthCm} frontWidthCm={isNightstand ? widthCm : undefined} forceOverlay={isNightstand} />}
      </>}
      {activeModule === "design" && <>
        <MaterialSettings configs={materialConfigs} onChange={setMaterialConfigs} />
        <HardwareSummary items={hardwareItems} />
        <CutList {...design} materialConfigs={materialConfigs} />
        <CutOptimizer {...design} materialConfigs={materialConfigs} />
      </>}
    </aside>
    {activeModule === "production" ? <ProductionPanel design={design} materialConfigs={materialConfigs} setMaterialConfigs={setMaterialConfigs} /> : <section className="viewport">
      <Canvas camera={{ position: [3.8, 2.8, 4.2], fov: 45 }} shadows>
        <color attach="background" args={["#f5f1eb"]} />
        <ambientLight intensity={1.4} />
        <directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
        <Bounds fit clip observe margin={1.12}>
          {isCatHouse ? <CatHouse width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} color={catHouseConfig.color} entry={{ type: catHouseConfig.entryType, diameter: catHouseConfig.entryDiameterCm / 100, width: catHouseConfig.entryWidthCm / 100, height: catHouseConfig.entryHeightCm / 100 }} /> : isDesk ? <Desk width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} structure={deskStructure} /> : isTvStand ? <TvStand width={width} height={height} depth={depth} thickness={melamineThickness} backThickness={hardboardThickness} structure={tvStandStructure} /> : isNightstand ? <Nightstand width={width} height={height} depth={depth} drawers={drawers} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} drawerFrontConfig={drawerFrontConfig} structure={nightstandStructure} /> : <Wardrobe width={width} height={height} depth={depth} doors={doors} drawers={drawers} shelves={shelves} thickness={melamineThickness} backThickness={hardboardThickness} drawerDimensions={drawerDimensions} drawerFrontConfig={drawerFrontConfig} />}
        </Bounds>
        <Grid args={[10, 10]} cellSize={0.25} cellThickness={0.6} cellColor="#c7bdb0" sectionSize={1} sectionColor="#a99b8a" fadeDistance={8} />
        <OrbitControls makeDefault minDistance={2} maxDistance={10} />
      </Canvas>
    </section>}
  </main>;
}
