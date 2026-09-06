import { Edges } from "@react-three/drei";
import Drawer from "./Drawer";
import DrawerSlides from "./DrawerSlides";
import { calculateLeftHingedDoorTransform } from "../utils/wardrobeDoors";
import { findManufacturingPiece } from "../utils/manufacturingGrid";

const MELAMINE = "#8b5a2b", TOP = "#b07d4f", HARDBOARD = "#b98b5d";
function Panel({ position, size, color = MELAMINE, transparent = false }) { return <mesh position={position}><boxGeometry args={size} /><meshStandardMaterial color={color} transparent={transparent} opacity={transparent ? .2 : 1} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>; }
function Rod({ centerX, y, length }) { return <group><mesh position={[centerX, y, .03]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[.012, .012, length, 20]} /><meshStandardMaterial color="#777f87" /></mesh>{[-1, 1].map((side) => <mesh key={side} position={[centerX + side * length / 2, y, .03]} rotation={[Math.PI / 2, 0, 0]}><cylinderGeometry args={[.025, .025, .012, 20]} /><meshStandardMaterial color="#555" /></mesh>)}</group>; }
function Door({ centerX, centerY, width, height, depth, thickness, open, handleY = 0 }) {
  const transform = calculateLeftHingedDoorTransform({ centerX, width, open });
  return <group position={[transform.hingeX, centerY, depth / 2 + thickness / 2 + .002]} rotation={[0, transform.rotationY, 0]}>
    <Panel position={[transform.panelCenterX, 0, 0]} size={[width, height, thickness]} color="#d8c3a5" />
    <mesh position={[transform.handleCenterX, handleY, thickness / 2 + .012]}><boxGeometry args={[.025, Math.min(.16, height * .35), .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
function SlidingDoor({ index, centerX, width, height, centerY, centerZ, thickness, openOffset }) {
  return <group position={[centerX + openOffset, centerY, centerZ]}>
    <Panel position={[0, 0, 0]} size={[width, height, thickness]} color="#d8c3a5" />
    <mesh position={[index === 2 ? -width * .32 : width * .32, 0, thickness / 2 + .012]}><boxGeometry args={[.025, .16, .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
function SlidingTrack({ position, width, depth = .018 }) { return <mesh position={position}><boxGeometry args={[width, .018, depth]} /><meshStandardMaterial color="#777f87" metalness={.7} roughness={.3} /><Edges color="#42484d" threshold={15} scale={1.001} /></mesh>; }

export default function Wardrobe({ height, depth, thickness = .015, backThickness = .003, drawerDimensions, drawerFrontConfig, structure, manufacturingPieces = [] }) {
  const s = structure, cfg = s.config, drawerDepth = s.drawerDepthCm / 100;
  const cut = (name) => findManufacturingPiece(manufacturingPieces, name);
  const size = (name, axis, fallback) => (cut(name)?.[axis] ?? fallback) / 100;
  const shelfDepth = size("Repisa superior Cuerpo 1", "width", (depth - thickness) * 100);
  const topName = s.isSlidingDoors ? "Tapa superior extendida" : "Tapa superior";
  return <group>
    <Panel position={[0, height / 2 - thickness / 2, s.isSlidingDoors ? s.slidingDoorExtensionCm / 200 : 0]} size={[size(topName, "length", s.externalWidthCm), thickness, size(topName, "width", s.topDepthCm)]} color={TOP} />
    {s.bodyCentersXCm.map((x, index) => <group key={`module-${index}`}>
      <Panel position={[x / 100, s.upperShelfYCm / 100, 0]} size={[size(`Repisa superior Cuerpo ${index + 1}`, "length", s.sectionWidthsCm[index]), thickness, shelfDepth]} />
      <Panel position={[s.backLayouts[index].centerXCm / 100, 0, -depth / 2 - backThickness / 2]} size={[size(`Fondo cartón prensado Cuerpo ${index + 1}`, "length", s.backLayouts[index].widthCm), size(`Fondo cartón prensado Cuerpo ${index + 1}`, "width", height * 100), backThickness]} color={HARDBOARD} transparent={cfg.showStructure} />
      {[1, -1].map((side) => { const name = `Travesaño ${side === 1 ? "frontal" : "trasero"} inferior Cuerpo ${index + 1}`; return <Panel key={`crossbar-${side}`} position={[x / 100, -height / 2 + s.lowerCrossbarHeightCm / 200, side * (depth / 2 - thickness / 2)]} size={[size(name, "length", s.sectionWidthsCm[index]), size(name, "width", s.lowerCrossbarHeightCm), thickness]} />; })}
    </group>)}
    {s.panelCentersXCm.map((x, index) => <Panel key={`vertical-${index}`} position={[x / 100, -thickness / 2, 0]} size={[thickness, height - thickness, depth]} />)}
    {[0, 2].map((bodyIndex) => <Panel key={`drawer-shelf-${bodyIndex}`} position={[s.bodyCentersXCm[bodyIndex] / 100, s.drawerShelfYCm / 100, 0]} size={[size(`Repisa sobre cajones Cuerpo ${bodyIndex + 1}`, "length", s.sectionWidthsCm[bodyIndex]), thickness, shelfDepth]} />)}
    {s.intermediateShelfYCentersCm.map((y, index) => <Panel key={`intermediate-${index}`} position={[s.bodyCentersXCm[0] / 100, y / 100, 0]} size={[size(`Repisa intermedia ${index + 1} Cuerpo 1`, "length", s.sectionWidthsCm[0]), thickness, shelfDepth]} />)}
    <Panel position={[s.bodyCentersXCm[1] / 100, s.shoeBottomShelfYCm / 100, 0]} size={[size("Repisa inferior zapatero Cuerpo 2", "length", s.sectionWidthsCm[1]), thickness, shelfDepth]} />
    {s.shoeShelfYCentersCm.map((y, index) => <Panel key={`shoe-${index}`} position={[s.bodyCentersXCm[1] / 100, y / 100, 0]} size={[size(`Repisa zapatos ${index + 1} Cuerpo 2`, "length", s.sectionWidthsCm[1]), thickness, shelfDepth]} />)}
    <Rod centerX={s.bodyCentersXCm[1] / 100} y={s.rodYCm / 100} length={Math.max(0, s.sectionWidthsCm[1] / 100 - .04)} />
    <Rod centerX={s.bodyCentersXCm[2] / 100} y={s.rodYCm / 100} length={Math.max(0, s.sectionWidthsCm[2] / 100 - .04)} />
    {drawerDimensions.hasEnoughDepth && s.drawerLayouts.map((layout) => <group key={`${layout.bodyIndex}-${layout.drawerIndex}`}>
      <Drawer width={layout.drawerBoxWidthCm / 100} height={s.drawerFrontHeightCm / 100} depth={drawerDepth} thickness={thickness} baseThickness={backThickness} drawerFrontConfig={drawerFrontConfig} frontDimensions={{ widthCm: layout.openingWidthCm - s.doorGapCm * 2, heightCm: s.drawerFrontHeightCm }} manufacturingDimensions={(() => { const drawer = layout.drawerIndex + 1, body = layout.bodyIndex + 1; const front = cut(`Frente Cajón ${drawer} Cuerpo ${body}`), side = cut(`Lateral izquierdo Cajón ${drawer} Cuerpo ${body}`), back = cut(`Parte trasera Cajón ${drawer} Cuerpo ${body}`), bottom = cut(`Base cartón prensado Cajón ${drawer} Cuerpo ${body}`); return { frontWidthCm: front?.length, frontHeightCm: front?.width, sideDepthCm: side?.length, sideHeightCm: side?.width, backWidthCm: back?.length, backHeightCm: back?.width, bottomWidthCm: bottom?.length, bottomDepthCm: bottom?.width, boxWidthCm: back ? back.length + thickness * 200 : undefined }; })()} sideHeightOverride={s.drawerSideHeightCm / 100} position={[layout.centerXCm / 100, layout.centerYCm / 100, layout.centerZCm / 100]} showEdges />
      <DrawerSlides centerX={layout.centerXCm / 100} centerY={layout.centerYCm / 100} closedCenterZ={depth / 2 - drawerDepth / 2} drawerWidth={(cut(`Parte trasera Cajón ${layout.drawerIndex + 1} Cuerpo ${layout.bodyIndex + 1}`)?.length + thickness * 200 || layout.drawerBoxWidthCm) / 100} drawerDepth={(cut(`Lateral izquierdo Cajón ${layout.drawerIndex + 1} Cuerpo ${layout.bodyIndex + 1}`)?.length ?? s.drawerDepthCm) / 100} slideThickness={Math.max(.004, drawerDimensions.totalClearanceCm / 400)} slideHeight={Math.max(.012, thickness * .8)} openOffset={layout.centerZCm / 100 - (depth / 2 - drawerDepth / 2)} />
    </group>)}
    {s.isSlidingDoors && <>
      <Panel position={[0, -height / 2 + s.slidingLowerSupportHeightCm / 200, depth / 2 + s.slidingDoorExtensionCm / 100 - thickness / 2]} size={[s.externalWidthCm / 100, s.slidingLowerSupportHeightCm / 100, thickness]} />
      {Array.from({ length: s.slidingTrackCount }, (_, track) => {
        const z = depth / 2 + s.slidingDoorExtensionCm / 100 - thickness - track * thickness * .75;
        return <group key={`track-${track}`}><SlidingTrack position={[0, height / 2 - thickness - .009, z]} width={s.externalWidthCm / 100} /><SlidingTrack position={[0, -height / 2 + s.slidingLowerSupportHeightCm / 100 + .009, z]} width={s.externalWidthCm / 100} /></group>;
      })}
    </>}
    {cfg.showDoors && !cfg.showStructure && (s.isSlidingDoors
      ? s.slidingDoorClosedCentersXCm.map((x, index) => <SlidingDoor key={`sliding-door-${index}`} index={index} centerX={x / 100} width={size(`Puerta corrediza ${index + 1}`, "width", s.slidingDoorWidthCm)} height={size(`Puerta corrediza ${index + 1}`, "length", s.slidingDoorHeightCm)} centerY={(s.slidingLowerSupportHeightCm - thickness * 100) / 200} centerZ={depth / 2 + s.slidingDoorExtensionCm / 100 - thickness * (index % s.slidingTrackCount + 1)} thickness={thickness} openOffset={cfg.showOpenDoors ? s.slidingDoorOpenOffsetsXCm[index] / 100 : 0} />)
      : <>{s.bodyCentersXCm.map((x, index) => <Door key={`upper-door-${index}`} centerX={x / 100} centerY={s.upperDoorCenterYCm / 100} width={size(`Puerta superior Cuerpo ${index + 1}`, "width", s.doorWidthsCm[index])} height={size(`Puerta superior Cuerpo ${index + 1}`, "length", s.upperDoorHeightCm)} depth={depth} thickness={thickness} open={cfg.showOpenDoors} />)}
        {s.bodyCentersXCm.map((x, index) => <Door key={`main-door-${index}`} centerX={x / 100} centerY={s.mainDoorCentersYCm[index] / 100} width={size(`Puerta principal Cuerpo ${index + 1}`, "width", s.doorWidthsCm[index])} height={size(`Puerta principal Cuerpo ${index + 1}`, "length", s.mainDoorHeightsCm[index])} depth={depth} thickness={thickness} open={cfg.showOpenDoors} handleY={index === 1 ? 0 : -size(`Puerta principal Cuerpo ${index + 1}`, "length", s.mainDoorHeightsCm[index]) / 4} />)}</>)}
  </group>;
}
