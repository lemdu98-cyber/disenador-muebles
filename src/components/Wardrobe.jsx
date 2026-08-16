import { Edges } from "@react-three/drei";
import Drawer from "./Drawer";
import DrawerSlides from "./DrawerSlides";

const MELAMINE = "#8b5a2b", TOP = "#b07d4f", HARDBOARD = "#b98b5d";
function Panel({ position, size, color = MELAMINE, transparent = false }) { return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} transparent={transparent} opacity={transparent ? .22 : 1} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>; }
function Door({ side, width, height, depth, thickness, open, hidden }) {
  if (hidden) return null;
  return <group position={[side * (width + .003) / 2, 0, depth / 2 + thickness / 2 + .002]} rotation={[0, open ? -side * Math.PI * .62 : 0, 0]}>
    <Panel position={[-side * width / 2, 0, 0]} size={[width, height, thickness]} color="#d8c3a5" />
    <mesh position={[-side * width * .16, 0, thickness / 2 + .012]}><boxGeometry args={[.025, .16, .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}

export default function Wardrobe({ width, height, depth, thickness = .015, backThickness = .003, drawerDimensions, drawerFrontConfig, structure }) {
  const s = structure, cfg = s.config;
  const leftWidth = s.leftOpeningWidthCm / 100, rightWidth = s.rightOpeningWidthCm / 100;
  const leftX = s.leftCenterXCm / 100, rightX = s.rightCenterXCm / 100, dividerX = s.dividerCenterXCm / 100;
  const drawerWidth = s.drawerBoxWidthCm / 100, drawerDepth = s.drawerDepthCm / 100, drawerHeight = s.drawerFrontHeightCm / 100;
  const rodLength = Math.max(0, rightWidth - .04);
  return <group>
    <Panel position={[0, height / 2 - thickness / 2, 0]} size={[width, thickness, depth]} color={TOP} />
    <Panel position={[-width / 2 + thickness / 2, -thickness / 2, 0]} size={[thickness, height - thickness, depth]} />
    <Panel position={[width / 2 - thickness / 2, -thickness / 2, 0]} size={[thickness, height - thickness, depth]} />
    <Panel position={[0, -height / 2 + thickness / 2, 0]} size={[width - thickness * 2, thickness, depth]} color={TOP} />
    <Panel position={[dividerX, -thickness / 2, 0]} size={[thickness, height - thickness, depth]} />
    {s.shelfYCentersCm.map((y, index) => <Panel key={`shelf-${index}`} position={[leftX, y / 100, 0]} size={[leftWidth, thickness, depth - thickness]} />)}
    <Panel position={[leftX, (-height / 2 + thickness + s.drawerRegionHeightCm) / 100, 0]} size={[leftWidth, thickness, depth - thickness]} />
    <Panel position={[rightX, s.hangingShelfYCm / 100, 0]} size={[rightWidth, thickness, depth - thickness]} />
    <mesh position={[rightX, s.rodYCm / 100, .03]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.012, .012, rodLength, 20]} /><meshStandardMaterial color="#777f87" /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[rightX + side * rodLength / 2, s.rodYCm / 100, .03]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.025, .025, .012, 20]} /><meshStandardMaterial color="#555" /></mesh>)}
    {drawerDimensions.hasEnoughDepth && s.drawerLayouts.map((layout) => <group key={layout.index}>
      <Drawer width={drawerWidth} height={drawerHeight} depth={drawerDepth} thickness={thickness} baseThickness={backThickness} drawerFrontConfig={drawerFrontConfig} frontDimensions={{ widthCm: s.leftOpeningWidthCm - s.doorGapCm * 2, heightCm: s.drawerFrontHeightCm }} sideHeightOverride={s.drawerSideHeightCm / 100} position={[leftX, layout.centerYCm / 100, layout.centerZCm / 100]} showEdges />
      <DrawerSlides centerX={leftX} centerY={layout.centerYCm / 100} closedCenterZ={depth / 2 - drawerDepth / 2} drawerWidth={drawerWidth} drawerDepth={drawerDepth} slideThickness={Math.max(.004, drawerDimensions.totalClearanceCm / 400)} slideHeight={Math.max(.012, thickness * .8)} openOffset={layout.centerZCm / 100 - (depth / 2 - drawerDepth / 2)} />
    </group>)}
    <Panel position={[0, 0, -depth / 2 - backThickness / 2]} size={[width, height, backThickness]} color={HARDBOARD} transparent={cfg.showStructure} />
    <Door side={-1} width={s.doorWidthCm / 100} height={s.doorHeightCm / 100} depth={depth} thickness={thickness} open={cfg.showOpenDoors} hidden={cfg.showStructure} />
    <Door side={1} width={s.doorWidthCm / 100} height={s.doorHeightCm / 100} depth={depth} thickness={thickness} open={cfg.showOpenDoors} hidden={cfg.showStructure} />
  </group>;
}
