import Drawer from "./Drawer";
import { calculateBackPanelDimensions } from "../utils/backPanel";
import { Edges } from "@react-three/drei";

const MELAMINE = "#8b5a2b";
const TOP = "#b07d4f";
const HARDBOARD = "#b98b5d";

export default function Nightstand({ width, height, depth, drawers, thickness = .015, backThickness = .003, drawerDimensions, drawerFrontConfig, structure }) {
  const usableHeight = height - thickness;
  const drawerHeight = drawers ? structure.drawerSlotHeightCm / 100 : 0;
  const rearHeight = structure.rearHeightCm / 100;
  const frontHeight = structure.frontHeightCm / 100;
  const topDepth = structure.topDepthCm / 100;
  const drawerDepth = drawerDimensions.sideLengthCm / 100;
  const drawerFront = { widthCm: structure.drawerFrontWidthCm, heightCm: structure.drawerFrontHeightCm };
  const drawerBoxWidth = drawerDimensions.externalWidthCm / 100;
  const cabinetInnerWidth = width - thickness * 2;
  const slideThickness = Math.max(.004, Math.min(.008, (cabinetInnerWidth - drawerBoxWidth) / 4));
  const slideHeight = Math.max(.012, thickness * .8);
  const backPanel = calculateBackPanelDimensions({ externalWidth: width, externalHeight: height, panelThickness: thickness, backPanelThickness: backThickness, hasTop: true, hasBottom: false, furnitureDepth: depth });
  return <group>
    <mesh position={[0, height / 2 - thickness / 2, thickness / 2]}><boxGeometry args={[width, thickness, topDepth]} /><meshStandardMaterial color={TOP} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), -thickness / 2, 0]}><boxGeometry args={[thickness, usableHeight, depth]} /><meshStandardMaterial color={MELAMINE} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>)}
    <mesh position={[0, 0, backPanel.centerZ]}><boxGeometry args={[backPanel.width, backPanel.height, backPanel.thickness]} /><meshStandardMaterial color={HARDBOARD} /><Edges color="#49382d" threshold={15} scale={1.001} /></mesh>
    {structure.config.rearEnabled && <mesh position={[0, -height / 2 + rearHeight / 2, -depth / 2 + thickness / 2]} castShadow receiveShadow>
      <boxGeometry args={[width - thickness * 2, rearHeight, thickness]} />
      <meshStandardMaterial color={MELAMINE} />
      <Edges color="#49382d" threshold={15} scale={1.001} />
    </mesh>}
    {structure.config.frontEnabled && structure.valid && <mesh position={[0, -height / 2 + frontHeight / 2, depth / 2 - thickness / 2]} castShadow receiveShadow>
      <boxGeometry args={[width - thickness * 2, frontHeight, thickness]} />
      <meshStandardMaterial color={MELAMINE} />
      <Edges color="#49382d" threshold={15} scale={1.001} />
    </mesh>}
    {drawerDimensions.hasEnoughDepth && structure.valid && structure.drawerGeometry.drawerLayouts.map((layout) => <group key={layout.index}>
      <Drawer width={drawerBoxWidth} height={drawerHeight - .012} depth={drawerDepth} thickness={thickness} baseThickness={structure.drawerGeometry.bottomThicknessCm / 100} drawerFrontConfig={drawerFrontConfig} frontDimensions={drawerFront} sideHeightOverride={structure.drawerSideHeightCm / 100} physicalGeometry={{ frontCenterY: layout.frontCenterYCm / 100, structureCenterY: layout.structureCenterYCm / 100, bottomCenterY: layout.bottomCenterYCm / 100 }} showEdges position={[0, 0, depth / 2 - drawerDepth / 2]} />
      {[-1, 1].map((side) => <mesh key={side} position={[side * (drawerBoxWidth / 2 + slideThickness / 2), layout.slideCenterYCm / 100, depth / 2 - drawerDepth / 2]} castShadow>
        <boxGeometry args={[slideThickness, slideHeight, drawerDepth]} />
        <meshStandardMaterial color="#8d969d" metalness={.72} roughness={.3} />
        <Edges color="#42484d" threshold={15} scale={1.001} />
      </mesh>)}
    </group>)}
    {drawers === 0 && <mesh position={[0, -height * .05, 0]}><boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} /><meshStandardMaterial color={MELAMINE} /></mesh>}
  </group>;
}
