import { useEffect, useMemo, useState } from "react";
import ProductionCounter from "./ProductionCounter";
import CombinedCutList from "./CombinedCutList";
import MaterialSettings from "./MaterialSettings";
import MaterialCostSummary from "./MaterialCostSummary";
import MelamineOptimizer from "./MelamineOptimizer";
import PressedBoardOptimizer from "./PressedBoardOptimizer";
import ScrapBank from "./ScrapBank";
import OptimizerSettings from "./OptimizerSettings";
import { createOrderItems, getOrderPieces } from "../utils/orderUtils";
import { optimizeAllMaterials } from "../utils/materialOptimizer";
import { DEFAULT_SCRAP_SETTINGS, classifyFreeRects, makeBankEntries } from "../utils/scrapManager";
import { calculateMaterialCosts } from "../utils/materialCostCalculator";
import { MATERIAL_IDS, MATERIAL_ORDER } from "../utils/materialConfig";
import { DEFAULT_OPTIMIZER_SETTINGS } from "../utils/optimizer/optimizerConfig";
import { createFixedProduction, getAddedPieces, optimizeProductionAdditions } from "../utils/production/ProductionManager";
import { loadProduction, saveProduction } from "../utils/production/BoardSerializer";
import { BOARD_STATES, setBoardsStatus } from "../utils/production/BoardStateManager";

const BANK_KEY = "mueblecad-scrap-bank";

export default function ProductionPanel({ design, materialConfigs, setMaterialConfigs }) {
  const [orderItems, setOrderItems] = useState(() => createOrderItems(design));
  const [scrapSettings, setScrapSettings] = useState(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [id, { ...DEFAULT_SCRAP_SETTINGS }])));
  const [optimizerSettings, setOptimizerSettings] = useState(DEFAULT_OPTIMIZER_SETTINGS);
  const [manualLayouts, setManualLayouts] = useState({});
  const [fixedProduction, setFixedProduction] = useState(loadProduction);
  const [scrapBank, setScrapBank] = useState(() => { try { return JSON.parse(localStorage.getItem(BANK_KEY)) || []; } catch { return []; } });
  useEffect(() => { localStorage.setItem(BANK_KEY, JSON.stringify(scrapBank)); }, [scrapBank]);
  useEffect(() => { saveProduction(fixedProduction); }, [fixedProduction]);

  const setQuantity = (furnitureType, quantity) => setOrderItems((items) => items.map((item) => item.furnitureType === furnitureType ? { ...item, quantity: Math.max(0, Math.min(10, quantity)) } : item));
  const effectiveOrderItems = useMemo(() => orderItems.map((item) => item.furnitureType === design.furnitureType ? { ...item, params: { ...design } } : item), [orderItems, design]);
  const pieces = useMemo(() => getOrderPieces(effectiveOrderItems, materialConfigs), [effectiveOrderItems, materialConfigs]);
  const optimizationKey = useMemo(() => JSON.stringify({
    pieces: pieces.map(({ id, length, width, grainDirection, material }) => ({ id, length, width, grainDirection, materialId: material.id })),
    materialConfigs,
    optimizerSettings,
    scrapBank: scrapBank.map(({ id, lengthCm, widthCm, status, materialId }) => ({ id, lengthCm, widthCm, status, materialId })),
  }), [pieces, materialConfigs, optimizerSettings, scrapBank]);
  const optimized = useMemo(() => optimizeAllMaterials(pieces, materialConfigs, Object.fromEntries(MATERIAL_ORDER.map((id) => [id, { scrapBank, optimizerSettings }]))), [pieces, materialConfigs, scrapBank, optimizerSettings]);
  const liveOptimized = useMemo(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [
    id,
    manualLayouts[id]?.optimizationKey === optimizationKey ? { ...optimized[id], boards: manualLayouts[id].boards } : optimized[id],
  ])), [optimized, manualLayouts, optimizationKey]);
  const effectiveOptimized = fixedProduction?.results || liveOptimized;
  const addedPieces = useMemo(() => getAddedPieces(pieces, fixedProduction), [pieces, fixedProduction]);
  const incrementalSummary = MATERIAL_ORDER.reduce((summary, id) => {
    const item = effectiveOptimized[id].incrementalSummary;
    return item ? {
      added: summary.added + item.added,
      insertedExisting: summary.insertedExisting + item.insertedExisting,
      sentToNewBoards: summary.sentToNewBoards + item.sentToNewBoards,
    } : summary;
  }, { added: 0, insertedExisting: 0, sentToNewBoards: 0 });
  const hasCutBoards = fixedProduction
    ? MATERIAL_ORDER.some((id) => fixedProduction.results[id].boards.some((board) => board.status === BOARD_STATES.CUT))
    : false;
  const classifications = useMemo(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [
    id,
    classifyFreeRects(effectiveOptimized[id].boards.filter((board) => board.pieces.length), scrapSettings[id], materialConfigs[id]),
  ])), [effectiveOptimized, scrapSettings, materialConfigs]);
  const costs = useMemo(() => Object.fromEntries(MATERIAL_ORDER.map((id) => [
    id,
    calculateMaterialCosts({ ...effectiveOptimized[id], ...classifications[id], config: materialConfigs[id] }),
  ])), [effectiveOptimized, classifications, materialConfigs]);
  const totalCost = MATERIAL_ORDER.reduce((sum, id) => sum + costs[id].cost, 0);

  const saveRecoveredScraps = () => {
    const entries = MATERIAL_ORDER.flatMap((id) => makeBankEntries(classifications[id].recoverable, materialConfigs[id]));
    const usedIds = MATERIAL_ORDER.flatMap((id) => effectiveOptimized[id].scrapUsage);
    const known = new Set(scrapBank.map((scrap) => scrap.id));
    setScrapBank((bank) => [...bank.map((scrap) => usedIds.includes(scrap.id) ? { ...scrap, status: "Utilizado" } : scrap), ...entries.filter((entry) => !known.has(entry.id))]);
  };

  const fixProduction = () => setFixedProduction(createFixedProduction(effectiveOptimized, materialConfigs, optimizerSettings));
  const optimizeAdditions = () => {
    if (!fixedProduction || !addedPieces.length) return;
    setFixedProduction(optimizeProductionAdditions({
      production: fixedProduction, pieces, materialConfigs, optimizerSettings, scrapBank,
    }));
  };
  const unlockProduction = () => {
    setFixedProduction(null);
    setManualLayouts({});
  };
  const confirmBoards = () => setFixedProduction((current) => current ? {
    ...current, results: setBoardsStatus(current.results, BOARD_STATES.CONFIRMED),
  } : current);
  const markBoardsCut = () => {
    if (!fixedProduction) return;
    const entries = MATERIAL_ORDER.flatMap((id) => makeBankEntries(classifications[id].recoverable, materialConfigs[id]));
    setScrapBank((bank) => {
      const known = new Set(bank.map((scrap) => scrap.id));
      return [...bank, ...entries.filter((entry) => !known.has(entry.id))];
    });
    setFixedProduction((current) => ({
      ...current, results: setBoardsStatus(current.results, BOARD_STATES.CUT),
    }));
  };

  const optimizerProps = (id) => ({
    config: materialConfigs[id],
    result: {
      ...effectiveOptimized[id],
      boards: effectiveOptimized[id].boards.map((board) => ({
        ...board,
        recoverableArea: classifications[id].recoverable.filter((item) => item.boardNumber === board.number && item.boardSource === board.source).reduce((sum, item) => sum + item.areaCm2, 0),
        wasteArea: classifications[id].waste.filter((item) => item.boardNumber === board.number && item.boardSource === board.source).reduce((sum, item) => sum + item.areaCm2, 0),
      })),
    },
    classification: classifications[id],
    costs: costs[id],
    settings: scrapSettings[id],
    onSettingsChange: (next) => setScrapSettings((current) => ({ ...current, [id]: next })),
    hasManualLayout: manualLayouts[id]?.optimizationKey === optimizationKey,
    onSaveManualLayout: (boards) => setManualLayouts((current) => ({ ...current, [id]: { boards, optimizationKey } })),
    onResetManualLayout: () => setManualLayouts((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    }),
  });

  return <section className="production-page">
    <header className="production-header"><div><p className="eyebrow">MÓDULO</p><h1>Producción</h1><p>Optimización, placas y costos separados por material.</p>{design.drawerValidationError && <p className="validation-error">{design.drawerValidationError}</p>}</div><button type="button" className="primary-action" onClick={saveRecoveredScraps} disabled={Boolean(design.drawerValidationError)}>Finalizar y guardar retazos</button></header>
    <section className="production-lock-bar">
      <div className="production-lock-actions">
        <button type="button" onClick={fixProduction} disabled={!pieces.length || hasCutBoards || Boolean(design.drawerValidationError)}>Fijar producción</button>
        <button type="button" className="primary-action" onClick={optimizeAdditions} disabled={!fixedProduction || !addedPieces.length}>Optimizar añadidos</button>
        <button type="button" onClick={unlockProduction} disabled={!fixedProduction || hasCutBoards}>Desbloquear producción</button>
        <button type="button" onClick={confirmBoards} disabled={!fixedProduction}>Confirmar placas</button>
        <button type="button" onClick={markBoardsCut} disabled={!fixedProduction}>Marcar como cortadas</button>
        <button type="button" onClick={unlockProduction} disabled={!fixedProduction || hasCutBoards}>Restablecer optimización</button>
      </div>
      <div className="incremental-summary">
        <span>Piezas pendientes: <b>{addedPieces.length}</b></span>
        <span>Piezas nuevas añadidas: <b>{incrementalSummary.added}</b></span>
        <span>Insertadas en placas existentes: <b>{incrementalSummary.insertedExisting}</b></span>
        <span>Enviadas a placas nuevas: <b>{incrementalSummary.sentToNewBoards}</b></span>
      </div>
    </section>
    <div className="production-dashboard">
      <div className="production-selection">
        <section className="summary-card"><h2>Selección de muebles</h2>{effectiveOrderItems.map((item) => <ProductionCounter key={item.furnitureType} label={item.label} quantity={item.quantity} onChange={(quantity) => setQuantity(item.furnitureType, quantity)} />)}</section>
        <MaterialSettings configs={materialConfigs} onChange={setMaterialConfigs} />
        <OptimizerSettings settings={optimizerSettings} onChange={setOptimizerSettings} />
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
