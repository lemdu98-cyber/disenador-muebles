export default function Wardrobe({
  width,
  height,
  depth,
  doors,
  drawers,
  shelves
}) {

  const thickness = 0.05;
  const doorWidth = width / doors;

  return (
    <group>


      {/* Lateral izquierdo */}
      <mesh position={[-width/2,0,0]}>
        <boxGeometry args={[thickness,height,depth]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>


      {/* Lateral derecho */}
      <mesh position={[width/2,0,0]}>
        <boxGeometry args={[thickness,height,depth]} />
        <meshStandardMaterial color="#8b5a2b" />
      </mesh>



      {/* Tapa superior */}
      <mesh position={[0,height/2,0]}>
        <boxGeometry args={[width,thickness,depth]} />
        <meshStandardMaterial color="#b07d4f" />
      </mesh>



      {/* Base inferior */}
      <mesh position={[0,-height/2,0]}>
        <boxGeometry args={[width,thickness,depth]} />
        <meshStandardMaterial color="#b07d4f" />
      </mesh>



      {/* Fondo */}
      <mesh position={[0,0,-depth/2]}>
        <boxGeometry args={[width,height,0.03]} />
        <meshStandardMaterial color="#d8c3a5" />
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
      {Array.from({length:drawers}).map((_,i)=>(

        <mesh
          key={i}
          position={[
            0,
            -height/2+0.25+(i*0.35),
            depth/2+0.04
          ]}
        >

          <boxGeometry
            args={[
              width*0.5,
              0.25,
              0.04
            ]}
          />

          <meshStandardMaterial color="#704214"/>

        </mesh>

      ))}


    </group>
  );
}
