import { calculateDrawerBottomDimensions } from "../utils/drawerBottom";
import { calculateDrawerFrontDimensions } from "../utils/drawerFront";
import { Edges } from "@react-three/drei";

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
  showEdges = false,
}) {
  const sideHeight = sideHeightOverride ?? Math.max(height * .72, .05);
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
    boxWidthCm: width * 100,
    boxFrontHeightCm: height * 100,
    drawerFrontConfig,
  });
  const front = frontDimensions ? { ...calculatedFront, ...frontDimensions } : calculatedFront;
  const frontCenterY = physicalGeometry?.frontCenterY ?? (front.topOverlayCm - front.bottomOverlayCm) / 200 + frontCenterYOffset;
  const structureCenterY = physicalGeometry?.structureCenterY ?? -height / 2 + sideHeight / 2;
  const bottomCenterY = physicalGeometry?.bottomCenterY ?? bottom.centerY;

  return <group position={position}>
    <mesh position={[0, frontCenterY, depth / 2 + thickness / 2]}><boxGeometry args={[front.widthCm / 100, front.heightCm / 100, thickness]} /><meshStandardMaterial color={MELAMINE} />{showEdges && <Edges color="#49382d" threshold={15} scale={1.001} />}</mesh>
    {[-1, 1].map((side) => <mesh key={side} position={[side * (width / 2 - thickness / 2), structureCenterY, 0]}><boxGeometry args={[thickness, sideHeight, depth]} /><meshStandardMaterial color={MELAMINE} />{showEdges && <Edges color="#49382d" threshold={15} scale={1.001} />}</mesh>)}
    <mesh position={[0, structureCenterY, -depth / 2 + thickness / 2]}><boxGeometry args={[width - thickness * 2, sideHeight, thickness]} /><meshStandardMaterial color={MELAMINE} />{showEdges && <Edges color="#49382d" threshold={15} scale={1.001} />}</mesh>
    <mesh position={[0, bottomCenterY, bottom.centerZ]}><boxGeometry args={[bottom.width, bottom.thickness, bottom.depth]} /><meshStandardMaterial color={HARDBOARD} />{showEdges && <Edges color="#62462f" threshold={15} scale={1.002} />}</mesh>
    <mesh position={[0, frontCenterY, depth / 2 + thickness / 2]}><boxGeometry args={[Math.min(width * .32, .16), Math.max(.012, height * .07), .018]} /><meshStandardMaterial color="#3d3027" /></mesh>
  </group>;
}
