import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useState } from "react";
import Wardrobe from "./components/Wardrobe";
import CutList from "./components/CutList";
import MaterialCost from "./components/MaterialCost";

export default function App() {


  // Medidas reales en centímetros
  const [widthCm, setWidthCm] = useState(180);
  const [heightCm, setHeightCm] = useState(220);
  const [depthCm, setDepthCm] = useState(60);


  // Conversión a unidades 3D
  const width = widthCm / 100;
  const height = heightCm / 100;
  const depth = depthCm / 100;


  // Configuración del mueble
  const [doors, setDoors] = useState(2);
  const [drawers, setDrawers] = useState(2);
  const [shelves, setShelves] = useState(3);



  return (

    <div
      style={{
        width:"100vw",
        height:"100vh",
        display:"flex"
      }}
    >


      {/* PANEL DE CONTROL */}
      <div
        style={{
          width:"260px",
          padding:"20px",
          background:"#eeeeee",
          fontFamily:"Arial"
        }}
      >

        <h2>
          MuebleCAD 🪵
        </h2>


        <p>Ancho (cm)</p>
        <input
          type="number"
          value={widthCm}
          onChange={(e)=>setWidthCm(Number(e.target.value))}
        />


        <p>Alto (cm)</p>
        <input
          type="number"
          value={heightCm}
          onChange={(e)=>setHeightCm(Number(e.target.value))}
        />


        <p>Fondo (cm)</p>
        <input
          type="number"
          value={depthCm}
          onChange={(e)=>setDepthCm(Number(e.target.value))}
        />


        <hr />


        <p>Puertas</p>
        <input
          type="number"
          min="1"
          value={doors}
          onChange={(e)=>setDoors(Number(e.target.value))}
        />


        <p>Cajones</p>
        <input
          type="number"
          min="0"
          value={drawers}
          onChange={(e)=>setDrawers(Number(e.target.value))}
        />


        <p>Repisas</p>
        <input
          type="number"
          min="0"
          value={shelves}
          onChange={(e)=>setShelves(Number(e.target.value))}
        />


        <hr />

        <h3>Medidas:</h3>

        <p>
          {widthCm} x {heightCm} x {depthCm} cm
        </p>

        <CutList
        widthCm={widthCm}
        heightCm={heightCm}
        depthCm={depthCm}
        doors={doors}
        shelves={shelves}
      />

      <MaterialCost
      widthCm={widthCm}
      heightCm={heightCm}
      depthCm={depthCm}
      doors={doors}
      shelves={shelves}
    />

      </div>




      {/* VISTA 3D */}
      <div style={{flex:1}}>


        <Canvas camera={{position:[5,4,5]}}>


          <ambientLight intensity={2}/>


          <directionalLight
            position={[5,5,5]}
            intensity={2}
          />



          <Wardrobe
            width={width}
            height={height}
            depth={depth}
            doors={doors}
            drawers={drawers}
            shelves={shelves}
          />



          <OrbitControls/>


        </Canvas>


      </div>


    </div>

  );
}