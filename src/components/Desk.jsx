import { Edges } from "@react-three/drei";
import Drawer from "./Drawer";
import DrawerSlides from "./DrawerSlides";
import { findManufacturingPiece } from "../utils/manufacturingGrid";

const MELAMINE = "#8b5a2b";
const TOP = "#b07d4f";
const DIVIDER = "#9a6840";

function MelaminePiece({ position, dimensions, color = MELAMINE }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshStandardMaterial color={color} />
    <Edges color="#49382d" threshold={15} scale={1.001} />
  </mesh>;
}

export default function Desk({ width, height, depth, thickness, backThickness, drawerDimensions, structure, manufacturingPieces = [] }) {
  const cut = (name, occurrence = 0) => findManufacturingPiece(manufacturingPieces, name, occurrence);
  const topPiece = cut("Tapa superior"), legPiece = cut("Lateral izquierdo"), dividerPiece = cut("Divisor módulo de cajones");
  const rearPiece = cut("Travesaño trasero"), bracePiece = cut("Refuerzo inferior módulo de cajones");
  const legHeight = (legPiece?.length ?? structure.legHeightCm) / 100;
  const moduleCenterX = structure.moduleCenterXCm / 100;
  const dividerCenterX = structure.dividerCenterXCm / 100;
  const firstDrawerBack = cut("Parte trasera de cajón"), firstDrawerSide = cut("Lateral izquierdo de cajón");
  const drawerWidth = (firstDrawerBack ? firstDrawerBack.length + thickness * 200 : drawerDimensions.externalWidthCm) / 100;
  const drawerDepth = (firstDrawerSide?.length ?? structure.drawerDepthCm) / 100;
  const drawerFront = { widthCm: structure.drawerFrontWidthCm, heightCm: structure.drawerFrontHeightCm };
  const sideHeight = structure.drawerSideHeightCm / 100;
  const rearHeight = (rearPiece?.width ?? structure.rearCrossbarHeightCm) / 100;
  const braceHeight = (bracePiece?.width ?? structure.moduleBraceHeightCm) / 100;
  const openingWidth = (bracePiece?.length ?? structure.drawerOpeningWidthCm) / 100;
  const slideThickness = Math.max(.004, Math.min(.008, Math.min(drawerDimensions.leftClearanceCm, drawerDimensions.rightClearanceCm) / 200));
  const slideHeight = Math.max(.012, thickness * .8);
  const closedDrawerCenterZ = depth / 2 - drawerDepth / 2;

  return <group>
    <MelaminePiece position={[0, height / 2 - thickness / 2, 0]} dimensions={[(topPiece?.length ?? width * 100) / 100, thickness, (topPiece?.width ?? depth * 100) / 100]} color={TOP} />
    <MelaminePiece position={[-width / 2 + thickness / 2, -thickness / 2, 0]} dimensions={[thickness, legHeight, (legPiece?.width ?? depth * 100) / 100]} />
    <MelaminePiece position={[width / 2 - thickness / 2, -thickness / 2, 0]} dimensions={[thickness, legHeight, (legPiece?.width ?? depth * 100) / 100]} />
    {structure.drawerCount > 0 && <MelaminePiece position={[dividerCenterX, -thickness / 2, thickness / 2]} dimensions={[thickness, (dividerPiece?.length ?? structure.legHeightCm) / 100, (dividerPiece?.width ?? (depth - thickness) * 100) / 100]} color={DIVIDER} />}
    <MelaminePiece position={[0, height / 2 - thickness - rearHeight / 2, -depth / 2 + thickness / 2]} dimensions={[(rearPiece?.length ?? (width - thickness * 2) * 100) / 100, rearHeight, thickness]} />
    {structure.drawerCount > 0 && <MelaminePiece position={[moduleCenterX, -height / 2 + braceHeight / 2, depth / 2 - thickness / 2]} dimensions={[openingWidth, braceHeight, thickness]} color={DIVIDER} />}

    {structure.valid && structure.drawerLayouts.map((layout) => <group key={layout.index}>
      <Drawer
        width={drawerWidth}
        height={structure.drawerFrontHeightCm / 100}
        depth={drawerDepth}
        thickness={thickness}
        baseThickness={backThickness}
        frontDimensions={drawerFront}
        manufacturingDimensions={(() => { const front = cut(["Frente cajón superior", "Frente cajón central", "Frente cajón inferior"][layout.index] || `Frente cajón ${layout.index + 1}`), side = cut("Lateral izquierdo de cajón", layout.index), back = cut("Parte trasera de cajón", layout.index), bottom = cut("Base de cartón prensado del cajón", layout.index); return { frontWidthCm: front?.length, frontHeightCm: front?.width, sideDepthCm: side?.length, sideHeightCm: side?.width, backWidthCm: back?.length, backHeightCm: back?.width, bottomWidthCm: bottom?.length, bottomDepthCm: bottom?.width, boxWidthCm: back ? back.length + thickness * 200 : undefined }; })()}
        sideHeightOverride={sideHeight}
        physicalGeometry={{ frontCenterY: layout.frontCenterYCm / 100, structureCenterY: layout.structureCenterYCm / 100, bottomCenterY: layout.bottomCenterYCm / 100 }}
        showEdges
        position={[moduleCenterX, 0, layout.centerZCm / 100]}
      />
      <DrawerSlides centerX={moduleCenterX} centerY={layout.slideCenterYCm / 100} closedCenterZ={closedDrawerCenterZ} drawerWidth={drawerWidth} drawerDepth={drawerDepth} slideThickness={slideThickness} slideHeight={slideHeight} openOffset={structure.drawerOpenOffsetCm / 100} />
    </group>)}
  </group>;
}
