import { useMemo } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { findManufacturingPiece } from "../utils/manufacturingGrid.js";

const HARDBOARD = "#b98b5d";
const EDGE_COLOR = "#49382d";

function Board({ dimensions, position, color, children }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshStandardMaterial color={color} />
    <Edges color={EDGE_COLOR} threshold={15} scale={1.001} />
    {children}
  </mesh>;
}

function createBackShape(width, height, entry) {
  const shape = new THREE.Shape();
  shape.moveTo(-width / 2, -height / 2);
  shape.lineTo(width / 2, -height / 2);
  shape.lineTo(width / 2, height / 2);
  shape.lineTo(-width / 2, height / 2);
  shape.closePath();

  if (entry.type === "circular") {
    const hole = new THREE.Path();
    hole.absarc(0, 0, Math.min(entry.diameter / 2, width * 0.45, height * 0.45), 0, Math.PI * 2, false);
    shape.holes.push(hole);
  } else if (entry.type === "square") {
    const holeWidth = Math.min(entry.width, width * 0.9);
    const holeHeight = Math.min(entry.height, height * 0.9);
    const hole = new THREE.Path();
    hole.moveTo(-holeWidth / 2, -holeHeight / 2);
    hole.lineTo(-holeWidth / 2, holeHeight / 2);
    hole.lineTo(holeWidth / 2, holeHeight / 2);
    hole.lineTo(holeWidth / 2, -holeHeight / 2);
    hole.closePath();
    shape.holes.push(hole);
  }
  return shape;
}

export default function CatHouse({ width, height, depth, thickness = 0.015, backThickness = 0.003, entry, color = "#8b5a2b", manufacturingPieces = [] }) {
  const side = findManufacturingPiece(manufacturingPieces, "Lateral izquierdo");
  const top = findManufacturingPiece(manufacturingPieces, "Tapa superior");
  const back = findManufacturingPiece(manufacturingPieces, "Fondo trasero");
  const sideHeight = (side?.length ?? (height * 100 - thickness * 200)) / 100;
  const sideDepth = (side?.width ?? depth * 100) / 100;
  const topWidth = (top?.length ?? width * 100) / 100;
  const topDepth = (top?.width ?? depth * 100) / 100;
  const backWidth = (back?.length ?? width * 100) / 100;
  const backHeight = (back?.width ?? height * 100) / 100;
  const backShape = useMemo(() => createBackShape(backWidth, backHeight, entry), [backWidth, backHeight, entry]);
  return <group>
    {[-1, 1].map((direction) => <Board key={direction} position={[direction * (width / 2 - thickness / 2), 0, 0]} dimensions={[thickness, sideHeight, sideDepth]} color={color} />)}
    <Board position={[0, height / 2 - thickness / 2, 0]} dimensions={[topWidth, thickness, topDepth]} color={color} />
    <Board position={[0, -height / 2 + thickness / 2, 0]} dimensions={[topWidth, thickness, topDepth]} color={color} />
    <mesh position={[0, 0, -depth / 2 - backThickness - 0.0002]} castShadow receiveShadow>
      <extrudeGeometry args={[backShape, { depth: backThickness, bevelEnabled: false }]} />
      <meshStandardMaterial color={HARDBOARD} side={THREE.DoubleSide} />
      <Edges color={EDGE_COLOR} threshold={15} scale={1.001} />
    </mesh>
  </group>;
}
