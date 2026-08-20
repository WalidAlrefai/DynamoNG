export type DynamoPaginationRangeItem = number | 'ellipsis';

/**
 * Windowed page-number list for the pager row: always includes page 1 and
 * `total`, plus a run of pages centered on `current`, collapsing any gap to
 * a single `'ellipsis'` entry — the same truncation PrimeNG's Paginator
 * applies via its `pageLinkSize`. `maxVisible` is a soft target (the
 * minimum useful window is 1 + gap + 3 + gap + 1, so it's floored at 5)
 * rather than a hard cap enforced by trimming the window further.
 */
export function buildPaginationRange(
  current: number,
  total: number,
  maxVisible: number,
): DynamoPaginationRangeItem[] {
  if (total <= 0) return [];

  const visible = Math.max(5, maxVisible);
  if (total <= visible) {
    return Array.from({ length: total }, (_, index) => index + 1);
  }

  const siblingCount = Math.max(1, Math.floor((visible - 3) / 2));
  let start = current - siblingCount;
  let end = current + siblingCount;

  if (start < 2) {
    end += 2 - start;
    start = 2;
  }
  if (end > total - 1) {
    start -= end - (total - 1);
    end = total - 1;
  }
  start = Math.max(2, start);
  end = Math.min(total - 1, end);

  const range: DynamoPaginationRangeItem[] = [1];
  if (start > 2) range.push('ellipsis');
  for (let page = start; page <= end; page++) range.push(page);
  if (end < total - 1) range.push('ellipsis');
  range.push(total);
  return range;
}
