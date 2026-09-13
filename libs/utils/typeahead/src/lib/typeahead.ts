/** Minimal shape typeahead matching needs — `DynamoSelectOption` and `DynamoTreeNode` both satisfy this structurally with no adapter. */
export interface DynamoTypeaheadItem {
  readonly label: string;
  readonly disabled?: boolean;
}

/**
 * Scans from just after `fromIndex`, wrapping, for the first non-disabled
 * item whose label starts with `query` (case-insensitive). Returns `null` if
 * nothing matches or the list is empty. Same wrap-and-skip-disabled idiom as
 * `findEnabledIndex`, generalized to a case-insensitive prefix test instead
 * of "any enabled item".
 */
export function findTypeaheadMatch<T extends DynamoTypeaheadItem>(
  items: readonly T[],
  fromIndex: number,
  query: string,
): number | null {
  if (items.length === 0 || query.length === 0) return null;
  const needle = query.toLowerCase();
  for (let step = 1; step <= items.length; step++) {
    const index = (fromIndex + step + items.length) % items.length;
    const item = items[index];
    if (item && !item.disabled && item.label.toLowerCase().startsWith(needle)) {
      return index;
    }
  }
  return null;
}

/**
 * WAI-ARIA APG special case: if every character typed so far is the SAME
 * character (e.g. "jjj"), treat the effective query as that one character —
 * combined with `findTypeaheadMatch` always scanning from just after the
 * current index, this makes repeated presses of one letter cycle through
 * every option starting with that letter, rather than the buffer growing
 * into a prefix ("jjj") that stops matching real words after the second
 * keystroke.
 */
export function resolveTypeaheadQuery(buffer: string): string {
  if (buffer.length <= 1) return buffer;
  return [...buffer].every((c) => c === buffer[0]) ? (buffer[0] ?? '') : buffer;
}

export interface DynamoTypeaheadBuffer {
  /** Appends `char` (lowercased), resetting the buffer first if the reset timer already elapsed since the last keystroke. Returns the buffer's new contents. */
  append(char: string): string;
  /** Cancels the pending reset timer and empties the buffer immediately — call on blur, Escape, or panel close. */
  clear(): void;
}

/** Default 500ms reset window matches the WAI-ARIA APG combobox/listbox reference pattern. */
export function createTypeaheadBuffer(
  resetDelayMs = 500,
): DynamoTypeaheadBuffer {
  let buffer = '';
  let timeoutId: ReturnType<typeof setTimeout> | undefined;

  function scheduleReset(): void {
    if (timeoutId !== undefined) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      buffer = '';
      timeoutId = undefined;
    }, resetDelayMs);
  }

  return {
    append(char: string): string {
      buffer += char.toLowerCase();
      scheduleReset();
      return buffer;
    },
    clear(): void {
      if (timeoutId !== undefined) clearTimeout(timeoutId);
      timeoutId = undefined;
      buffer = '';
    },
  };
}
