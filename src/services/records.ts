import type { DailyRecord, DateKey } from '../types';

/**
 * Pure record helpers. Records are the single source of truth: at most one
 * `DailyRecord` exists per `DateKey` (dates are unique by construction, the
 * reducer guards against duplicates). Nothing here reads time or storage.
 */

/** True when the record exists and the day was completed. */
export function isCompleted(record: DailyRecord | undefined): boolean {
  return record?.completed === true;
}

/** True when a record exists for the given date. */
export function hasRecord(
  records: Record<DateKey, DailyRecord>,
  key: DateKey,
): boolean {
  return records[key] !== undefined;
}

/**
 * Duplicate detection: registering a day that already has a record.
 * Because dates are keyed, "duplicate" means "a record already exists for
 * that DateKey". Returns the existing record so callers can decide.
 */
export function findDuplicate(
  records: Record<DateKey, DailyRecord>,
  key: DateKey,
): DailyRecord | undefined {
  return records[key];
}

/** Convenience boolean form of `findDuplicate`. */
export function isDuplicateEntry(
  records: Record<DateKey, DailyRecord>,
  key: DateKey,
): boolean {
  return findDuplicate(records, key) !== undefined;
}

/** Whether the mission was completed on the given day. */
export function isMissionCompletedOn(
  records: Record<DateKey, DailyRecord>,
  key: DateKey,
): boolean {
  return isCompleted(records[key]);
}
