import { calculateDrawerBottomDimensions } from "../utils/drawerBottom";
import { calculateDrawerFrontDimensions } from "../utils/drawerFront";
import { Edges } from "@react-three/drei";
import MelaminePanel from "./MelaminePanel.jsx";
import { getDrawerGeometry } from "../utils/drawerGeometry";

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
  const geometry = getDrawerGeometry({ boxWidthCm: boxWidth * 100, drawerHeightCm: height * 100, sideDepthCm: sideDepth * 100, sideHeightCm: sideHeight * 100, thicknessCm: thickness * 100, bottomThicknessCm: bottom.thickness * 100, frontWidthCm: front.widthCm, frontHeightCm: front.heightCm, backWidthCm: backWidth * 100, backHeightCm: backHeight * 100, bottomWidthCm: bottomWidth * 100, bottomDepthCm: bottomDepth * 100, frontCenterYCm: frontCenterY * 100, structureCenterYCm: structureCenterY * 100, bottomCenterYCm: bottomCenterY * 100, bottomCenterZCm: bottom.centerZ * 100 });

  return <group position={position}>
    <MelaminePanel position={[geometry.front.position.xCm / 100, geometry.front.position.yCm / 100, geometry.front.position.zCm / 100]} dimensions={[geometry.front.dimensions.widthCm / 100, geometry.front.dimensions.depthCm / 100, geometry.front.dimensions.heightCm / 100]} piece={manufactured.frontPiece} orientation="front" color={MELAMINE} showEdges={showEdges} />
    <MelaminePanel position={[geometry.leftSide.position.xCm / 100, geometry.leftSide.position.yCm / 100, geometry.leftSide.position.zCm / 100]} dimensions={[geometry.leftSide.dimensions.heightCm / 100, geometry.leftSide.dimensions.widthCm / 100, geometry.leftSide.dimensions.depthCm / 100]} piece={manufactured.sideLeftPiece} orientation="side" color={MELAMINE} showEdges={showEdges} />
    <MelaminePanel position={[geometry.rightSide.position.xCm / 100, geometry.rightSide.position.yCm / 100, geometry.rightSide.position.zCm / 100]} dimensions={[geometry.rightSide.dimensions.heightCm / 100, geometry.rightSide.dimensions.widthCm / 100, geometry.rightSide.dimensions.depthCm / 100]} piece={manufactured.sideRightPiece} orientation="side" color={MELAMINE} showEdges={showEdges} />
    <MelaminePanel position={[geometry.back.position.xCm / 100, geometry.back.position.yCm / 100, geometry.back.position.zCm / 100]} dimensions={[geometry.back.dimensions.widthCm / 100, geometry.back.dimensions.depthCm / 100, geometry.back.dimensions.heightCm / 100]} piece={manufactured.backPiece} orientation="front" color={MELAMINE} showEdges={showEdges} />
    <mesh position={[geometry.bottom.position.xCm / 100, geometry.bottom.position.yCm / 100, geometry.bottom.position.zCm / 100]}><boxGeometry args={[geometry.bottom.dimensions.widthCm / 100, geometry.bottom.dimensions.heightCm / 100, geometry.bottom.dimensions.depthCm / 100]} /><meshStandardMaterial color={HARDBOARD} />{showEdges && <Edges color="#62462f" threshold={15} scale={1.002} />}</mesh>
    <mesh position={[0, frontCenterY, sideDepth / 2 + thickness / 2]}><boxGeometry args={[Math.min(boxWidth * .32, .16), Math.max(.012, height * .07), .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
