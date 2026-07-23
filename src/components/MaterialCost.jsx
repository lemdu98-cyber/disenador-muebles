export default function MaterialCost({ furnitureType, widthCm, heightCm, depthCm, doors, drawers, shelves }) {
  const isDesk = furnitureType === "desk";
  const isTvStand = furnitureType === "tvStand";
  const isNightstand = furnitureType === "nightstand";
  const deskDrawerWidth = Math.min(widthCm * 0.3, 48);
  const wardrobeArea = 2 * heightCm * depthCm + 2 * widthCm * depthCm + widthCm * heightCm + shelves * (widthCm - 10) * depthCm;
  const deskArea = widthCm * depthCm + 2 * (heightCm - 1.8) * depthCm + (widthCm - 16) * 22 + (drawers > 0 ? 2 * (heightCm - 1.8) * depthCm * 0.78 + drawers * deskDrawerWidth * 22 : 0);
  const tvStorageHeight = heightCm * 0.48;
  const tvDrawerWidth = drawers > 0 ? Math.min(widthCm * 0.38, 72) : 0;
  const tvStandArea = 2 * widthCm * depthCm + 2 * (heightCm - 3.6) * depthCm + (widthCm - 3.6) * (heightCm - 3.6) + (widthCm - 3.6) * (depthCm - 1.8) + shelves * (widthCm - 3.6) * (depthCm - 1.8) + (widthCm - tvDrawerWidth - 3.6) * (tvStorageHeight - 3.6) + drawers * tvDrawerWidth * (tvStorageHeight / drawers - 1.2);
  const nightstandArea = 2 * widthCm * depthCm + 2 * (heightCm - 3.6) * depthCm + (widthCm - 3.6) * (heightCm - 3.6) + (drawers > 0 ? drawers * (widthCm - 4.8) * ((heightCm - 3.6) / drawers) : (widthCm - 3.6) * (depthCm - 1.8));
  const totalArea = (isDesk ? deskArea : isTvStand ? tvStandArea : isNightstand ? nightstandArea : wardrobeArea) / 10000;
  const hardware = isDesk ? `${drawers * 2} correderas y 24 tornillos` : isTvStand ? `${doors * 2} bisagras, ${drawers * 2} correderas y 32 tornillos` : isNightstand ? `${drawers * 2} correderas y 16 tornillos` : `${doors * 4} bisagras y 50 tornillos`;
  return <section className="summary-card cost-card"><h2>Materiales y costo</h2><div className="cost-row"><span>Área estimada</span><b>{totalArea.toFixed(2)} m²</b></div><div className="cost-row"><span>Melamina (120 Bs/m²)</span><b>{(totalArea * 120).toFixed(0)} Bs</b></div><div className="hardware"><b>Herrajes:</b> {hardware}</div></section>;
}
