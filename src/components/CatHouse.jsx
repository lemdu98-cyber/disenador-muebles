import { Edges } from "@react-three/drei";
import { findManufacturingPiece } from "../utils/manufacturingGrid.js";

const MELAMINE = "#8b5a2b";
const HARDBOARD = "#b98b5d";
const EDGE_COLOR = "#49382d";

function Board({ dimensions, position, color }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshStandardMaterial color={color} />
    <Edges color={EDGE_COLOR} threshold={15} scale={1.001} />
  </mesh>;
}

/** Five rectangular manufacturing panels. The positive-Z front is intentionally open. */
export default function CatHouse({ width, height, depth, thickness = 0.015, backThickness = 0.003, manufacturingPieces = [] }) {
  const cut = (name) => findManufacturingPiece(manufacturingPieces, name);
  const left = cut("Lateral izquierdo"), right = cut("Lateral derecho");
  const top = cut("Tapa superior"), base = cut("Base inferior"), back = cut("Trasera de cartón prensado");
  const sideHeight = (left?.length ?? height * 100 - thickness * 200) / 100;
  const sideDepth = (left?.width ?? depth * 100) / 100;
  const rightHeight = (right?.length ?? sideHeight * 100) / 100;
  const rightDepth = (right?.width ?? sideDepth * 100) / 100;
  const topWidth = (top?.length ?? width * 100) / 100;
  const topDepth = (top?.width ?? depth * 100) / 100;
  const baseWidth = (base?.length ?? width * 100) / 100;
  const baseDepth = (base?.width ?? depth * 100) / 100;
  const backWidth = (back?.length ?? width * 100) / 100;
  const backHeight = (back?.width ?? height * 100) / 100;
  return <group>
    <Board position={[-width / 2 + thickness / 2, 0, 0]} dimensions={[thickness, sideHeight, sideDepth]} color={MELAMINE} />
    <Board position={[width / 2 - thickness / 2, 0, 0]} dimensions={[thickness, rightHeight, rightDepth]} color={MELAMINE} />
    <Board position={[0, height / 2 - thickness / 2, 0]} dimensions={[topWidth, thickness, topDepth]} color={MELAMINE} />
    <Board position={[0, -height / 2 + thickness / 2, 0]} dimensions={[baseWidth, thickness, baseDepth]} color={MELAMINE} />
    <Board position={[0, 0, -depth / 2 - backThickness / 2]} dimensions={[backWidth, backHeight, backThickness]} color={HARDBOARD} />
  </group>;
}
