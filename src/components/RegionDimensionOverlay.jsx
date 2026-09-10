import { Line, Text } from "@react-three/drei";
import { useMemo } from "react";
import { buildRegionDimensionData, dimensionToMeters } from "../utils/furnitureRegionOverlay.js";

const labelFor = ({ type, valueCm, expectedCm }) => {
  const name = type === "overlap" ? "Overlap" : "Gap";
  const expected = Number.isFinite(expectedCm) && Math.abs(expectedCm - valueCm) > 1e-6 ? ` · cfg ${expectedCm.toFixed(2)}` : "";
  return `${name}: ${valueCm.toFixed(2)} cm${expected}`;
};

export default function RegionDimensionOverlay({ regions, visibleRegionIds }) {
  const dimensions = useMemo(() => buildRegionDimensionData(regions).filter(({ fromRegionId, toRegionId }) => visibleRegionIds.has(fromRegionId) && visibleRegionIds.has(toRegionId)).map(dimensionToMeters), [regions, visibleRegionIds]);
  return <group name="region-dimension-overlay">{dimensions.map((dimension) => <group key={dimension.id} renderOrder={120}>
    <Line points={dimension.points} color={dimension.type === "overlap" ? "#f97316" : "#f8fafc"} lineWidth={2} depthTest={false} />
    <Text position={dimension.labelPosition} fontSize={.025} color={dimension.type === "overlap" ? "#c2410c" : "#334155"} anchorX="center" anchorY="bottom" depthTest={false}>{labelFor(dimension)}</Text>
  </group>)}</group>;
}
