import { Edges } from "@react-three/drei";
import Drawer from "./Drawer";
import DrawerSlides from "./DrawerSlides";

const MELAMINE = "#8b5a2b", TOP = "#b07d4f", HARDBOARD = "#b98b5d";
function Panel({ position, size, color = MELAMINE, transparent = false }) { return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} transparent={transparent} opacity={transparent ? .2 : 1} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>; }
function Rod({ centerX, y, length }) { return <group><mesh position={[centerX, y, .03]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.012, .012, length, 20]} /><meshStandardMaterial color="#777f87" /></mesh>{[-1, 1].map((side) => <mesh key={side} position={[centerX + side * length / 2, y, .03]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.025, .025, .012, 20]} /><meshStandardMaterial color="#555" /></mesh>)}</group>; }
function Door({ index, centerX, width, height, depth, thickness, open }) {
  const hingeSide = index === 1 ? -1 : index === 2 ? 1 : -1;
  const hingeX = centerX + hingeSide * width / 2;
  return <group position={[hingeX, 0, depth / 2 + thickness / 2 + .002]} rotation={[0, open ? -hingeSide * Math.PI * .58 : 0, 0]}>
    <Panel position={[-hingeSide * width / 2, 0, 0]} size={[width, height, thickness]} color="#d8c3a5" />
    <mesh position={[-hingeSide * width * .18, 0, thickness / 2 + .012]}><boxGeometry args={[.025, .16, .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}

export default function Wardrobe({ height, depth, thickness = .015, backThickness = .003, drawerDimensions, drawerFrontConfig, structure }) {
  const s = structure, cfg = s.config, opening = s.openingWidthCm / 100, drawerWidth = s.drawerBoxWidthCm / 100, drawerDepth = s.drawerDepthCm / 100;
  const shelfDepth = depth - thickness, rodLength = Math.max(0, opening - .04);
  return <group>
    <Panel position={[0, height / 2 - thickness / 2, 0]} size={[s.externalWidthCm / 100, thickness, depth]} color={TOP} />
    {s.bodyCentersXCm.map((x, index) => <group key={`module-${index}`}>
      <Panel position={[x / 100, s.upperShelfYCm / 100, 0]} size={[opening, thickness, shelfDepth]} />
      <Panel position={[s.backLayouts[index].centerXCm / 100, 0, -depth / 2 - backThickness / 2]} size={[s.backLayouts[index].widthCm / 100, height, backThickness]} color={HARDBOARD} transparent={cfg.showStructure} />
      {[1, -1].map((side) => <Panel key={`crossbar-${side}`} position={[x / 100, -height / 2 + s.lowerCrossbarHeightCm / 200, side * (depth / 2 - thickness / 2)]} size={[opening, s.lowerCrossbarHeightCm / 100, thickness]} />)}
    </group>)}
    {s.panelCentersXCm.map((x, index) => <Panel key={`vertical-${index}`} position={[x / 100, -thickness / 2, 0]} size={[thickness, height - thickness, depth]} />)}
    {[0, 2].map((bodyIndex) => <Panel key={`drawer-shelf-${bodyIndex}`} position={[s.bodyCentersXCm[bodyIndex] / 100, s.drawerShelfYCm / 100, 0]} size={[opening, thickness, shelfDepth]} />)}
    {s.intermediateShelfYCentersCm.map((y, index) => <Panel key={`intermediate-${index}`} position={[s.bodyCentersXCm[0] / 100, y / 100, 0]} size={[opening, thickness, shelfDepth]} />)}
    <Panel position={[s.bodyCentersXCm[1] / 100, s.shoeBottomShelfYCm / 100, 0]} size={[opening, thickness, shelfDepth]} />
    {s.shoeShelfYCentersCm.map((y, index) => <Panel key={`shoe-${index}`} position={[s.bodyCentersXCm[1] / 100, y / 100, 0]} size={[opening, thickness, shelfDepth]} />)}
    <Rod centerX={s.bodyCentersXCm[1] / 100} y={s.rodYCm / 100} length={rodLength} />
    <Rod centerX={s.bodyCentersXCm[2] / 100} y={s.rodYCm / 100} length={rodLength} />
    {drawerDimensions.hasEnoughDepth && s.drawerLayouts.map((layout) => <group key={`${layout.bodyIndex}-${layout.drawerIndex}`}>
      <Drawer width={drawerWidth} height={s.drawerFrontHeightCm / 100} depth={drawerDepth} thickness={thickness} baseThickness={backThickness} drawerFrontConfig={drawerFrontConfig} frontDimensions={{ widthCm: s.openingWidthCm - s.doorGapCm * 2, heightCm: s.drawerFrontHeightCm }} sideHeightOverride={s.drawerSideHeightCm / 100} position={[layout.centerXCm / 100, layout.centerYCm / 100, layout.centerZCm / 100]} showEdges />
      <DrawerSlides centerX={layout.centerXCm / 100} centerY={layout.centerYCm / 100} closedCenterZ={depth / 2 - drawerDepth / 2} drawerWidth={drawerWidth} drawerDepth={drawerDepth} slideThickness={Math.max(.004, drawerDimensions.totalClearanceCm / 400)} slideHeight={Math.max(.012, thickness * .8)} openOffset={layout.centerZCm / 100 - (depth / 2 - drawerDepth / 2)} />
    </group>)}
    {cfg.showDoors && !cfg.showStructure && s.bodyCentersXCm.map((x, index) => <Door key={`door-${index}`} index={index} centerX={x / 100} width={s.doorWidthCm / 100} height={s.doorHeightCm / 100} depth={depth} thickness={thickness} open={cfg.showOpenDoors} />)}
  </group>;
}
