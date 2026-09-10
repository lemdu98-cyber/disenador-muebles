import { Edges } from "@react-three/drei";
import { useMemo } from "react";
import { buildRegionOverlayData, REGION_ROLE_STYLES } from "../utils/furnitureRegionOverlay.js";
import RegionDimensionOverlay from "./RegionDimensionOverlay.jsx";

export default function FurnitureRegionOverlay({ regions, selectedRegionId, selectedComponentId, onSelectRegion, filter = "all", showDimensions = false }) {
  const overlayData = useMemo(() => buildRegionOverlayData(regions, filter), [filter, regions]);
  const visibleIds = useMemo(() => new Set(overlayData.map(({ id }) => id)), [overlayData]);
  return <group name="furniture-region-overlay">
    {overlayData.map(({ id, region, widthM, heightM, position }) => {
      const style = REGION_ROLE_STYLES[region.role] ?? REGION_ROLE_STYLES["front-opening"];
      const selected = selectedRegionId === id; const componentSelected = !selected && selectedComponentId === region.componentId;
      const opacity = selected ? .42 : componentSelected ? .25 : style.opacity;
      return <mesh key={id} position={position} renderOrder={selected ? 110 : 100} onClick={(event) => { event.stopPropagation(); onSelectRegion?.(id); }}>
        <planeGeometry args={[widthM, heightM]} />
        <meshBasicMaterial color={style.color} transparent opacity={opacity} depthTest={false} depthWrite={false} side={2} />
        <Edges color={selected ? "#f8fafc" : style.color} threshold={1} scale={1.001} />
      </mesh>;
    })}
    {showDimensions && <RegionDimensionOverlay regions={regions} visibleRegionIds={visibleIds} />}
  </group>;
}
