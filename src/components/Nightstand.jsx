import Drawer from "./Drawer";
import { calculateBackPanelDimensions } from "../utils/backPanel";
import { Edges } from "@react-three/drei";
import DrawerSlides from "./DrawerSlides";
import { calculateDrawerOpenOffsetCm } from "../utils/drawerVisualization";
import { findManufacturingPiece } from "../utils/manufacturingGrid";

const MELAMINE = "#8b5a2b", TOP = "#b07d4f", HARDBOARD = "#b98b5d";

export default function Nightstand({ width, height, depth, drawers, thickness = .015, backThickness = .003, drawerDimensions, drawerFrontConfig, structure, manufacturingPieces = [] }) {
  const cut = (name, occurrence = 0) => findManufacturingPiece(manufacturingPieces, name, occurrence);
  const topPiece = cut("Tapa superior"), sidePiece = cut("Laterales"), backPiece = cut("Fondo de cartón prensado");
  const rearPiece = cut("Travesaño trasero inferior"), frontPiece = cut("Travesaño frontal inferior"), shelfPiece = cut("Repisa interior");
  const usableHeight = (sidePiece?.length ?? height * 100 - thickness * 100) / 100;
  const drawerHeight = drawers ? structure.drawerSlotHeightCm / 100 : 0;
  const rearHeight = (rearPiece?.width ?? structure.rearHeightCm) / 100;
  const frontHeight = (frontPiece?.width ?? structure.frontHeightCm) / 100;
  const topDepth = (topPiece?.width ?? structure.topDepthCm) / 100;
  const firstDrawerBack = cut("Parte trasera de cajón"), firstDrawerSide = cut("Lateral izquierdo de cajón");
  const drawerDepth = (firstDrawerSide?.length ?? drawerDimensions.sideLengthCm) / 100;
  const drawerFront = { widthCm: structure.drawerFrontWidthCm, heightCm: structure.drawerFrontHeightCm };
  const drawerBoxWidth = (firstDrawerBack ? firstDrawerBack.length + thickness * 200 : drawerDimensions.externalWidthCm) / 100;
  const cabinetInnerWidth = width - thickness * 2;
  const slideThickness = Math.max(.004, Math.min(.008, (cabinetInnerWidth - drawerBoxWidth) / 4));
  const slideHeight = Math.max(.012, thickness * .8);
  const closedDrawerCenterZ = depth / 2 - drawerDepth / 2;
  const drawerOpenOffset = calculateDrawerOpenOffsetCm(drawerDimensions.sideLengthCm, structure.config.showOpenDrawers) / 100;
  const backPanel = calculateBackPanelDimensions({ externalWidth: width, externalHeight: height, panelThickness: thickness, backPanelThickness: backThickness, hasTop: true, hasBottom: false, furnitureDepth: depth });
  const drawerCuts = (index) => {
    const front = cut("Frente de cajón", index), side = cut("Lateral izquierdo de cajón", index), back = cut("Parte trasera de cajón", index), bottom = cut("Base de cartón prensado del cajón", index);
    return { frontWidthCm: front?.length, frontHeightCm: front?.width, sideDepthCm: side?.length, sideHeightCm: side?.width, backWidthCm: back?.length, backHeightCm: back?.width, bottomWidthCm: bottom?.length, bottomDepthCm: bottom?.width, boxWidthCm: back ? back.length + thickness * 200 : undefined };
  };
  return <group>
    <mesh position={[0, height / 2 - thickness / 2, thickness / 2]}><boxGeometry args={[(topPiece?.length ?? width * 100) / 100, thickness, topDepth]} /><meshStandardMaterial color={TOP} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), -thickness / 2, 0]}><boxGeometry args={[thickness, usableHeight, (sidePiece?.width ?? depth * 100) / 100]} /><meshStandardMaterial color={MELAMINE} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>)}
    <mesh position={[0, 0, backPanel.centerZ]}><boxGeometry args={[(backPiece?.length ?? backPanel.width * 100) / 100, (backPiece?.width ?? backPanel.height * 100) / 100, backPanel.thickness]} /><meshStandardMaterial color={HARDBOARD} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>
    {structure.config.rearEnabled && <mesh position={[0, -height / 2 + rearHeight / 2, -depth / 2 + thickness / 2]} castShadow receiveShadow><boxGeometry args={[(rearPiece?.length ?? (width - thickness * 2) * 100) / 100, rearHeight, thickness]} /><meshStandardMaterial color={MELAMINE} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>}
    {structure.config.frontEnabled && structure.valid && <mesh position={[0, -height / 2 + frontHeight / 2, depth / 2 - thickness / 2]} castShadow receiveShadow><boxGeometry args={[(frontPiece?.length ?? (width - thickness * 2) * 100) / 100, frontHeight, thickness]} /><meshStandardMaterial color={MELAMINE} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>}
    {drawerDimensions.hasEnoughDepth && structure.valid && structure.drawerGeometry.drawerLayouts.map((layout) => <group key={layout.index}>
      <Drawer width={drawerBoxWidth} height={drawerHeight - .012} depth={drawerDepth} thickness={thickness} baseThickness={structure.drawerGeometry.bottomThicknessCm / 100} drawerFrontConfig={drawerFrontConfig} frontDimensions={drawerFront} manufacturingDimensions={drawerCuts(layout.index)} sideHeightOverride={structure.drawerSideHeightCm / 100} physicalGeometry={{ frontCenterY: layout.frontCenterYCm / 100, structureCenterY: layout.structureCenterYCm / 100, bottomCenterY: layout.bottomCenterYCm / 100 }} showEdges position={[0, 0, closedDrawerCenterZ + drawerOpenOffset]} />
      <DrawerSlides centerY={layout.slideCenterYCm / 100} closedCenterZ={closedDrawerCenterZ} drawerWidth={(drawerCuts(layout.index).boxWidthCm ?? drawerDimensions.externalWidthCm) / 100} drawerDepth={(drawerCuts(layout.index).sideDepthCm ?? drawerDimensions.sideLengthCm) / 100} slideThickness={slideThickness} slideHeight={slideHeight} openOffset={drawerOpenOffset} />
    </group>)}
    {drawers === 0 && <mesh position={[0, -height * .05, 0]}><boxGeometry args={[(shelfPiece?.length ?? (width - thickness * 2) * 100) / 100, thickness, (shelfPiece?.width ?? (depth - thickness) * 100) / 100]} /><meshStandardMaterial color={MELAMINE} /></mesh>}
  </group>;
}
