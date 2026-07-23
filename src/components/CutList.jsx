const Piece = ({ children }) => <li>{children}</li>;

export default function CutList({ furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves }) {
  const isDesk = furnitureType === "desk";
  const isTvStand = furnitureType === "tvStand";
  const isNightstand = furnitureType === "nightstand";
  const thickness = 1.8;
  const deskDrawerColumnWidth = Math.min(widthCm * 0.3, 48);
  const tvDrawerWidth = drawers > 0 ? Math.min(widthCm * 0.38, 72) : 0;
  const tvStorageHeight = heightCm * 0.48;
  return <section className="summary-card"><h2>Lista de corte</h2><p className="summary-title">{isDesk ? "Escritorio" : isTvStand ? "Mueble TV" : isNightstand ? "Mesa de noche" : "Ropero"}: {widthCm} x {heightCm} x {depthCm} cm</p><ul>
    {isDesk ? <>
      <Piece><b>Tapa:</b> 1 pieza de {widthCm} x {depthCm} cm</Piece><Piece><b>Patas laterales:</b> 2 piezas de {heightCm - thickness} x {depthCm} cm</Piece><Piece><b>Faldón posterior:</b> 1 pieza de {widthCm - 16} x 22 cm</Piece>
      {drawers > 0 && <><Piece><b>Laterales de cajonera:</b> 2 piezas de {heightCm - thickness} x {(depthCm * 0.78).toFixed(1)} cm</Piece><Piece><b>Frentes de cajón:</b> {drawers} piezas de {(deskDrawerColumnWidth - thickness * 2).toFixed(1)} x {Math.min(22, (heightCm - thickness - 8) / drawers).toFixed(1)} cm</Piece></>}
    </> : isTvStand ? <>
      <Piece><b>Tapa y base:</b> 2 piezas de {widthCm} x {depthCm} cm</Piece><Piece><b>Laterales:</b> 2 piezas de {heightCm - thickness * 2} x {depthCm} cm</Piece><Piece><b>Fondo:</b> 1 pieza de {widthCm - thickness * 2} x {heightCm - thickness * 2} cm</Piece><Piece><b>División horizontal:</b> 1 pieza de {widthCm - thickness * 2} x {depthCm - thickness} cm</Piece><Piece><b>Puertas:</b> {doors} piezas de {((widthCm - tvDrawerWidth - thickness * 2) / doors).toFixed(1)} x {(tvStorageHeight - thickness * 2).toFixed(1)} cm</Piece>
      {drawers > 0 && <Piece><b>Frentes de cajón:</b> {drawers} piezas de {(tvDrawerWidth - 1.2).toFixed(1)} x {(tvStorageHeight / drawers - 1.2).toFixed(1)} cm</Piece>}{shelves > 0 && <Piece><b>Repisas del nicho:</b> {shelves} piezas de {widthCm - thickness * 2} x {depthCm - thickness} cm</Piece>}
    </> : isNightstand ? <>
      <Piece><b>Tapa y base:</b> 2 piezas de {widthCm} x {depthCm} cm</Piece><Piece><b>Laterales:</b> 2 piezas de {heightCm - thickness * 2} x {depthCm} cm</Piece><Piece><b>Fondo:</b> 1 pieza de {widthCm - thickness * 2} x {heightCm - thickness * 2} cm</Piece>
      {drawers > 0 ? <Piece><b>Frentes de cajón:</b> {drawers} piezas de {(widthCm - thickness * 2 - 1.2).toFixed(1)} x {((heightCm - thickness * 2 - 4.5) / drawers).toFixed(1)} cm</Piece> : <Piece><b>Repisa interior:</b> 1 pieza de {widthCm - thickness * 2} x {depthCm - thickness} cm</Piece>}
    </> : <><Piece><b>Laterales:</b> 2 piezas de {heightCm} x {depthCm} cm</Piece><Piece><b>Tapa y base:</b> 2 piezas de {widthCm} x {depthCm} cm</Piece><Piece><b>Puertas:</b> {doors} piezas de {(widthCm / doors).toFixed(1)} x {heightCm} cm</Piece><Piece><b>Repisas:</b> {shelves} piezas de {widthCm - 10} x {depthCm} cm</Piece></>}
  </ul></section>;
}
