import { Edges } from "@react-three/drei";

const BODY = "#8b5a2b";
const TOP = "#b07d4f";
const DIVIDER = "#99643c";
const SHELF = "#a87349";
const BRACE = "#704421";

function Piece({ position, dimensions, color = BODY, opacity = 1 }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshStandardMaterial color={color} transparent={opacity < 1} opacity={opacity} />
    <Edges color="#49382d" threshold={15} scale={1.001} />
  </mesh>;
}

export default function TvStand({ width, height, depth, thickness, structure }) {
  const sideHeight = structure.sideHeightCm / 100;
  const innerWidth = structure.innerWidthCm / 100;
  const dividerHeight = structure.dividerHeightCm / 100;
  const shelfDepth = structure.shelfDepthCm / 100;
  const shelfSpan = structure.shelfSpanCm / 100;
  const shelfY = structure.shelfCenterYCm / 100;
  const upperHeight = structure.upperRearHeightCm / 100;
  const lowerHeight = structure.lowerRearHeightCm / 100;
  const spans = structure.config.dividerEnabled ? [-1, 1] : [0];
  const spanCenterX = (side) => side === 0 ? 0 : side * (thickness / 2 + shelfSpan / 2);
  const inspectionOpacity = structure.config.showStructure ? .38 : 1;

  return <group>
    <Piece position={[0, height / 2 - thickness / 2, 0]} dimensions={[width, thickness, depth]} color={TOP} opacity={inspectionOpacity} />
    <Piece position={[-width / 2 + thickness / 2, -thickness / 2, 0]} dimensions={[thickness, sideHeight, depth]} opacity={inspectionOpacity} />
    <Piece position={[width / 2 - thickness / 2, -thickness / 2, 0]} dimensions={[thickness, sideHeight, depth]} opacity={inspectionOpacity} />
    <Piece position={[0, -height / 2 + thickness / 2, 0]} dimensions={[innerWidth, thickness, depth]} />
    {structure.config.dividerEnabled && <Piece position={[0, 0, thickness / 2]} dimensions={[thickness, dividerHeight, shelfDepth]} color={DIVIDER} />}
    {spans.map((side) => <Piece key={`shelf-${side}`} position={[spanCenterX(side), shelfY, thickness / 2]} dimensions={[shelfSpan, thickness, shelfDepth]} color={SHELF} />)}
    {structure.config.upperRearEnabled && spans.map((side) => <Piece key={`upper-${side}`} position={[spanCenterX(side), height / 2 - thickness - upperHeight / 2, -depth / 2 + thickness / 2]} dimensions={[shelfSpan, upperHeight, thickness]} color={BRACE} />)}
    {structure.config.lowerRearEnabled && spans.map((side) => <Piece key={`lower-${side}`} position={[spanCenterX(side), -height / 2 + thickness + lowerHeight / 2, -depth / 2 + thickness / 2]} dimensions={[shelfSpan, lowerHeight, thickness]} color={BRACE} />)}
  </group>;
}
