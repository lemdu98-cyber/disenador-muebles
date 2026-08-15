import { Edges } from "@react-three/drei";
import Drawer from "./Drawer";

const MELAMINE = "#8b5a2b";
const TOP = "#b07d4f";
const DIVIDER = "#9a6840";
const METAL = "#8d969d";

function MelaminePiece({ position, dimensions, color = MELAMINE }) {
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    <meshStandardMaterial color={color} />
    <Edges color="#49382d" threshold={15} scale={1.001} />
  </mesh>;
}

export default function Desk({ width, height, depth, thickness, backThickness, drawerDimensions, structure }) {
  const legHeight = structure.legHeightCm / 100;
  const moduleCenterX = structure.moduleCenterXCm / 100;
  const dividerCenterX = structure.dividerCenterXCm / 100;
  const drawerWidth = drawerDimensions.externalWidthCm / 100;
  const drawerDepth = structure.drawerDepthCm / 100;
  const drawerFront = { widthCm: structure.drawerFrontWidthCm, heightCm: structure.drawerFrontHeightCm };
  const sideHeight = structure.drawerSideHeightCm / 100;
  const rearHeight = structure.rearCrossbarHeightCm / 100;
  const braceHeight = structure.moduleBraceHeightCm / 100;
  const openingWidth = structure.drawerOpeningWidthCm / 100;
  const slideThickness = Math.max(.004, Math.min(.008, Math.min(drawerDimensions.leftClearanceCm, drawerDimensions.rightClearanceCm) / 200));
  const slideHeight = Math.max(.012, thickness * .8);
  const closedDrawerCenterZ = depth / 2 - drawerDepth / 2;

  return <group>
    <MelaminePiece position={[0, height / 2 - thickness / 2, 0]} dimensions={[width, thickness, depth]} color={TOP} />
    <MelaminePiece position={[-width / 2 + thickness / 2, -thickness / 2, 0]} dimensions={[thickness, legHeight, depth]} />
    <MelaminePiece position={[width / 2 - thickness / 2, -thickness / 2, 0]} dimensions={[thickness, legHeight, depth]} />
    {structure.drawerCount > 0 && <MelaminePiece position={[dividerCenterX, -thickness / 2, thickness / 2]} dimensions={[thickness, legHeight, depth - thickness]} color={DIVIDER} />}
    <MelaminePiece position={[0, height / 2 - thickness - rearHeight / 2, -depth / 2 + thickness / 2]} dimensions={[width - thickness * 2, rearHeight, thickness]} />
    {structure.drawerCount > 0 && <MelaminePiece position={[moduleCenterX, -height / 2 + braceHeight / 2, depth / 2 - thickness / 2]} dimensions={[openingWidth, braceHeight, thickness]} color={DIVIDER} />}

    {structure.valid && structure.drawerLayouts.map((layout) => <group key={layout.index}>
      <Drawer
        width={drawerWidth}
        height={structure.drawerFrontHeightCm / 100}
        depth={drawerDepth}
        thickness={thickness}
        baseThickness={backThickness}
        frontDimensions={drawerFront}
        sideHeightOverride={sideHeight}
        physicalGeometry={{ frontCenterY: layout.frontCenterYCm / 100, structureCenterY: layout.structureCenterYCm / 100, bottomCenterY: layout.bottomCenterYCm / 100 }}
        showEdges
        position={[moduleCenterX, 0, layout.centerZCm / 100]}
      />
      {[-1, 1].map((side) => <mesh key={side} position={[moduleCenterX + side * (drawerWidth / 2 + slideThickness / 2), layout.slideCenterYCm / 100, closedDrawerCenterZ]} castShadow>
        <boxGeometry args={[slideThickness, slideHeight, drawerDepth]} />
        <meshStandardMaterial color={METAL} metalness={.72} roughness={.3} />
        <Edges color="#42484d" threshold={15} scale={1.001} />
      </mesh>)}
    </group>)}
  </group>;
}
