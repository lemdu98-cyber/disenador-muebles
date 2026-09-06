import { Edges } from "@react-three/drei";
import { findManufacturingPiece } from "../utils/manufacturingGrid";

const BODY = "#8b5a2b";
const TOP = "#b07d4f";
const DIVIDER = "#99643c";
const SHELF = "#a87349";
const BRACE = "#704421";
const HARDBOARD = "#b98b5d";
const SUPPORT = "#85512c";

function Piece({ position, dimensions, color = BODY, opacity = 1 }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    <Edges color="#49382d" threshold={15} scale={1.001} />
  </mesh>;
}

export default function TvStand({ width, height, depth, thickness, backThickness, structure, manufacturingPieces = [] }) {
  const cut = (name) => findManufacturingPiece(manufacturingPieces, name);
  const topPiece = cut("Tapa superior"), sidePiece = cut("Lateral izquierdo"), basePiece = cut("Base inferior"), dividerPiece = cut("Divisor vertical central");
  const shelfPiece = cut(structure.config.dividerEnabled ? "Repisa izquierda" : "Repisa interior");
  const sideHeight = (sidePiece?.length ?? structure.sideHeightCm) / 100;
  const innerWidth = (basePiece?.length ?? structure.innerWidthCm) / 100;
  const dividerHeight = (dividerPiece?.length ?? structure.dividerHeightCm) / 100;
  const shelfDepth = (shelfPiece?.width ?? structure.shelfDepthCm) / 100;
  const shelfSpan = (shelfPiece?.length ?? structure.shelfSpanCm) / 100;
  const shelfY = structure.shelfCenterYCm / 100;
  const upperPiece = cut("Travesaño trasero superior"), lowerPiece = cut("Travesaño trasero inferior"), supportPiece = cut("Soporte vertical izquierdo"), backPiece = cut("Fondo trasero completo");
  const upperHeight = (upperPiece?.width ?? structure.upperRearHeightCm) / 100;
  const lowerHeight = (lowerPiece?.width ?? structure.lowerRearHeightCm) / 100;
  const supportHeight = (supportPiece?.length ?? structure.supportHeightCm) / 100;
  const supportDepth = (supportPiece?.width ?? structure.supportDepthCm) / 100;
  const supportX = structure.supportCenterXCm / 100;
  const spans = structure.config.dividerEnabled ? [-1, 1] : [0];
  const spanCenterX = (side) => side === 0 ? 0 : side * (thickness / 2 + shelfSpan / 2);
  const inspectionOpacity = structure.config.showStructure ? .38 : 1;

  return <group>
    <Piece position={[0, height / 2 - thickness / 2, 0]} dimensions={[(topPiece?.length ?? width * 100) / 100, thickness, (topPiece?.width ?? depth * 100) / 100]} color={TOP} opacity={inspectionOpacity} />
    <Piece position={[-width / 2 + thickness / 2, -thickness / 2, 0]} dimensions={[thickness, sideHeight, (sidePiece?.width ?? depth * 100) / 100]} opacity={inspectionOpacity} />
    <Piece position={[width / 2 - thickness / 2, -thickness / 2, 0]} dimensions={[thickness, sideHeight, (sidePiece?.width ?? depth * 100) / 100]} opacity={inspectionOpacity} />
    <Piece position={[0, -height / 2 + thickness / 2, 0]} dimensions={[innerWidth, thickness, depth]} />
    {structure.config.dividerEnabled && <Piece position={[0, 0, thickness / 2]} dimensions={[thickness, dividerHeight, shelfDepth]} color={DIVIDER} />}
    {spans.map((side) => <Piece key={`shelf-${side}`} position={[spanCenterX(side), shelfY, thickness / 2]} dimensions={[shelfSpan, thickness, shelfDepth]} color={SHELF} />)}
    {structure.config.dividerEnabled && [-1, 1].map((side) => <Piece key={`support-${side}`} position={[side * supportX, -height / 2 + thickness + supportHeight / 2, thickness / 2]} dimensions={[thickness, supportHeight, supportDepth]} color={SUPPORT} />)}
    {structure.config.upperRearEnabled && <Piece position={[0, height / 2 - thickness - upperHeight / 2, -depth / 2 + thickness / 2]} dimensions={[(upperPiece?.length ?? innerWidth * 100) / 100, upperHeight, thickness]} color={BRACE} />}
    {structure.config.lowerRearEnabled && <Piece position={[0, -height / 2 + thickness + lowerHeight / 2, -depth / 2 + thickness / 2]} dimensions={[(lowerPiece?.length ?? innerWidth * 100) / 100, lowerHeight, thickness]} color={BRACE} />}
    {!structure.config.showStructure && <Piece position={[0, 0, -depth / 2 - backThickness / 2]} dimensions={[(backPiece?.length ?? width * 100) / 100, (backPiece?.width ?? height * 100) / 100, backThickness]} color={HARDBOARD} />}
  </group>;
}
