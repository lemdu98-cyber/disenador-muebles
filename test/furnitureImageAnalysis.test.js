import test from "node:test";
import assert from "node:assert/strict";
import { analyzeFurnitureImageMock, analyzeFurnitureImageReal, mapInvokeError, validateAnalysisProposal } from "../src/services/furnitureImageAnalysis.js";
import { proposalToNormalizedConfig } from "../src/utils/imageFurnitureProposal.js";
import { ANALYSIS_IMAGE_MAX_BYTES, calculateContainedSize, dataUrlToPayload } from "../src/utils/imagePreprocessing.js";

const dimensions = { widthCm: 53, heightCm: 55, depthCm: 40 };
const validProposal = { detectedType: "nightstand", confidence: 0.82, dimensions, structure: { sections: null, drawers: 2, doors: 0, shelves: 0 }, notes: [], warnings: [], provider: "openai" };
const session = async () => ({ data: { session: { access_token: "test" } } });
const processed = async () => ({ image: "processed-base64", mimeType: "image/jpeg", size: 1000 });

test("calcula reducción proporcional y transforma Data URL a payload", () => {
  assert.deepEqual(calculateContainedSize(4000, 2000), { width: 1800, height: 900 });
  assert.deepEqual(dataUrlToPayload("data:image/jpeg;base64,/9j/AA=="), { image: "/9j/AA==", mimeType: "image/jpeg" });
  assert.equal(ANALYSIS_IMAGE_MAX_BYTES, 4 * 1024 * 1024);
});

test("envía solamente imagen procesada, MIME y dimensiones", async () => {
  let received;
  const result = await analyzeFurnitureImageReal({ file: {}, dimensions, getSession: session, preprocess: processed, invoke: async (body) => { received = body; return { data: validProposal, error: null }; } });
  assert.deepEqual(received, { image: "processed-base64", mimeType: "image/jpeg", dimensions });
  assert.equal(result.provider, "openai");
});

test("acepta unknown válido y sigue siendo incompatible con aplicación automática", () => {
  const unknown = validateAnalysisProposal({ ...validProposal, detectedType: "unknown", confidence: 0.25, warnings: ["Imagen no compatible"] });
  assert.throws(() => proposalToNormalizedConfig(unknown), /reconocer/);
});

test("rechaza confidence y schemas inválidos", () => {
  assert.throws(() => validateAnalysisProposal({ ...validProposal, confidence: 2 }), /confianza/);
  assert.throws(() => validateAnalysisProposal({ ...validProposal, structure: null }), /incompleta/);
  assert.throws(() => validateAnalysisProposal({ ...validProposal, detectedType: "chair" }), /inválida/);
});

test("rechaza sesión ausente antes de procesar o invocar", async () => {
  let invoked = false;
  await assert.rejects(analyzeFurnitureImageReal({ file: {}, dimensions, getSession: async () => ({ data: { session: null } }), preprocess: processed, invoke: async () => { invoked = true; } }), /sesión expiró/);
  assert.equal(invoked, false);
});

test("mapea proveedor, rate limit y timeout sin filtrar detalles", async () => {
  const invoke = async () => ({ data: null, error: { context: { status: 502 } } });
  await assert.rejects(analyzeFurnitureImageReal({ file: {}, dimensions, getSession: session, preprocess: processed, invoke }), /no está disponible/);
  assert.match(mapInvokeError({ context: { status: 429 } }).message, /ocupado/);
  assert.match(mapInvokeError({ context: { status: 504 } }).message, /no está disponible/);
});

test("el mock continúa disponible sin red", async () => {
  const result = await analyzeFurnitureImageMock({ file: {}, dimensions, mockDetectedType: "desk" });
  assert.equal(result.detectedType, "desk");
  assert.equal(result.provider, "mock");
});
