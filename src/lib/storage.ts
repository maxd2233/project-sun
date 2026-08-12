/**
 * Lightweight typed localStorage wrapper with defensive parsing.
 * All reads/writes are isolated behind this module so the persistence
 * strategy can be swapped (e.g. IndexedDB) without touching app code.
 */

const PREFIX = 'project-sun';

export const STORAGE_KEYS = {
  appState: `${PREFIX}:state`,
} as const;

export function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`[storage] failed to persist "${key}"`, error);
  }
}

export function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}
