import { Edges } from "@react-three/drei";

const FIXED = "#7f888f";
const MOVING = "#a5adb3";

function SlideRail({ position, dimensions, color }) {
  return <mesh position={position} castShadow>
    <boxGeometry args={dimensions} />
    <meshStandardMaterial color={color} metalness={.72} roughness={.3} />
    <Edges color="#42484d" threshold={15} scale={1.001} />
  </mesh>;
}

export default function DrawerSlides({
  centerX = 0, centerY, closedCenterZ, drawerWidth, drawerDepth,
  slideThickness, slideHeight, openOffset = 0,
}) {
  const halfThickness = slideThickness / 2;
  return [-1, 1].map((side) => <group key={side}>
    <SlideRail
      position={[centerX + side * (drawerWidth / 2 + halfThickness * 1.5), centerY, closedCenterZ]}
      dimensions={[halfThickness, slideHeight, drawerDepth]}
      color={FIXED}
    />
    <SlideRail
      position={[centerX + side * (drawerWidth / 2 + halfThickness / 2), centerY, closedCenterZ + openOffset]}
      dimensions={[halfThickness, slideHeight, drawerDepth]}
      color={MOVING}
    />
  </group>);
}
