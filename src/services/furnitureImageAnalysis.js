import { preprocessFurnitureImage } from "../utils/imagePreprocessing.js";

export const MAX_IMAGE_SIZE_BYTES = 10 * 1024 * 1024;
export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const DETECTABLE_FURNITURE_TYPES = ["nightstand", "desk", "tvStand", "catHouse", "wardrobe"];
export const ANALYSIS_PROVIDER = import.meta.env?.VITE_FURNITURE_ANALYSIS_PROVIDER || (import.meta.env?.DEV ? "mock" : "real");

const MOCK_STRUCTURES = {
  nightstand: { drawers: 2 }, desk: { drawers: 3 }, tvStand: {}, catHouse: {},
  wardrobe: { sections: 3, drawers: 6, doors: 3, shelves: 3 },
};

export function validateFurnitureImage(file) {
  if (!file) return "Selecciona una imagen válida.";
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) return "Selecciona una imagen JPG, PNG o WEBP válida.";
  if (file.size > MAX_IMAGE_SIZE_BYTES) return "La imagen supera el tamaño máximo de 10 MB.";
  return "";
}

export async function validateFurnitureImageContent(file) {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const isPng = bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const text = String.fromCharCode(...bytes);
  const isWebp = text.startsWith("RIFF") && text.slice(8, 12) === "WEBP";
  return ((file.type === "image/jpeg" && isJpeg) || (file.type === "image/png" && isPng) || (file.type === "image/webp" && isWebp))
    ? "" : "El contenido del archivo no corresponde a una imagen JPG, PNG o WEBP válida.";
}

export function validateAnalysisProposal(proposal) {
  if (!proposal || ![...DETECTABLE_FURNITURE_TYPES, "unknown"].includes(proposal.detectedType)) throw new Error("El servicio devolvió una respuesta inválida.");
  if (!Number.isFinite(proposal.confidence) || proposal.confidence < 0 || proposal.confidence > 1) throw new Error("El servicio devolvió una confianza inválida.");
  if (!proposal.dimensions || !proposal.structure || !Array.isArray(proposal.notes) || !Array.isArray(proposal.warnings)) throw new Error("El servicio devolvió una respuesta incompleta.");
  return proposal;
}

export function mapInvokeError(error) {
  const status = error?.context?.status;
  if (status === 401) return new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  if (status === 413) return new Error("La imagen es demasiado grande.");
  if (status === 429) return new Error("El servicio está ocupado. Inténtalo nuevamente en unos minutos.");
  if (status >= 500) return new Error("El servicio de análisis no está disponible en este momento.");
  return new Error("No se pudo analizar la imagen.");
}

export async function analyzeFurnitureImageReal({
  file, dimensions,
  invoke,
  getSession,
  preprocess = preprocessFurnitureImage,
}) {
  const client = (!invoke || !getSession) ? (await import("../lib/supabase")).supabase : null;
  const sessionReader = getSession || (() => client.auth.getSession());
  const functionInvoker = invoke || ((body) => client.functions.invoke("analyze-furniture-image", { body }));
  const { data: sessionData } = await sessionReader();
  if (!sessionData.session) throw new Error("Tu sesión expiró. Inicia sesión nuevamente.");
  const processed = await preprocess(file);
  const { data, error } = await functionInvoker({ image: processed.image, mimeType: processed.mimeType, dimensions });
  if (error) throw mapInvokeError(error);
  return validateAnalysisProposal(data);
}

export async function analyzeFurnitureImageMock({ dimensions, mockDetectedType }) {
  await new Promise((resolve) => setTimeout(resolve, 250));
  const detectedType = DETECTABLE_FURNITURE_TYPES.includes(mockDetectedType) ? mockDetectedType : "unknown";
  return { detectedType, confidence: detectedType === "unknown" ? 0.35 : 0.91, dimensions: Object.fromEntries(Object.entries(dimensions).map(([key, value]) => [key, Number(value)])), structure: detectedType === "unknown" ? {} : { ...MOCK_STRUCTURES[detectedType] }, notes: ["Resultado simulado para validar el flujo de revisión."], warnings: detectedType === "unknown" ? ["No fue posible reconocer un tipo compatible."] : [], provider: "mock" };
}

export async function analyzeFurnitureImage(args) {
  const fileError = validateFurnitureImage(args.file);
  if (fileError) throw new Error(fileError);
  const contentError = await validateFurnitureImageContent(args.file);
  if (contentError) throw new Error(contentError);
  if (![args.dimensions.widthCm, args.dimensions.heightCm, args.dimensions.depthCm].every((value) => Number(value) > 0)) throw new Error("Introduce ancho, alto y fondo.");
  return ANALYSIS_PROVIDER === "mock" ? analyzeFurnitureImageMock(args) : analyzeFurnitureImageReal(args);
}
