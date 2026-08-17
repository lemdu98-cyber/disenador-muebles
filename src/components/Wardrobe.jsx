import { Edges } from "@react-three/drei";
import Drawer from "./Drawer";
import DrawerSlides from "./DrawerSlides";

const MELAMINE = "#8b5a2b", TOP = "#b07d4f", HARDBOARD = "#b98b5d";
function Panel({ position, size, color = MELAMINE, transparent = false }) { return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} transparent={transparent} opacity={transparent ? .2 : 1} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>; }
function Rod({ centerX, y, length }) { return <group><mesh position={[centerX, y, .03]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.012, .012, length, 20]} /><meshStandardMaterial color="#777f87" /></mesh>{[-1, 1].map((side) => <mesh key={side} position={[centerX + side * length / 2, y, .03]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.025, .025, .012, 20]} /><meshStandardMaterial color="#555" /></mesh>)}</group>; }
function Door({ index, centerX, centerY, width, height, depth, thickness, open, handleY = 0 }) {
  const hingeSide = index === 1 ? -1 : index === 2 ? 1 : -1;
  const hingeX = centerX + hingeSide * width / 2;
  return <group position={[hingeX, centerY, depth / 2 + thickness / 2 + .002]} rotation={[0, open ? -hingeSide * Math.PI * .58 : 0, 0]}>
    <Panel position={[-hingeSide * width / 2, 0, 0]} size={[width, height, thickness]} color="#d8c3a5" />
    <mesh position={[-hingeSide * width * .18, handleY, thickness / 2 + .012]}><boxGeometry args={[.025, Math.min(.16, height * .35), .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
function SlidingDoor({ index, centerX, width, height, centerY, centerZ, thickness, openOffset }) {
  return <group position={[centerX + openOffset, centerY, centerZ]}>
    <Panel position={[0, 0, 0]} size={[width, height, thickness]} color="#d8c3a5" />
    <mesh position={[index === 2 ? -width * .32 : width * .32, 0, thickness / 2 + .012]}><boxGeometry args={[.025, .16, .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
function SlidingTrack({ position, width, depth = .018 }) { return <mesh position={position}><boxGeometry args={[width, .018, depth]} /><meshStandardMaterial color="#777f87" metalness={.7} roughness={.3} /><Edges color="#42484d" threshold={15} scale={1.001} /></mesh>; }

export default function Wardrobe({ height, depth, thickness = .015, backThickness = .003, drawerDimensions, drawerFrontConfig, structure }) {
  const s = structure, cfg = s.config, opening = s.openingWidthCm / 100, drawerWidth = s.drawerBoxWidthCm / 100, drawerDepth = s.drawerDepthCm / 100;
  const shelfDepth = depth - thickness, rodLength = Math.max(0, opening - .04);
  return <group>
    <Panel position={[0, height / 2 - thickness / 2, s.isSlidingDoors ? s.slidingDoorExtensionCm / 200 : 0]} size={[s.externalWidthCm / 100, thickness, s.topDepthCm / 100]} color={TOP} />
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
    {s.isSlidingDoors && <>
      <Panel position={[0, -height / 2 + s.slidingLowerSupportHeightCm / 200, depth / 2 + s.slidingDoorExtensionCm / 100 - thickness / 2]} size={[s.externalWidthCm / 100, s.slidingLowerSupportHeightCm / 100, thickness]} />
      {Array.from({ length: s.slidingTrackCount }, (_, track) => {
        const z = depth / 2 + s.slidingDoorExtensionCm / 100 - thickness - track * thickness * .75;
        return <group key={`track-${track}`}><SlidingTrack position={[0, height / 2 - thickness - .009, z]} width={s.externalWidthCm / 100} /><SlidingTrack position={[0, -height / 2 + s.slidingLowerSupportHeightCm / 100 + .009, z]} width={s.externalWidthCm / 100} /></group>;
      })}
    </>}
    {cfg.showDoors && !cfg.showStructure && (s.isSlidingDoors
      ? s.slidingDoorClosedCentersXCm.map((x, index) => <SlidingDoor key={`sliding-door-${index}`} index={index} centerX={x / 100} width={s.slidingDoorWidthCm / 100} height={s.slidingDoorHeightCm / 100} centerY={(s.slidingLowerSupportHeightCm - thickness * 100) / 200} centerZ={depth / 2 + s.slidingDoorExtensionCm / 100 - thickness * (index % s.slidingTrackCount + 1)} thickness={thickness} openOffset={cfg.showOpenDoors ? s.slidingDoorOpenOffsetsXCm[index] / 100 : 0} />)
      : <>{s.bodyCentersXCm.map((x, index) => <Door key={`upper-door-${index}`} index={index} centerX={x / 100} centerY={s.upperDoorCenterYCm / 100} width={s.doorWidthCm / 100} height={s.upperDoorHeightCm / 100} depth={depth} thickness={thickness} open={cfg.showOpenDoors} />)}
        {s.bodyCentersXCm.map((x, index) => <Door key={`main-door-${index}`} index={index} centerX={x / 100} centerY={s.mainDoorCentersYCm[index] / 100} width={s.doorWidthCm / 100} height={s.mainDoorHeightsCm[index] / 100} depth={depth} thickness={thickness} open={cfg.showOpenDoors} handleY={index === 1 ? 0 : -s.mainDoorHeightsCm[index] / 400} />)}</>)}
  </group>;
}
