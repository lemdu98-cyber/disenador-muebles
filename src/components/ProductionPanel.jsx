import { useEffect, useMemo, useState } from "react";
import ProductionCounter from "./ProductionCounter";
import CombinedCutList from "./CombinedCutList";
import MaterialSettings from "./MaterialSettings";
import MaterialCostSummary from "./MaterialCostSummary";
import MelamineOptimizer from "./MelamineOptimizer";
import PressedBoardOptimizer from "./PressedBoardOptimizer";
import ScrapBank from "./ScrapBank";
import { createOrderItems, getOrderPieces } from "../utils/orderUtils";
import { optimizeAllMaterials } from "../utils/materialOptimizer";
import { DEFAULT_SCRAP_SETTINGS, classifyFreeRects, makeBankEntries } from "../utils/scrapManager";
import { calculateMaterialCosts } from "../utils/materialCostCalculator";
import { MATERIAL_IDS, MATERIAL_ORDER } from "../utils/materialConfig";

const BANK_KEY = "mueblecad-scrap-bank";

export default function ProductionPanel({ design, materialConfigs, setMaterialConfigs }) {
  const [orderItems, setOrderItems] = useState(() => createOrderItems(design));
  const [scrapSettings, setScrapSettings] = useState(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [id, { ...DEFAULT_SCRAP_SETTINGS }])));
  const [scrapBank, setScrapBank] = useState(() => { try { return JSON.parse(localStorage.getItem(BANK_KEY)) || []; } catch { return []; } });
  useEffect(() => { localStorage.setItem(BANK_KEY, JSON.stringify(scrapBank)); }, [scrapBank]);

  const setQuantity = (furnitureType, quantity) => setOrderItems((items) => items.map((item) => item.furnitureType === furnitureType ? { ...item, quantity: Math.max(0, Math.min(10, quantity)) } : item));
  const effectiveOrderItems = useMemo(() => orderItems.map((item) => item.furnitureType === design.furnitureType ? { ...item, params: { ...design } } : item), [orderItems, design]);
  const pieces = useMemo(() => getOrderPieces(effectiveOrderItems, materialConfigs), [effectiveOrderItems, materialConfigs]);
  const optimized = useMemo(() => optimizeAllMaterials(pieces, materialConfigs, Object.fromEntries(MATERIAL_ORDER.map((id) => [id, { scrapBank }]))), [pieces, materialConfigs, scrapBank]);
  const classifications = useMemo(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [
    id,
    classifyFreeRects(optimized[id].boards.filter((board) => board.pieces.length), scrapSettings[id], materialConfigs[id]),
  ])), [optimized, scrapSettings, materialConfigs]);
  const costs = useMemo(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [
    id,
    calculateMaterialCosts({ ...optimized[id], ...classifications[id], config: materialConfigs[id] }),
  ])), [optimized, classifications, materialConfigs]);
  const totalCost = MATERIAL_ORDER.reduce((sum, id) => sum + costs[id].cost, 0);

  const saveRecoveredScraps = () => {
    const entries = MATERIAL_ORDER.flatMap((id) => makeBankEntries(classifications[id].recoverable, materialConfigs[id]));
    const usedIds = MATERIAL_ORDER.flatMap((id) => optimized[id].scrapUsage);
    const known = new Set(scrapBank.map((scrap) => scrap.id));
    setScrapBank((bank) => [...bank.map((scrap) => usedIds.includes(scrap.id) ? { ...scrap, status: "Utilizado" } : scrap), ...entries.filter((entry) => !known.has(entry.id))]);
  };

  const optimizerProps = (id) => ({
    config: materialConfigs[id],
    result: optimized[id],
    classification: classifications[id],
    costs: costs[id],
    settings: scrapSettings[id],
    onSettingsChange: (next) => setScrapSettings((current) => ({ ...current, [id]: next })),
  });

  return <section className="production-page">
    <header className="production-header"><div><p className="eyebrow">MÓDULO</p><h1>Producción</h1><p>Optimización, placas y costos separados por material.</p></div><button type="button" className="primary-action" onClick={saveRecoveredScraps}>Finalizar y guardar retazos</button></header>
    <div className="production-dashboard">
      <div className="production-selection">
        <section className="summary-card"><h2>Selección de muebles</h2>{effectiveOrderItems.map((item) => <ProductionCounter key={item.furnitureType} label={item.label} quantity={item.quantity} onChange={(quantity) => setQuantity(item.furnitureType, quantity)} />)}</section>
        <MaterialSettings configs={materialConfigs} onChange={setMaterialConfigs} />
        <section className="summary-card economic-summary"><h2>Resumen económico</h2>{MATERIAL_ORDER.map((id) => <MaterialCostSummary key={id} config={materialConfigs[id]} costs={costs[id]} />)}<div className="grand-total"><span>Costo total materiales</span><b>{totalCost.toFixed(2)} Bs</b></div></section>
      </div>
      <div>
        <CombinedCutList pieces={pieces} configs={materialConfigs} />
        <MelamineOptimizer {...optimizerProps(MATERIAL_IDS.MELAMINE)} />
        <PressedBoardOptimizer {...optimizerProps(MATERIAL_IDS.HARDBOARD)} />
        <ScrapBank scraps={scrapBank} onRemove={(id) => setScrapBank((bank) => bank.filter((scrap) => scrap.id !== id))} />
      </div>
    </div>
  </section>;
}
