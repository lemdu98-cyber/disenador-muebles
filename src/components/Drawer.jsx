import { calculateDrawerBottomDimensions } from "../utils/drawerBottom";
import { calculateDrawerFrontDimensions } from "../utils/drawerFront";
import { Edges } from "@react-three/drei";
import MelaminePanel from "./MelaminePanel.jsx";

const MELAMINE = "#d8c3a5";
const HARDBOARD = "#b98b5d";

/** A drawer whose width and depth are its complete external dimensions. */
export default function Drawer({
  width,
  height,
  depth,
  position = [0, 0, 0],
  thickness = .015,
  baseThickness = .003,
  drawerFrontConfig,
  frontDimensions,
  frontCenterYOffset = 0,
  sideHeightOverride,
  physicalGeometry,
  manufacturingDimensions,
  showEdges = false,
}) {
  const manufactured = manufacturingDimensions ?? {};
  const boxWidth = manufactured.boxWidthCm ? manufactured.boxWidthCm / 100 : width;
  const sideDepth = manufactured.sideDepthCm ? manufactured.sideDepthCm / 100 : depth;
  const sideHeight = manufactured.sideHeightCm ? manufactured.sideHeightCm / 100 : (sideHeightOverride ?? Math.max(height * .72, .05));
  const bottom = calculateDrawerBottomDimensions({
    externalWidth: width,
    externalDepth: depth,
    internalWidth: width - thickness * 2,
    internalDepth: depth - thickness * 2,
    panelThickness: thickness,
    bottomThickness: baseThickness,
    drawerHeight: height,
  });
  const calculatedFront = calculateDrawerFrontDimensions({
    boxWidthCm: boxWidth * 100,
    boxFrontHeightCm: height * 100,
    drawerFrontConfig,
  });
  const front = frontDimensions ? { ...calculatedFront, ...frontDimensions } : calculatedFront;
  if (manufactured.frontWidthCm) front.widthCm = manufactured.frontWidthCm;
  if (manufactured.frontHeightCm) front.heightCm = manufactured.frontHeightCm;
  const backWidth = manufactured.backWidthCm ? manufactured.backWidthCm / 100 : boxWidth - thickness * 2;
  const backHeight = manufactured.backHeightCm ? manufactured.backHeightCm / 100 : sideHeight;
  const bottomWidth = manufactured.bottomWidthCm ? manufactured.bottomWidthCm / 100 : bottom.width;
  const bottomDepth = manufactured.bottomDepthCm ? manufactured.bottomDepthCm / 100 : bottom.depth;
  const frontCenterY = physicalGeometry?.frontCenterY ?? (front.topOverlayCm - front.bottomOverlayCm) / 200 + frontCenterYOffset;
  const structureCenterY = physicalGeometry?.structureCenterY ?? -height / 2 + sideHeight / 2;
  const bottomCenterY = physicalGeometry?.bottomCenterY ?? bottom.centerY;

  return <group position={position}>
    <MelaminePanel position={[0, frontCenterY, sideDepth / 2 + thickness / 2]} dimensions={[front.widthCm / 100, front.heightCm / 100, thickness]} piece={manufactured.frontPiece} orientation="front" color={MELAMINE} showEdges={showEdges} />
    <MelaminePanel position={[-boxWidth / 2 + thickness / 2, structureCenterY, 0]} dimensions={[thickness, sideHeight, sideDepth]} piece={manufactured.sideLeftPiece} orientation="side" color={MELAMINE} showEdges={showEdges} />
    <MelaminePanel position={[boxWidth / 2 - thickness / 2, structureCenterY, 0]} dimensions={[thickness, sideHeight, sideDepth]} piece={manufactured.sideRightPiece} orientation="side" color={MELAMINE} showEdges={showEdges} />
    <MelaminePanel position={[0, structureCenterY, -sideDepth / 2 + thickness / 2]} dimensions={[backWidth, backHeight, thickness]} piece={manufactured.backPiece} orientation="front" color={MELAMINE} showEdges={showEdges} />
    <mesh position={[0, bottomCenterY, bottom.centerZ]}><boxGeometry args={[bottomWidth, bottom.thickness, bottomDepth]} /><meshStandardMaterial color={HARDBOARD} />{showEdges && <Edges color="#62462f" threshold={15} scale={1.002} />}</mesh>
    <mesh position={[0, frontCenterY, sideDepth / 2 + thickness / 2]}><boxGeometry args={[Math.min(boxWidth * .32, .16), Math.max(.012, height * .07), .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
