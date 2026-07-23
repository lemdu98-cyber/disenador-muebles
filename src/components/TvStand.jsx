const WOOD_COLOR = "#8b5a2b";
const TOP_COLOR = "#b07d4f";
const FRONT_COLOR = "#d8c3a5";

export default function TvStand({ width, height, depth, doors, drawers, shelves }) {
  const thickness = 0.03;
  const storageHeight = height * 0.48;
  const openHeight = height - storageHeight - thickness * 2;
  const drawerAreaWidth = drawers > 0 ? Math.min(width * 0.38, 0.72) : 0;
  const remainingWidth = width - drawerAreaWidth - thickness * 2;
  const doorWidth = doors > 0 ? remainingWidth / doors : 0;

  return <group>
    <mesh position={[0, height / 2 - thickness / 2, 0]}><boxGeometry args={[width, thickness, depth]} /><meshStandardMaterial color={TOP_COLOR} /></mesh>
    <mesh position={[0, -height / 2 + thickness / 2, 0]}><boxGeometry args={[width, thickness, depth]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), 0, 0]}><boxGeometry args={[thickness, height - thickness * 2, depth]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>)}
    <mesh position={[0, 0, -depth / 2 + thickness / 2]}><boxGeometry args={[width - thickness * 2, height - thickness * 2, thickness]} /><meshStandardMaterial color="#c9b49a" /></mesh>
    <mesh position={[0, -height / 2 + storageHeight + thickness, 0]}><boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>
    {Array.from({ length: shelves }).map((_, index) => <mesh key={index} position={[0, -height / 2 + storageHeight + (openHeight * (index + 1)) / (shelves + 1), 0]}><boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} /><meshStandardMaterial color={WOOD_COLOR} /></mesh>)}
    {Array.from({ length: doors }).map((_, index) => {
      const offset = drawerAreaWidth > 0 && index >= Math.ceil(doors / 2) ? drawerAreaWidth : 0;
      return <mesh key={index} position={[-width / 2 + thickness + doorWidth / 2 + index * doorWidth + offset, -height / 2 + storageHeight / 2, depth / 2 + thickness / 2]}><boxGeometry args={[doorWidth - 0.012, storageHeight - thickness * 2, thickness]} /><meshStandardMaterial color={FRONT_COLOR} /></mesh>;
    })}
    {Array.from({ length: drawers }).map((_, index) => <mesh key={index} position={[0, -height / 2 + storageHeight - (storageHeight * (index + 0.5)) / drawers, depth / 2 + thickness / 2]}><boxGeometry args={[drawerAreaWidth - 0.012, storageHeight / drawers - 0.012, thickness]} /><meshStandardMaterial color="#704214" /></mesh>)}
  </group>;
}
