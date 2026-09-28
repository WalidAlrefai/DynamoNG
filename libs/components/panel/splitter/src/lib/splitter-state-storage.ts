import { isBrowser } from '@dynamong/utils/dom';
import type { DynamoSplitterStateStorage } from './splitter.types';

function resolveStorage(kind: DynamoSplitterStateStorage): Storage | null {
  if (!isBrowser()) return null;
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    // Storage disabled/blocked — some browsers' private-browsing modes throw
    // on access rather than simply being unavailable.
    return null;
  }
}

/**
 * Returns `null` if missing, unreadable, or shaped wrong — defensive against
 * manually-edited storage or a stale save from a different panel count. A
 * length mismatch must fall back to the normal initial-size distribution
 * rather than misapplying sizes to the wrong panels.
 */
export function readSplitterSizes(
  key: string,
  storageKind: DynamoSplitterStateStorage,
  expectedLength: number,
): number[] | null {
  const storage = resolveStorage(storageKind);
  if (!storage) return null;
  try {
    const raw = storage.getItem(key);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (
      !Array.isArray(parsed) ||
      parsed.length !== expectedLength ||
      !parsed.every((n) => typeof n === 'number' && Number.isFinite(n))
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function writeSplitterSizes(
  key: string,
  storageKind: DynamoSplitterStateStorage,
  sizes: readonly number[],
): void {
  const storage = resolveStorage(storageKind);
  if (!storage) return;
  try {
    storage.setItem(key, JSON.stringify(sizes));
  } catch {
    // Storage full/disabled — silently drop the save; persistence is a
    // nice-to-have, never a hard requirement for the splitter to function.
  }
}
