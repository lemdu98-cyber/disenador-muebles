import { calculateBackPanelDimensions } from "../utils/backPanel";
import Drawer from "./Drawer";

export default function Wardrobe({
  width,
  height,
  depth,
  doors,
  drawers,
  shelves,
  thickness = .015,
  backThickness = .003,
  drawerDimensions,
}) {
  const doorWidth = width / doors;
  const backPanel = calculateBackPanelDimensions({
    externalWidth: width, externalHeight: height, panelThickness: thickness, backPanelThickness: backThickness,
    hasTop: true, hasBottom: true, furnitureDepth: depth,
  });

  return (
    <group>


      {/* Lateral izquierdo */}
      <mesh position={[-width/2 + thickness/2,0,0]}>
        <boxGeometry args={[thickness,height,depth]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>


      {/* Lateral derecho */}
      <mesh position={[width/2 - thickness/2,0,0]}>
        <boxGeometry args={[thickness,height,depth]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>



      {/* Tapa superior */}
      <mesh position={[0,height/2 - thickness/2,0]}>
        <boxGeometry args={[width,thickness,depth]} />
        <meshStandardMaterial color="#b07d4f" />
      </mesh>



      {/* Base inferior */}
      <mesh position={[0,-height/2 + thickness/2,0]}>
        <boxGeometry args={[width,thickness,depth]} />
        <meshStandardMaterial color="#b07d4f" />
      </mesh>



      {/* Fondo */}
      <mesh position={[0,0,backPanel.centerZ]}>
        <boxGeometry args={[backPanel.width,backPanel.height,backPanel.thickness]} />
        <meshStandardMaterial color="#b98b5d" />
      </mesh>



      {/* Puertas */}
      {Array.from({length:doors}).map((_,i)=>(

        <mesh
          key={i}
          position={[
            -width/2 + doorWidth/2 + i*doorWidth,
            0,
            depth/2 + 0.03
          ]}
        >

          <boxGeometry
            args={[
              doorWidth-0.05,
              height-0.1,
              0.03
            ]}
          />

          <meshStandardMaterial color="#d8c3a5"/>

        </mesh>

      ))}



      {/* Repisas */}
      {Array.from({length:shelves}).map((_,i)=>(

        <mesh
          key={i}
          position={[
            0,
            height/2 - ((i+1)*height/(shelves+1)),
            0
          ]}
        >

          <boxGeometry
            args={[
              width-thickness*2,
              thickness,
              depth
            ]}
          />

          <meshStandardMaterial color="#8b5a2b"/>

        </mesh>

      ))}



      {/* Cajones */}
      {drawerDimensions.hasEnoughDepth && Array.from({length:drawers}).map((_,i)=>(
        <Drawer
          key={i}
          width={drawerDimensions.externalWidthCm / 100}
          height={0.25}
          depth={drawerDimensions.sideLengthCm / 100}
          thickness={thickness}
          baseThickness={backThickness}
          position={[
            0,
            -height/2+0.25+(i*0.35),
            0
          ]}
        />

      ))}


    </group>
  );
}
