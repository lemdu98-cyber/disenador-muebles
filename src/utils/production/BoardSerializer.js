const STORAGE_KEY = "mueblecad-fixed-production-v1";

export const cloneProduction = (value) => structuredClone(value);

export function saveProduction(value) {
  if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  else localStorage.removeItem(STORAGE_KEY);
}

export function loadProduction() {
  try {
    const value = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return value?.results ? value : null;
  } catch {
    return null;
  }
}
