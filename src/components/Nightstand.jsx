const WOOD_COLOR = "#8b5a2b";
const TOP_COLOR = "#b07d4f";
const DRAWER_COLOR = "#d8c3a5";

export default function Nightstand({ width, height, depth, drawers }) {
  const thickness = 0.03;
  const usableHeight = height - thickness * 2;
  const drawerHeight = drawers > 0 ? (usableHeight - 0.045) / drawers : 0;

  return <group>
    {/* Caja exterior */}
    <mesh position={[0, height / 2 - thickness / 2, 0]}><boxGeometry args={[width, thickness, depth]} /><meshStandardMaterial color={TOP_COLOR} /></mesh>
    <mesh position={[0, -height / 2 + thickness / 2, 0]}><boxGeometry args={[width, thickness, depth]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), 0, 0]}><boxGeometry args={[thickness, usableHeight, depth]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>)}
    <mesh position={[0, 0, -depth / 2 + thickness / 2]}><boxGeometry args={[width - thickness * 2, usableHeight, thickness]} /><meshStandardMaterial color="#c9b49a" /></mesh>

    {/* Frentes de cajón */}
    {Array.from({ length: drawers }).map((_, index) => <mesh key={index} position={[0, height / 2 - thickness - drawerHeight / 2 - index * drawerHeight, depth / 2 + thickness / 2]}>
      <boxGeometry args={[width - thickness * 2 - 0.012, drawerHeight - 0.012, thickness]} /><meshStandardMaterial color={DRAWER_COLOR} />
    </mesh>)}

    {/* Nicho abierto cuando no se configuran cajones */}
    {drawers === 0 && <mesh position={[0, 0, 0]}><boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>}
  </group>;
}
