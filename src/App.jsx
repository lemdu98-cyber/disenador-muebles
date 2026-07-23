import { Canvas } from "@react-three/fiber";
import { Bounds, Grid, OrbitControls } from "@react-three/drei";
import { useState } from "react";
import Wardrobe from "./components/Wardrobe";
import Desk from "./components/Desk";
import TvStand from "./components/TvStand";
import Nightstand from "./components/Nightstand";
import CutList from "./components/CutList";
import MaterialCost from "./components/MaterialCost";
import "./App.css";

const MODELS = { wardrobe: { label: "Ropero", dimensions: [180, 220, 60] }, desk: { label: "Escritorio", dimensions: [140, 75, 60] }, tvStand: { label: "Mueble TV", dimensions: [180, 55, 45] }, nightstand: { label: "Mesa de noche", dimensions: [50, 55, 40] } };

export default function App() {
  const [furnitureType, setFurnitureType] = useState("wardrobe");
  const [widthCm, setWidthCm] = useState(180);
  const [heightCm, setHeightCm] = useState(220);
  const [depthCm, setDepthCm] = useState(60);
  const [doors, setDoors] = useState(2);
  const [drawers, setDrawers] = useState(2);
  const [shelves, setShelves] = useState(3);
  const isDesk = furnitureType === "desk";
  const isTvStand = furnitureType === "tvStand";
  const isNightstand = furnitureType === "nightstand";
  const width = widthCm / 100;
  const height = heightCm / 100;
  const depth = depthCm / 100;

  const updateType = (type) => {
    const [newWidth, newHeight, newDepth] = MODELS[type].dimensions;
    setFurnitureType(type); setWidthCm(newWidth); setHeightCm(newHeight); setDepthCm(newDepth);
    setDoors(2); setDrawers(type === "desk" ? 3 : type === "nightstand" ? 2 : 2); setShelves(type === "tvStand" ? 0 : 3);
  };
  const updateDimension = (setter, minimum = 1) => (event) => setter(Math.max(minimum, Number(event.target.value) || minimum));

  return <main className="app-shell">
    <aside className="control-panel">
      <h1>MuebleCAD</h1><p className="subtitle">Diseño y presupuesto para carpintería</p>
      <label>Tipo de mueble<select value={furnitureType} onChange={(event) => updateType(event.target.value)}>{Object.entries(MODELS).map(([value, model]) => <option key={value} value={value}>{model.label}</option>)}</select></label>
      <div className="field-grid">
        <label>Ancho (cm)<input type="number" min="1" value={widthCm} onChange={updateDimension(setWidthCm)} /></label>
        <label>Alto (cm)<input type="number" min="1" value={heightCm} onChange={updateDimension(setHeightCm)} /></label>
        <label>Fondo (cm)<input type="number" min="1" value={depthCm} onChange={updateDimension(setDepthCm)} /></label>
      </div>
      <section className="configuration"><h2>Configuración</h2>
        {isDesk || isNightstand ? <label>Cajones<input type="number" min="0" max="6" value={drawers} onChange={updateDimension(setDrawers, 0)} /></label> : <>
          <label>Puertas<input type="number" min="1" max={isTvStand ? "2" : "6"} value={doors} onChange={updateDimension(setDoors)} /></label>
          <label>Cajones<input type="number" min="0" max="6" value={drawers} onChange={updateDimension(setDrawers, 0)} /></label>
          <label>{isTvStand ? "Repisas del nicho" : "Repisas"}<input type="number" min="0" max="10" value={shelves} onChange={updateDimension(setShelves, 0)} /></label>
        </>}
      </section>
      <CutList furnitureType={furnitureType} widthCm={widthCm} heightCm={heightCm} depthCm={depthCm} doors={doors} drawers={drawers} shelves={shelves} />
      <MaterialCost furnitureType={furnitureType} widthCm={widthCm} heightCm={heightCm} depthCm={depthCm} doors={doors} drawers={drawers} shelves={shelves} />
    </aside>
    <section className="viewport"><Canvas camera={{ position: [3.8, 2.8, 4.2], fov: 45 }} shadows>
      <color attach="background" args={["#f5f1eb"]} /><ambientLight intensity={1.4} /><directionalLight position={[4, 6, 4]} intensity={2.2} castShadow />
      <Bounds fit clip observe margin={1.12}>
        {isDesk ? <Desk width={width} height={height} depth={depth} drawers={drawers} /> : isTvStand ? <TvStand width={width} height={height} depth={depth} doors={doors} drawers={drawers} shelves={shelves} /> : isNightstand ? <Nightstand width={width} height={height} depth={depth} drawers={drawers} /> : <Wardrobe width={width} height={height} depth={depth} doors={doors} drawers={drawers} shelves={shelves} />}
      </Bounds>
      <Grid args={[10, 10]} cellSize={0.25} cellThickness={0.6} cellColor="#c7bdb0" sectionSize={1} sectionColor="#a99b8a" fadeDistance={8} /><OrbitControls makeDefault minDistance={2} maxDistance={10} />
    </Canvas></section>
  </main>;
}
