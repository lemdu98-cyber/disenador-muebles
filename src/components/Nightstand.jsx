import Drawer from "./Drawer";
import { calculateBackPanelDimensions } from "../utils/backPanel";

const MELAMINE = "#8b5a2b";
const TOP = "#b07d4f";
const HARDBOARD = "#b98b5d";

export default function Nightstand({ width, height, depth, drawers, thickness = .015, backThickness = .003, drawerDimensions }) {
  const usableHeight = height - thickness;
  const drawerHeight = drawers ? (usableHeight - .045) / drawers : 0;
  const backPanel = calculateBackPanelDimensions({ externalWidth: width, externalHeight: height, panelThickness: thickness, backPanelThickness: backThickness, hasTop: true, hasBottom: false, furnitureDepth: depth });
  return <group>
    <mesh position={[0, height / 2 - thickness / 2, 0]}><boxGeometry args={[width, thickness, depth]} /><meshStandardMaterial color={TOP} /></mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), -thickness / 2, 0]}><boxGeometry args={[thickness, usableHeight, depth]} /><meshStandardMaterial color={MELAMINE} /></mesh>)}
    <mesh position={[0, 0, backPanel.centerZ]}><boxGeometry args={[backPanel.width, backPanel.height, backPanel.thickness]} /><meshStandardMaterial color={HARDBOARD} /></mesh>
    {drawerDimensions.hasEnoughDepth && Array.from({ length: drawers }).map((_, index) => <Drawer key={index} width={drawerDimensions.externalWidthCm / 100} height={drawerHeight - .012} depth={drawerDimensions.sideLengthCm / 100} thickness={thickness} baseThickness={backThickness} position={[0, height / 2 - thickness - drawerHeight / 2 - index * drawerHeight, 0]} />)}
    {drawers === 0 && <mesh position={[0, -height * .05, 0]}><boxGeometry args={[width - thickness * 2, thickness, depth - thickness]} /><meshStandardMaterial color={MELAMINE} /></mesh>}
  </group>;
}
