import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { sortRows, type DynamoTableSortDirection } from './table.sort';
import {
  tableBodyCellStyles,
  tableBodyRowStyles,
  tableCheckboxStyles,
  tableEmptyCellStyles,
  tableHeaderCellStyles,
  tableHeaderRowStyles,
  tablePageIndicatorStyles,
  tablePaginationButtonStyles,
  tablePaginationWrapperStyles,
  tableSelectionCellStyles,
  tableSortButtonStyles,
  tableSortIconStyles,
  tableStyles,
  tableWrapperStyles,
} from './table.styles';
import type {
  DynamoTableColumn,
  DynamoTablePart,
  DynamoTableSize,
} from './table.types';

@Component({
  selector: 'dg-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './table.html',
})
export class DynamoTable<
  TRow = unknown,
> extends DynamoBaseComponent<DynamoTablePart> {
  readonly columns = input.required<DynamoTableColumn<TRow>[]>();
  readonly data = input.required<readonly TRow[]>();
  readonly size = input<DynamoTableSize>('md');
  readonly emptyMessage = input('No data');
  readonly ariaLabel = input<string | undefined>(undefined);
  /**
   * `@for` track escape hatch for when `data()` rows are freshly recreated
   * on every render. Defaults to row-object reference identity (not
   * index) — index-tracking would make every re-sort look like a full
   * row-by-row DOM teardown/recreate instead of a reorder of existing
   * nodes. Also used (see `rowKey`/`selectionKey` below) as the identity
   * source for row selection membership.
   */
  readonly trackBy = input<((row: TRow, index: number) => unknown) | undefined>(
    undefined,
  );

  /**
   * Opt-in pagination. Unset (default) means every row renders and no
   * pagination UI shows at all — byte-for-byte identical to v1.
   */
  readonly pageSize = input<number | undefined>(undefined);
  /**
   * Two-way bindable, 1-indexed: `<dg-table [(page)]="pageNum">`. The
   * *read* of this signal is clamped into range by `currentPage` below —
   * `page()` itself is only ever written by explicit user interaction
   * (Prev/Next) or a sort-triggering header click, never by a computed.
   * Known simplification: if an externally-bound `pageNum` is left out of
   * range (e.g. `data()` shrank while the consumer's own signal still
   * pointed at page 3), the table silently *renders* the clamped page
   * without reaching back out to correct `pageNum` until the user clicks
   * Prev/Next (which read from `currentPage()`, not raw `page()`, so the
   * click writes the corrected value back). See README.
   */
  readonly page = model(1);

  /** Opt-in row selection. Unset/false renders no selection column. */
  readonly selectable = input(false);
  /**
   * Two-way bindable array of the actual selected row objects (not
   * indices): `<dg-table [(selected)]="selectedRows">`. This model is the
   * entire event surface — no separate `selectionChange` output, mirroring
   * DynamoAlert/DynamoDialog's own model()-only pattern.
   */
  readonly selected = model<TRow[]>([]);

  /** Sole source of truth for the active sort — mirrors DatePicker's single-signal pattern. */
  protected readonly sortState = signal<{
    field: string;
    direction: DynamoTableSortDirection;
  } | null>(null);

  protected readonly sortedData = computed(() => {
    const state = this.sortState();
    const column = state
      ? this.columns().find((c) => c.field === state.field)
      : undefined;
    return sortRows(this.data(), column, state?.direction ?? null);
  });

  /** Always >= 1, even for zero rows — see `currentPage`'s doc for why this matters. */
  protected readonly pageCount = computed(() => {
    const size = this.pageSize();
    if (!size) return 1;
    return Math.max(1, Math.ceil(this.sortedData().length / size));
  });

  /**
   * Clamps the *read* of `page()` into `[1, pageCount()]` without ever
   * writing back to `page` — this is what keeps Table effect-free.
   * Because `pageCount()` is always >= 1 and the last page of a non-empty
   * `sortedData()` always holds at least one row, `pagedData()` derived
   * from this clamp can only ever be empty when `sortedData()` itself is
   * empty. That's what lets `table.html`'s `@empty` block keep meaning
   * exactly "data() has zero rows" post-pagination.
   */
  protected readonly currentPage = computed(() =>
    Math.min(Math.max(1, this.page()), this.pageCount()),
  );

  protected readonly pagedData = computed(() => {
    const size = this.pageSize();
    if (!size) return this.sortedData();
    const start = (this.currentPage() - 1) * size;
    return this.sortedData().slice(start, start + size);
  });

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(tableWrapperStyles, this.styleClass()),
  );
  protected readonly tableClasses = tableStyles;
  protected readonly headerRowClasses = tableHeaderRowStyles;
  protected readonly sortButtonClasses = tableSortButtonStyles;
  protected readonly emptyCellClasses = tableEmptyCellStyles;
  protected readonly paginationWrapperClasses = tablePaginationWrapperStyles;
  protected readonly paginationButtonClasses = tablePaginationButtonStyles;
  protected readonly pageIndicatorClasses = tablePageIndicatorStyles;
  protected readonly checkboxClasses = tableCheckboxStyles;

  protected readonly headerCellClasses = computed(() =>
    tableHeaderCellStyles({ size: this.size() }),
  );
  protected readonly bodyCellClasses = computed(() =>
    tableBodyCellStyles({ size: this.size() }),
  );
  protected readonly selectionCellClasses = computed(() =>
    tableSelectionCellStyles({ size: this.size() }),
  );

  /**
   * Selection-identity keys for every row currently in `selected()` — an
   * O(1)-per-row lookup set instead of an O(n) scan of `selected()` for
   * every rendered row.
   */
  protected readonly selectedKeys = computed(
    () => new Set(this.selected().map((row) => this.selectionKey(row))),
  );

  /** Scoped to the *current page* (or all rows, unpaginated) — see `toggleSelectAll`. */
  protected readonly isAllSelected = computed(() => {
    const rows = this.pagedData();
    return rows.length > 0 && rows.every((row) => this.isRowSelected(row));
  });

  /** Drives the header checkbox's `[indeterminate]` DOM-property binding. */
  protected readonly isSomeSelected = computed(() => {
    if (this.isAllSelected()) return false;
    return this.pagedData().some((row) => this.isRowSelected(row));
  });

  protected sortIconClasses(
    direction: DynamoTableSortDirection | 'none',
  ): string {
    return tableSortIconStyles({ direction });
  }

  protected sortDirectionFor(field: string): DynamoTableSortDirection | 'none' {
    const state = this.sortState();
    return state?.field === field ? state.direction : 'none';
  }

  protected ariaSortFor(field: string): 'ascending' | 'descending' | null {
    const state = this.sortState();
    if (state?.field !== field) return null;
    return state.direction === 'asc' ? 'ascending' : 'descending';
  }

  /**
   * Click cycle: unsorted -> ascending -> descending -> unsorted. Clicking
   * a *different* sortable column always jumps straight to ascending on
   * the new column — single-column sort only, no memory of the previously
   * sorted column. Also resets to page 1: changing sort order without
   * returning to page 1 would leave a paginated table showing a
   * disorienting mid-list slice under the new order. Table owns this
   * reset directly (a plain `page.set(1)` inside a method it already
   * calls on click) rather than needing an `effect()`.
   */
  protected toggleSort(column: DynamoTableColumn<TRow>): void {
    if (!column.sortable) return;
    this.sortState.update((state) => {
      if (state?.field !== column.field)
        return { field: column.field, direction: 'asc' };
      if (state.direction === 'asc')
        return { field: column.field, direction: 'desc' };
      return null;
    });
    this.page.set(1);
  }

  protected cellValue(row: TRow, column: DynamoTableColumn<TRow>): unknown {
    return column.cell
      ? column.cell(row)
      : (row as Record<string, unknown>)[column.field];
  }

  protected bodyRowClasses(row: TRow): string {
    return tableBodyRowStyles({ selected: this.isRowSelected(row) });
  }

  /**
   * `@for`'s track function. `pageIndex` is the row's position within
   * `pagedData()` ($index from the template) — converted to its absolute
   * position in `sortedData()` before being handed to `trackBy`, so a
   * `trackBy` fn keeps seeing exactly the index it would have seen
   * pre-pagination (a no-op when `pageSize` is unset).
   */
  protected trackRow(row: TRow, pageIndex: number): unknown {
    return this.rowKey(row, this.absoluteIndex(pageIndex));
  }

  protected goToPreviousPage(): void {
    this.page.set(Math.max(1, this.currentPage() - 1));
  }

  protected goToNextPage(): void {
    this.page.set(Math.min(this.pageCount(), this.currentPage() + 1));
  }

  protected isRowSelected(row: TRow): boolean {
    return this.selectedKeys().has(this.selectionKey(row));
  }

  protected toggleRowSelection(row: TRow): void {
    const key = this.selectionKey(row);
    this.selected.update((rows) =>
      this.selectedKeys().has(key)
        ? rows.filter((r) => this.selectionKey(r) !== key)
        : [...rows, row],
    );
  }

  /**
   * "Select all" is scoped to the rows on the current page (or every row,
   * when unpaginated, since `pagedData()` already equals `sortedData()`
   * in that case) — not every row across every page. A cross-page
   * "select all N rows across M pages" is a materially different feature
   * (usually needs its own "N selected across M pages" banner) and is
   * explicitly out of scope. Selections made on other pages are preserved
   * either way — only this page's membership is toggled.
   */
  protected toggleSelectAll(): void {
    const rows = this.pagedData();
    if (this.isAllSelected()) {
      const keysOnPage = new Set(rows.map((row) => this.selectionKey(row)));
      this.selected.update((selected) =>
        selected.filter((row) => !keysOnPage.has(this.selectionKey(row))),
      );
      return;
    }
    const existingKeys = this.selectedKeys();
    const additions = rows.filter(
      (row) => !existingKeys.has(this.selectionKey(row)),
    );
    this.selected.update((selected) => [...selected, ...additions]);
  }

  private absoluteIndex(pageIndex: number): number {
    const size = this.pageSize();
    return size ? (this.currentPage() - 1) * size + pageIndex : pageIndex;
  }

  /**
   * Row-identity helper shared by `@for`'s track function (`trackRow`,
   * real index) and selection membership (`selectionKey`, fixed index —
   * see below). Uses `trackBy` when provided, else row-object reference
   * equality — the same default `@for`'s own tracking already falls back
   * to.
   */
  private rowKey(row: TRow, index: number): unknown {
    const fn = this.trackBy();
    return fn ? fn(row, index) : row;
  }

  /**
   * Row identity for selection purposes always calls `rowKey` with a
   * fixed index of `0`, on both the rendered row and every row already in
   * `selected()`. Selection must stay stable as a row moves across pages
   * or sort positions (a different index on every render) — well-defined
   * only if a *provided* `trackBy` is a pure function of the row alone
   * (e.g. `(row) => row.id`), ignoring its `index` argument entirely.
   * Without a `trackBy`, this falls back to `===` reference equality, so
   * selection does not survive a wholesale `data()` array replacement in
   * that case — documented as a known constraint in the README.
   */
  private selectionKey(row: TRow): unknown {
    return this.rowKey(row, 0);
  }
}
