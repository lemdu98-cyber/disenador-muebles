export const ANALYSIS_IMAGE_MAX_SIDE = 1800;
export const ANALYSIS_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export function calculateContainedSize(width, height, maxSide = ANALYSIS_IMAGE_MAX_SIDE) {
  if (!(width > 0 && height > 0)) throw new Error("La imagen no tiene dimensiones válidas.");
  const scale = Math.min(1, maxSide / Math.max(width, height));
  return { width: Math.round(width * scale), height: Math.round(height * scale) };
}

export function dataUrlToPayload(dataUrl) {
  const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
  if (!match) throw new Error("No se pudo preparar la imagen para el análisis.");
  return { image: match[2], mimeType: match[1] };
}

function canvasToBlob(canvas, type, quality) {
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("No se pudo comprimir la imagen.")), type, quality));
}

export async function preprocessFurnitureImage(file) {
  const bitmap = await createImageBitmap(file);
  try {
    const size = calculateContainedSize(bitmap.width, bitmap.height);
    const canvas = document.createElement("canvas");
    canvas.width = size.width; canvas.height = size.height;
    const context = canvas.getContext("2d", { alpha: false });
    context.fillStyle = "#ffffff"; context.fillRect(0, 0, size.width, size.height);
    context.drawImage(bitmap, 0, 0, size.width, size.height);
    let quality = 0.86;
    let blob = await canvasToBlob(canvas, "image/jpeg", quality);
    while (blob.size > ANALYSIS_IMAGE_MAX_BYTES && quality > 0.56) {
      quality -= 0.1;
      blob = await canvasToBlob(canvas, "image/jpeg", quality);
    }
    if (blob.size > ANALYSIS_IMAGE_MAX_BYTES) throw new Error("La imagen es demasiado grande para analizarla.");
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result); reader.onerror = () => reject(new Error("No se pudo leer la imagen procesada."));
      reader.readAsDataURL(blob);
    });
    return { ...dataUrlToPayload(dataUrl), size: blob.size, width: size.width, height: size.height };
  } finally { bitmap.close(); }
}
