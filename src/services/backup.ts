import type { AppState, DailyRecord } from '../types';
import { fromDateKey, toDateKey } from '../lib/date';
import { normalizeState, STATE_VERSION } from './persistence';

export const BACKUP_FORMAT = 'project-sun-backup' as const;
export const BACKUP_VERSION = 1 as const;
export const APP_VERSION = '0.1.0' as const;

export interface BackupEnvelope {
  format: typeof BACKUP_FORMAT;
  version: typeof BACKUP_VERSION;
  exportedAt: string;
  appVersion: string;
  data: AppState;
}

export interface BackupSummary {
  completedDays: number;
  achievements: number;
  xp: number;
  missionTitle: string;
}

/** A safe, user-facing error for malformed or unsupported backup files. */
export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

const DATE_KEY = /^\d{4}-\d{2}-\d{2}$/;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}T/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function fail(message: string): never {
  throw new BackupValidationError(message);
}

function onlyKeys(value: Record<string, unknown>, allowed: readonly string[], label: string): void {
  for (const key of Object.keys(value)) {
    if (!allowed.includes(key)) fail(`${label} contiene un campo no reconocido.`);
  }
}

function finiteNonNegative(value: unknown, label: string, integer = false): void {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || (integer && !Number.isInteger(value))) {
    fail(`${label} debe ser un número válido.`);
  }
}

function validIso(value: unknown, label: string, nullable = false): void {
  if (nullable && value === null) return;
  if (typeof value !== 'string' || !ISO_DATE.test(value) || Number.isNaN(new Date(value).getTime())) {
    fail(`${label} debe ser una fecha válida.`);
  }
}

/** True when the string contains ASCII control characters (C0 + DEL). */
function hasControlChars(value: string): boolean {
  for (let i = 0; i < value.length; i += 1) {
    const code = value.charCodeAt(i);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

function validText(value: unknown, label: string, maxLength: number): void {
  if (typeof value !== 'string' || value.length > maxLength || hasControlChars(value)) {
    fail(`${label} contiene texto inválido.`);
  }
}

function validDateKey(value: unknown, label: string): asserts value is string {
  if (typeof value !== 'string' || !DATE_KEY.test(value) || toDateKey(fromDateKey(value)) !== value) {
    fail(`${label} debe usar una fecha real YYYY-MM-DD.`);
  }
}

function validateRecord(key: string, value: unknown): void {
  if (!isRecord(value)) fail('Un registro diario no tiene un formato válido.');
  onlyKeys(value, ['date', 'completed', 'completedAt', 'xpEarned'], 'Un registro diario');
  if (value.date !== key || typeof value.completed !== 'boolean') {
    fail('Un registro diario no coincide con su fecha.');
  }
  validIso(value.completedAt, 'La hora del registro', true);
  finiteNonNegative(value.xpEarned, 'El XP de un registro');
}

function validateState(value: unknown): asserts value is Partial<AppState> {
  if (!isRecord(value)) fail('Los datos del backup no son un objeto válido.');
  onlyKeys(value, ['version', 'mission', 'records', 'progress', 'settings', 'events', 'companion'], 'Los datos del backup');
  if (!Number.isInteger(value.version) || (value.version !== 1 && value.version !== STATE_VERSION)) {
    fail('La versión interna de los datos no es compatible.');
  }

  if (!isRecord(value.mission)) fail('La configuración de misión no es válida.');
  onlyKeys(value.mission, ['id', 'title', 'scheduledTime', 'enabled'], 'La misión');
  validText(value.mission.id, 'El identificador de misión', 128);
  validText(value.mission.title, 'El nombre de misión', 40);
  if (typeof value.mission.enabled !== 'boolean' || typeof value.mission.scheduledTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(value.mission.scheduledTime)) {
    fail('La hora o el estado de la misión no son válidos.');
  }

  if (!isRecord(value.records)) fail('Los registros diarios no son válidos.');
  for (const [key, record] of Object.entries(value.records)) {
    validDateKey(key, 'La fecha de un registro');
    validateRecord(key, record);
  }

  if (!isRecord(value.progress)) fail('El progreso no es válido.');
  onlyKeys(value.progress, ['currentStreak', 'bestStreak', 'totalCompleted', 'totalDays', 'xp', 'achievementUnlocks', 'bonusXp', 'unlockedAchievements', 'startDate'], 'El progreso');
  for (const key of ['currentStreak', 'bestStreak', 'totalCompleted', 'totalDays', 'xp', 'bonusXp']) {
    finiteNonNegative(value.progress[key], `El campo de progreso ${key}`, true);
  }
  if (value.progress.achievementUnlocks !== undefined) {
    if (!isRecord(value.progress.achievementUnlocks)) fail('Los logros desbloqueados no son válidos.');
    for (const [id, unlock] of Object.entries(value.progress.achievementUnlocks)) {
      validText(id, 'Un identificador de logro', 128);
      if (!isRecord(unlock)) fail('Un logro desbloqueado no es válido.');
      onlyKeys(unlock, ['unlockedAt', 'xpEarned'], 'Un logro desbloqueado');
      validIso(unlock.unlockedAt, 'La fecha de un logro');
      finiteNonNegative(unlock.xpEarned, 'El XP de un logro', true);
    }
  }
  if (value.progress.unlockedAchievements !== undefined && (!Array.isArray(value.progress.unlockedAchievements) || value.progress.unlockedAchievements.some((id) => typeof id !== 'string'))) {
    fail('La lista antigua de logros no es válida.');
  }

  if (!isRecord(value.settings)) fail('Las preferencias no son válidas.');
  onlyKeys(value.settings, ['theme', 'userName'], 'Las preferencias');
  if (!['system', 'light', 'dark'].includes(String(value.settings.theme))) fail('El tema no es válido.');
  validText(value.settings.userName, 'El nombre configurado', 20);

  if (value.events !== undefined) {
    if (!isRecord(value.events)) fail('Los eventos no son válidos.');
    for (const [key, count] of Object.entries(value.events)) {
      validText(key, 'Un evento', 128);
      finiteNonNegative(count, 'El contador de un evento', true);
    }
  }
  if (value.companion !== undefined) {
    if (!isRecord(value.companion)) fail('El progreso de Solín no es válido.');
    onlyKeys(value.companion, ['visits', 'lastVisitedAt'], 'El progreso de Solín');
    finiteNonNegative(value.companion.visits, 'Las visitas de Solín', true);
    validIso(value.companion.lastVisitedAt, 'La última visita de Solín', true);
  }
}

export function createBackup(state: AppState, now = new Date()): BackupEnvelope {
  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.toISOString(),
    appVersion: APP_VERSION,
    data: state,
  };
}

export function serializeBackup(state: AppState, now = new Date()): string {
  return `${JSON.stringify(createBackup(state, now), null, 2)}\n`;
}

/** Parse, validate and normalize a backup without mutating the current app. */
export function parseBackup(text: string): AppState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    fail('El archivo no contiene JSON válido.');
  }
  if (!isRecord(parsed)) fail('El archivo de backup no tiene un formato válido.');
  onlyKeys(parsed, ['format', 'version', 'exportedAt', 'appVersion', 'data'], 'El archivo de backup');
  if (parsed.format !== BACKUP_FORMAT) fail('Este archivo no pertenece a Project Sun.');
  if (parsed.version !== BACKUP_VERSION) fail('La versión del backup no es compatible con esta aplicación.');
  validIso(parsed.exportedAt, 'La fecha de exportación');
  validText(parsed.appVersion, 'La versión de la aplicación', 32);
  validateState(parsed.data);
  return normalizeState(parsed.data);
}

export function getBackupSummary(state: AppState): BackupSummary {
  return {
    completedDays: Object.values(state.records).filter((record: DailyRecord) => record.completed).length,
    achievements: Object.keys(state.progress.achievementUnlocks).length,
    xp: state.progress.xp,
    missionTitle: state.mission.title,
  };
}

export function backupFileName(now = new Date()): string {
  return `project-sun-backup-${now.toISOString().replace(/[:.]/g, '-').replace('T', '_').replace('Z', '')}.json`;
}

/** Trigger a local browser download. No data leaves the device. */
export function downloadBackup(json: string, filename = backupFileName()): void {
  if (typeof document === 'undefined' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
    throw new Error('Tu navegador no permite descargar backups desde esta pantalla.');
  }
  const blob = new Blob([json], { type: 'application/json;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
