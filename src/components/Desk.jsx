const WOOD_COLOR = "#8b5a2b";
const EDGE_COLOR = "#b07d4f";
const DRAWER_COLOR = "#d8c3a5";

export default function Desk({ width, height, depth, drawers }) {
  const thickness = 0.03;
  const legWidth = 0.08;
  const drawerColumnWidth = Math.min(width * 0.3, 0.48);
  const usableHeight = height - thickness;
  const drawerHeight = drawers > 0 ? Math.min(0.22, (usableHeight - 0.08) / drawers) : 0;
  const drawerDepth = depth * 0.78;

  return (
    <group>
      {/* Tapa */}
      <mesh position={[0, height / 2 - thickness / 2, 0]}>
        <boxGeometry args={[width, thickness, depth]} />
        <meshStandardMaterial color={EDGE_COLOR} />
      </mesh>

      {/* Patas */}
      {[-1, 1].map((side) => (
        <mesh key={side} position={[side * (width / 2 - legWidth / 2), 0, 0]}>
          <boxGeometry args={[legWidth, usableHeight, depth]} />
          <meshStandardMaterial color={WOOD_COLOR} />
        </mesh>
      ))}

      {/* Faldón posterior para rigidizar el escritorio */}
      <mesh position={[0, height / 2 - 0.16, -depth / 2 + thickness / 2]}>
        <boxGeometry args={[width - legWidth * 2, 0.22, thickness]} />
        <meshStandardMaterial color={WOOD_COLOR} />
      </mesh>

      {/* Módulo de cajones a la derecha */}
      {drawers > 0 && (
        <group position={[width / 2 - legWidth - drawerColumnWidth / 2, -thickness / 2, 0]}>
          <mesh position={[-drawerColumnWidth / 2 + thickness / 2, 0, 0]}>
            <boxGeometry args={[thickness, usableHeight, drawerDepth]} />
            <meshStandardMaterial color={WOOD_COLOR} />
          </mesh>
          <mesh position={[drawerColumnWidth / 2 - thickness / 2, 0, 0]}>
            <boxGeometry args={[thickness, usableHeight, drawerDepth]} />
            <meshStandardMaterial color={WOOD_COLOR} />
          </mesh>
          {Array.from({ length: drawers }).map((_, index) => (
            <mesh
              key={index}
              position={[
                0,
                usableHeight / 2 - drawerHeight / 2 - 0.04 - index * drawerHeight,
                drawerDepth / 2 + thickness / 2,
              ]}
            >
              <boxGeometry args={[drawerColumnWidth - thickness * 2, drawerHeight - 0.015, thickness]} />
              <meshStandardMaterial color={DRAWER_COLOR} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}
