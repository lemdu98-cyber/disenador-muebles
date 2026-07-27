const MELAMINE = "#d8c3a5";
const HARDBOARD = "#b98b5d";

/** A reusable manufactured drawer: front, sides, back, hardboard base and handle. */
export default function Drawer({ width, height, depth, position = [0, 0, 0] }) {
  const thickness = 0.018;
  const baseThickness = 0.004;
  const sideHeight = Math.max(height * .72, .05);
  return <group position={position}>
    <mesh position={[0, 0, depth / 2]}><boxGeometry args={[width, height, thickness]} /><meshStandardMaterial color={MELAMINE} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), -height / 2 + sideHeight / 2, 0]}><boxGeometry args={[thickness, sideHeight, depth]} /><meshStandardMaterial color={MELAMINE} /></mesh>)}
    <mesh position={[0, -height / 2 + sideHeight / 2, -depth / 2 + thickness / 2]}><boxGeometry args={[width - thickness * 2, sideHeight, thickness]} /><meshStandardMaterial color={MELAMINE} /></mesh>
    <mesh position={[0, -height / 2 + baseThickness / 2, 0]}><boxGeometry args={[width - thickness * 2, baseThickness, depth - thickness]} /><meshStandardMaterial color={HARDBOARD} /></mesh>
    <mesh position={[0, 0, depth / 2 + thickness]}><boxGeometry args={[Math.min(width * .32, .16), Math.max(.012, height * .07), .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
