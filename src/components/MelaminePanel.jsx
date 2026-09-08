import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Edges } from "@react-three/drei";
import { getMelamineFaceColors } from "../utils/panelEdgeMaterials.js";
import SelectionHighlight from "./SelectionHighlight.jsx";

export default function MelaminePanel({ position, dimensions, piece, orientation, color = "#8b5a2b", opacity = 1, showEdges = true, highlighted = false }) {
  const faceColors = useMemo(() => getMelamineFaceColors({ color, edgeBanding: piece?.edgeBanding, orientation }), [color, piece?.edgeBanding, orientation]);
  const materials = useMemo(() => faceColors.map((faceColor) => new THREE.MeshStandardMaterial({ color: faceColor, transparent: opacity < 1, opacity })), [faceColors, opacity]);
  useEffect(() => () => materials.forEach((material) => material.dispose()), [materials]);
  return <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={dimensions} />
    {materials.map((material, index) => <primitive key={index} object={material} attach={`material-${index}`} />)}
    {showEdges && <Edges color="#49382d" threshold={15} scale={1.001} />}
    {highlighted && <SelectionHighlight dimensions={dimensions} />}
  </mesh>;
}
