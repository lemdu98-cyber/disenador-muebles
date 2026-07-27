import { useEffect, useMemo, useState } from "react";
import ProductionCounter from "./ProductionCounter";
import CombinedCutList from "./CombinedCutList";
import ProductionSummary from "./ProductionSummary";
import ProductionOptimizer from "./ProductionOptimizer";
import OrderCalculator from "./OrderCalculator";
import ScrapBank from "./ScrapBank";
import { createOrderItems, getOrderPieces, groupPiecesByFurniture, consolidatePieces } from "../utils/orderUtils";
import { optimizeCuts } from "../utils/cuttingOptimizer";
import { DEFAULT_SCRAP_SETTINGS, classifyFreeRects, makeBankEntries } from "../utils/scrapManager";
import { calculateOrderCosts } from "../utils/costCalculator";

const BANK_KEY = "mueblecad-scrap-bank";

export default function ProductionPanel({ design }) {
  const [orderItems, setOrderItems] = useState(() => createOrderItems(design));
  const [settings, setSettings] = useState(DEFAULT_SCRAP_SETTINGS);
  const [scrapBank, setScrapBank] = useState(() => { try { return JSON.parse(localStorage.getItem(BANK_KEY)) || []; } catch { return []; } });
  useEffect(() => { localStorage.setItem(BANK_KEY, JSON.stringify(scrapBank)); }, [scrapBank]);
  const setQuantity = (furnitureType, quantity) => setOrderItems((items) => items.map((item) => item.furnitureType === furnitureType ? { ...item, quantity: Math.max(0, Math.min(10, quantity)) } : item));
  // The currently edited furniture is always recalculated from the live design controls.
  const effectiveOrderItems = useMemo(() => orderItems.map((item) => item.furnitureType === design.furnitureType ? { ...item, params: { ...design } } : item), [orderItems, design]);
  const pieces = useMemo(() => getOrderPieces(effectiveOrderItems), [effectiveOrderItems]);
  const grouped = useMemo(() => groupPiecesByFurniture(effectiveOrderItems), [effectiveOrderItems]);
  const consolidated = useMemo(() => consolidatePieces(pieces), [pieces]);
  const optimized = useMemo(() => optimizeCuts(pieces, { scrapBank }), [pieces, scrapBank]);
  const scrapClassification = useMemo(() => classifyFreeRects(optimized.boards.filter((board) => board.pieces.length), settings), [optimized.boards, settings]);
  const costs = useMemo(() => calculateOrderCosts({ pieces, boards: optimized.boards, ...scrapClassification }), [pieces, optimized.boards, scrapClassification]);
  const saveRecoveredScraps = () => {
    const entries = makeBankEntries(scrapClassification.recoverable);
    const known = new Set(scrapBank.map((scrap) => scrap.id));
    setScrapBank((bank) => [...bank.map((scrap) => optimized.scrapUsage.includes(scrap.id) ? { ...scrap, status: "Utilizado" } : scrap), ...entries.filter((entry) => !known.has(entry.id))]);
  };
  return <section className="production-page"><header className="production-header"><div><p className="eyebrow">MÓDULO</p><h1>Producción</h1><p>Combine muebles en un solo pedido y optimice todo el material en conjunto.</p></div><button type="button" className="primary-action" onClick={saveRecoveredScraps} disabled={!scrapClassification.recoverable.length && !optimized.scrapUsage.length}>Finalizar y guardar retazos</button></header><div className="production-dashboard"><div className="production-selection"><section className="summary-card"><h2>Selección de muebles</h2>{effectiveOrderItems.map((item) => <ProductionCounter key={item.furnitureType} label={item.label} quantity={item.quantity} onChange={(quantity) => setQuantity(item.furnitureType, quantity)} />)}</section><ProductionSummary orderItems={effectiveOrderItems} pieces={pieces} costs={costs} boards={optimized.boards} /><OrderCalculator orderItems={effectiveOrderItems} pieces={pieces} costs={costs} /></div><div><CombinedCutList grouped={grouped} consolidated={consolidated} /><ProductionOptimizer boards={optimized.boards} unplaced={optimized.unplaced} recoverable={scrapClassification.recoverable} waste={scrapClassification.waste} costs={costs} settings={settings} setSettings={setSettings} /><ScrapBank scraps={scrapBank} onRemove={(id) => setScrapBank((bank) => bank.filter((scrap) => scrap.id !== id))} /></div></div></section>;
}
