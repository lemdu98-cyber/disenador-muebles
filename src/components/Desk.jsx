import Drawer from "./Drawer";
import DrawerSlides from "./DrawerSlides";
import { findManufacturingPiece } from "../utils/manufacturingGrid";
import MelaminePanel from "./MelaminePanel.jsx";

const TOP = "#b07d4f";
const DIVIDER = "#9a6840";

export default function Desk({ width, height, depth, thickness, backThickness, drawerDimensions, structure, manufacturingPieces = [], highlightedComponentIds }) {
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
    <MelaminePanel position={[0, height / 2 - thickness / 2, 0]} dimensions={[(topPiece?.length ?? width * 100) / 100, thickness, (topPiece?.width ?? depth * 100) / 100]} piece={topPiece} orientation="horizontal" color={TOP} highlighted={highlightedComponentIds?.has("desk.top")} />
    <MelaminePanel position={[-width / 2 + thickness / 2, -thickness / 2, 0]} dimensions={[thickness, legHeight, (legPiece?.width ?? depth * 100) / 100]} piece={legPiece} orientation="side" highlighted={highlightedComponentIds?.has("desk.leftSide")} />
    <MelaminePanel position={[width / 2 - thickness / 2, -thickness / 2, 0]} dimensions={[thickness, legHeight, (cut("Lateral derecho")?.width ?? depth * 100) / 100]} piece={cut("Lateral derecho")} orientation="side" highlighted={highlightedComponentIds?.has("desk.rightSide")} />
    {structure.drawerCount > 0 && <MelaminePanel position={[dividerCenterX, -thickness / 2, thickness / 2]} dimensions={[thickness, (dividerPiece?.length ?? structure.legHeightCm) / 100, (dividerPiece?.width ?? (depth - thickness) * 100) / 100]} piece={dividerPiece} orientation="side" color={DIVIDER} highlighted={highlightedComponentIds?.has("desk.divider")} />}
    <MelaminePanel position={[0, height / 2 - thickness - rearHeight / 2, -depth / 2 + thickness / 2]} dimensions={[(rearPiece?.length ?? (width - thickness * 2) * 100) / 100, rearHeight, thickness]} piece={rearPiece} orientation="front" highlighted={highlightedComponentIds?.has("desk.rearCrossbar")} />
    {structure.drawerCount > 0 && <MelaminePanel position={[moduleCenterX, -height / 2 + braceHeight / 2, depth / 2 - thickness / 2]} dimensions={[openingWidth, braceHeight, thickness]} piece={bracePiece} orientation="front" color={DIVIDER} />}

    {structure.valid && structure.drawerLayouts.map((layout) => <group key={layout.index}>
      <Drawer
        width={drawerWidth}
        height={structure.drawerFrontHeightCm / 100}
        depth={drawerDepth}
        thickness={thickness}
        baseThickness={backThickness}
        frontDimensions={drawerFront}
        manufacturingDimensions={(() => { const front = cut(["Frente cajón superior", "Frente cajón central", "Frente cajón inferior"][layout.index] || `Frente cajón ${layout.index + 1}`), side = cut("Lateral izquierdo de cajón", layout.index), back = cut("Parte trasera de cajón", layout.index), bottom = cut("Base de cartón prensado del cajón", layout.index); return { frontWidthCm: front?.length, frontHeightCm: front?.width, sideDepthCm: side?.length, sideHeightCm: side?.width, backWidthCm: back?.length, backHeightCm: back?.width, bottomWidthCm: bottom?.length, bottomDepthCm: bottom?.width, boxWidthCm: back ? back.length + thickness * 200 : undefined, frontPiece: front, sideLeftPiece: side, sideRightPiece: cut("Lateral derecho de cajón", layout.index), backPiece: back, bottomPiece: bottom }; })()}
        sideHeightOverride={sideHeight}
        physicalGeometry={{ frontCenterY: layout.frontCenterYCm / 100, structureCenterY: layout.structureCenterYCm / 100, bottomCenterY: layout.bottomCenterYCm / 100 }}
        showEdges
        position={[moduleCenterX, 0, layout.centerZCm / 100]}
        drawerComponentId={`desk.drawer.${layout.index + 1}`}
        highlightedComponentIds={highlightedComponentIds}
      />
      <DrawerSlides centerX={moduleCenterX} centerY={layout.slideCenterYCm / 100} closedCenterZ={closedDrawerCenterZ} drawerWidth={drawerWidth} drawerDepth={drawerDepth} slideThickness={slideThickness} slideHeight={slideHeight} openOffset={structure.drawerOpenOffsetCm / 100} />
    </group>)}
  </group>;
}
