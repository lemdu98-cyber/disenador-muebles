import Drawer from "./Drawer";

const MELAMINE = "#8b5a2b";
const TOP = "#b07d4f";
const HARDBOARD = "#b98b5d";

export default function Nightstand({ width, height, depth, drawers }) {
  const thickness = .03; const backThickness = .004;
  const usableHeight = height - thickness;
  const drawerHeight = drawers ? (usableHeight - .045) / drawers : 0;
  return <group>
    <mesh position={[0, height / 2 - thickness / 2, 0]}><boxGeometry args={[width, thickness, depth]} /><meshStandardMaterial color={TOP} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), -thickness / 2, 0]}><boxGeometry args={[thickness, usableHeight, depth]} /><meshStandardMaterial color={MELAMINE} /></mesh>)}
    <mesh position={[0, -thickness / 2, -depth / 2 + backThickness / 2]}><boxGeometry args={[width - thickness * 2, usableHeight, backThickness]} /><meshStandardMaterial color={HARDBOARD} /></mesh>
    {Array.from({ length: drawers }).map((_, index) => <Drawer key={index} width={width - thickness * 2 - .012} height={drawerHeight - .012} depth={depth - thickness * 2} position={[0, height / 2 - thickness - drawerHeight / 2 - index * drawerHeight, 0]} />)}
    {drawers === 0 && <mesh position={[0, -height * .05, 0]}><boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} /><meshStandardMaterial color={MELAMINE} /></mesh>}
  </group>;
}
