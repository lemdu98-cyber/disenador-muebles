import { calculateDrawerBottomDimensions } from "../utils/drawerBottom";

const MELAMINE = "#d8c3a5";
const HARDBOARD = "#b98b5d";

/** A drawer whose width and depth are its complete external dimensions. */
export default function Drawer({
  width,
  height,
  depth,
  position = [0, 0, 0],
  thickness = .015,
  baseThickness = .003,
}) {
  const sideHeight = Math.max(height * .72, .05);
  const bottom = calculateDrawerBottomDimensions({
    externalWidth: width,
    externalDepth: depth,
    internalWidth: width - thickness * 2,
    internalDepth: depth - thickness * 2,
    panelThickness: thickness,
    bottomThickness: baseThickness,
    drawerHeight: height,
  });

  return <group position={position}>
    <mesh position={[0, 0, depth / 2 - thickness / 2]}><boxGeometry args={[width, height, thickness]} /><meshStandardMaterial color={MELAMINE} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), -height / 2 + sideHeight / 2, 0]}><boxGeometry args={[thickness, sideHeight, depth]} /><meshStandardMaterial color={MELAMINE} /></mesh>)}
    <mesh position={[0, -height / 2 + sideHeight / 2, -depth / 2 + thickness / 2]}><boxGeometry args={[width - thickness * 2, sideHeight, thickness]} /><meshStandardMaterial color={MELAMINE} /></mesh>
    <mesh position={[0, bottom.centerY, 0]}><boxGeometry args={[bottom.width, bottom.thickness, bottom.depth]} /><meshStandardMaterial color={HARDBOARD} /></mesh>
    <mesh position={[0, 0, depth / 2 + thickness / 2]}><boxGeometry args={[Math.min(width * .32, .16), Math.max(.012, height * .07), .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
