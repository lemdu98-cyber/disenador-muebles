export const SUPPORTED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const MAX_PROCESSED_IMAGE_BYTES = 4 * 1024 * 1024;
export const FURNITURE_TYPES = ["nightstand", "desk", "tvStand", "catHouse", "wardrobe", "unknown"];

const nullableInteger = { anyOf: [{ type: "integer", minimum: 0, maximum: 100 }, { type: "null" }] };

export const FURNITURE_ANALYSIS_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["detectedType", "confidence", "dimensions", "structure", "notes", "warnings"],
  properties: {
    detectedType: { type: "string", enum: FURNITURE_TYPES },
    confidence: { type: "number", minimum: 0, maximum: 1 },
    dimensions: {
      type: "object", additionalProperties: false, required: ["widthCm", "heightCm", "depthCm"],
      properties: { widthCm: { type: "number" }, heightCm: { type: "number" }, depthCm: { type: "number" } },
    },
    structure: {
      type: "object", additionalProperties: false, required: ["sections", "drawers", "doors", "shelves"],
      properties: { sections: nullableInteger, drawers: nullableInteger, doors: nullableInteger, shelves: nullableInteger },
    },
    notes: { type: "array", maxItems: 8, items: { type: "string", maxLength: 240 } },
    warnings: { type: "array", maxItems: 8, items: { type: "string", maxLength: 240 } },
  },
};

export function decodeAndValidateImage(image: unknown, mimeType: unknown) {
  if (typeof image !== "string" || !image || typeof mimeType !== "string" || !SUPPORTED_MIME_TYPES.includes(mimeType)) throw new Error("invalid_image");
  if (image.length > Math.ceil(MAX_PROCESSED_IMAGE_BYTES * 4 / 3) + 8) throw new Error("image_too_large");
  let bytes: Uint8Array;
  try { bytes = Uint8Array.from(atob(image), (character) => character.charCodeAt(0)); } catch { throw new Error("invalid_image"); }
  if (bytes.length > MAX_PROCESSED_IMAGE_BYTES) throw new Error("image_too_large");
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value);
  const header = String.fromCharCode(...bytes.slice(0, 12));
  const webp = header.startsWith("RIFF") && header.slice(8, 12) === "WEBP";
  if (!((mimeType === "image/jpeg" && jpeg) || (mimeType === "image/png" && png) || (mimeType === "image/webp" && webp))) throw new Error("invalid_image");
  return bytes;
}

export function validateDimensions(value: unknown) {
  const input = value as Record<string, unknown> | null;
  const dimensions = { widthCm: Number(input?.widthCm), heightCm: Number(input?.heightCm), depthCm: Number(input?.depthCm) };
  if (!Object.values(dimensions).every((number) => Number.isFinite(number) && number > 0 && number <= 1000)) throw new Error("invalid_dimensions");
  return dimensions;
}

export function validateProviderResult(value: unknown, dimensions: { widthCm: number; heightCm: number; depthCm: number }) {
  const result = value as Record<string, unknown> | null;
  if (!result || !FURNITURE_TYPES.includes(String(result.detectedType))) throw new Error("invalid_provider_output");
  const confidence = Number(result.confidence);
  if (!Number.isFinite(confidence) || confidence < 0 || confidence > 1 || !result.structure || !Array.isArray(result.notes) || !Array.isArray(result.warnings)) throw new Error("invalid_provider_output");
  return { ...result, confidence, dimensions, provider: "openai" };
}
