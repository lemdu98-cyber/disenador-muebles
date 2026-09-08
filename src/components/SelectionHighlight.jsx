/** Non-destructive DEV overlay; original face materials and edge treatment stay intact. */
export default function SelectionHighlight({ dimensions }) { return <mesh scale={[1.012, 1.012, 1.012]}><boxGeometry args={dimensions} /><meshBasicMaterial color="#22d3ee" wireframe transparent opacity={.8} depthWrite={false} /></mesh>; }
