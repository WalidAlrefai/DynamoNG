import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  computed,
  input,
  isDevMode,
  model,
  signal,
} from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoPagination } from '@dynamong/pagination';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { cn } from '@dynamong/utils/class-merge';
import { filterRows } from './table.filter';
import { sortRows, type DynamoTableSortDirection } from './table.sort';
import {
  tableBodyCellStyles,
  tableBodyRowStyles,
  tableEmptyCellStyles,
  tableFilterWrapperStyles,
  tableHeaderCellStyles,
  tableHeaderRowStyles,
  tableLoadingWrapperStyles,
  tablePaginationWrapperStyles,
  tableSelectionCellStyles,
  tableSortButtonStyles,
  tableSortIconStyles,
  tableStyles,
  tableVirtualBodyRowStyles,
  tableVirtualHeaderRowStyles,
  tableVirtualStyles,
  tableWrapperStyles,
} from './table.styles';
import type {
  DynamoTableCellContext,
  DynamoTableColumn,
  DynamoTablePart,
  DynamoTableSize,
} from './table.types';

@Component({
  selector: 'dg-table',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    NgTemplateOutlet,
    DynamoCheckbox,
    DynamoInputText,
    DynamoPagination,
    DynamoSpinner,
    DynamoVirtualScroll,
  ],
  templateUrl: './table.html',
})
export class DynamoTable<TRow = unknown>
  extends DynamoBaseComponent<DynamoTablePart>
  implements OnInit
{
  readonly columns = input.required<DynamoTableColumn<TRow>[]>();
  readonly data = input.required<readonly TRow[]>();
  readonly size = input<DynamoTableSize>('md');
  readonly emptyMessage = input('No data');
  /** Renders a spinner + message in the empty-state slot and makes sorting,
   *  selection, filtering, and pagination non-interactive. Never emits
   *  back — the consumer drives it. */
  readonly loading = input(false);
  /** Shown in the empty-state slot instead of `emptyMessage`/`noMatchesMessage` while `loading` is true. */
  readonly loadingMessage = input('Loading…');
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
   * pagination UI shows at all — byte-for-byte identical to v1. Two-way
   * (`model()`, not `input()`) since v4: the footer is a real `<dg-pagination>`
   * whose rows-per-page `<dg-select>` needs to write a new size back.
   */
  readonly pageSize = model<number | undefined>(undefined);
  /**
   * Options for `<dg-pagination>`'s rows-per-page selector — forwarded
   * as-is. Defaults to `DynamoPagination`'s own default. If `pageSize` is
   * ever set to a value NOT in this list, the selector has nothing to
   * match and falls back to its placeholder — pass a list that includes
   * whatever `pageSize` you actually use.
   */
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);
  /**
   * Two-way bindable, 1-indexed: `<dg-table [(page)]="pageNum">`. The
   * *read* of this signal is clamped into range by `currentPage` below —
   * `page()` itself is only ever written by explicit user interaction
   * (Prev/Next) or a sort-/filter-triggering interaction, never by a
   * computed. Known simplification: if an externally-bound `pageNum` is
   * left out of range (e.g. `data()` shrank while the consumer's own
   * signal still pointed at page 3), the table silently *renders* the
   * clamped page without reaching back out to correct `pageNum` until the
   * user clicks Prev/Next (which read from `currentPage()`, not raw
   * `page()`, so the click writes the corrected value back). See README.
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

  /**
   * Opt-in global filter. `false` (default) renders no search UI at all —
   * byte-for-byte identical to v1/v2. When `true`, Table renders its own
   * `<input type="search">` above the table, matching how pagination's
   * Prev/Next controls and the selection checkbox column are also
   * Table-rendered UI rather than left to the consumer to build.
   */
  readonly filterable = input(false);
  /** Placeholder text for the search input rendered when `filterable` is `true`. */
  readonly filterPlaceholder = input('Search...');
  /**
   * Two-way bindable filter query: `<dg-table [(filterText)]="query">`, so
   * a consumer can read, clear, or pre-fill it externally — mirrors
   * `page`'s/`selected`'s own `model()` pattern. Matching is a
   * case-insensitive substring test against the trimmed, lowercased value;
   * blank/whitespace-only text matches every row (no filtering applied).
   * Typing into Table's own search input writes here AND resets `page` to
   * 1 in the same handler (`onFilterInput`) — no `effect()` needed, the
   * same technique `toggleSort` already uses for its own page-reset.
   */
  readonly filterText = model('');
  /**
   * Shown in the `@empty` block instead of `emptyMessage`, specifically
   * when `data()` has rows but the active `filterText` matched none of
   * them — see `emptyStateMessage` for the exact disambiguation. Kept
   * distinct from `emptyMessage` so a user with an active filter doesn't
   * mistake "nothing matched my search" for "there's no data at all".
   */
  readonly noMatchesMessage = input('No matching rows');

  /**
   * Opt-in — renders the body through `@dynamong/virtual-scroll` instead
   * of a plain `@for`, for large datasets. Mutually exclusive with
   * `pageSize` in v1: enabling this renders `sortedData()` directly
   * (bypassing `pagedData()`'s slice — virtualizing an already-small
   * paginated page defeats the purpose), and the pagination footer is
   * hidden while this is on. Not supported together with `selectable` in
   * v1 — the checkbox column isn't woven into the virtualized path's CSS
   * Grid layout. A real `<table>`/`<tbody>` cannot have a non-`<tr>` child
   * (CDK's viewport is a `<div>` — the HTML parser would foster-parent it
   * right out of the table), so this path is a genuinely different DOM
   * shape, not just an added feature — see table.html's own comment for
   * the CSS-Grid-with-explicit-ARIA-roles technique used instead. Equal-
   * width columns only in v1 (both grid contexts — header and body — share
   * one `virtualGridTemplate()` string; there's no per-column width input
   * yet to make that anything but equal).
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized. */
  readonly virtualScrollItemSize = input(40);
  /** Viewport height in px when virtualized. */
  readonly virtualScrollHeight = input(400);

  /** Sole source of truth for the active sort — mirrors DatePicker's single-signal pattern. */
  protected readonly sortState = signal<{
    field: string;
    direction: DynamoTableSortDirection;
  } | null>(null);

  /**
   * New pipeline stage, inserted BEFORE sorting: `data()` -> here ->
   * `sortedData()` -> `pagedData()`. Delegates to the pure `filterRows`
   * (`table.filter.ts`), passing `cellValue` as the accessor so filtering
   * reads `cell()`'s formatted output when present (unlike sorting, which
   * always reads the raw `field` — see `table.filter.ts`'s own doc for
   * why these deliberately differ). Never reads `cellTemplate`.
   */
  protected readonly filteredData = computed(() =>
    filterRows(this.data(), this.columns(), this.filterText(), (row, column) =>
      this.cellValue(row, column),
    ),
  );

  /** Sorts the FILTERED set (`filteredData()`), not raw `data()` — see `filteredData` above. */
  protected readonly sortedData = computed(() => {
    const state = this.sortState();
    const column = state
      ? this.columns().find((c) => c.field === state.field)
      : undefined;
    return sortRows(this.filteredData(), column, state?.direction ?? null);
  });

  /**
   * Always >= 1, even for zero rows — see `currentPage`'s doc for why this
   * matters. Based on `sortedData().length`, which now reflects BOTH
   * sorting and filtering — the same >=1 safety property holds whether the
   * length shrank to zero because `data()` itself is empty or because
   * `filterText` excluded every row.
   */
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
   * empty — which now includes "filtered down to zero rows", not just
   * "data() itself is empty". That's what lets `table.html`'s `@empty`
   * block keep meaning exactly "sortedData() has zero rows" post-
   * pagination; `emptyStateMessage` (below) picks the right wording for
   * *why* it's empty.
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

  /**
   * Picks which "no rows" message the `@empty` block shows. Only ever
   * consulted when `pagedData()` is empty, which (per `currentPage`'s
   * clamp guarantee above) only happens when `sortedData()`/
   * `filteredData()` itself is empty. Three states:
   *  1. `data()` itself has zero rows -> `emptyMessage()`, regardless of
   *     `filterText()` — an active-but-irrelevant filter must not steal
   *     this message from genuinely-empty data.
   *  2. `data()` has rows but the active `filterText()` matched none of
   *     them -> `noMatchesMessage()`.
   *  3. `filterText()` is blank/whitespace-only -> always `emptyMessage()`
   *     (falls into case 1) — a blank filter can never be "the reason"
   *     nothing matched.
   */
  protected readonly emptyStateMessage = computed(() => {
    const hasActiveFilter = this.filterText().trim().length > 0;
    return hasActiveFilter && this.data().length > 0
      ? this.noMatchesMessage()
      : this.emptyMessage();
  });

  /** Plain alias, not a `disabled`-merge — Table has no `disabled` input of its own to merge with. */
  protected readonly isBusy = computed(() => this.loading());

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
  protected readonly filterWrapperClasses = tableFilterWrapperStyles;
  protected readonly virtualTableClasses = tableVirtualStyles;
  protected readonly virtualHeaderRowClasses = tableVirtualHeaderRowStyles;
  protected readonly virtualBodyRowClasses = tableVirtualBodyRowStyles;
  protected readonly loadingWrapperClasses = tableLoadingWrapperStyles;

  /** Shared verbatim by the header row and every body row — see `virtualScroll`'s own doc comment for why this can't rely on native table auto-layout. */
  protected readonly virtualGridTemplate = computed(
    () => `repeat(${this.columns().length}, minmax(0, 1fr))`,
  );

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

  /**
   * Scoped to the *current page* (or all rows, unpaginated) — see
   * `toggleSelectAll`. Transitively scoped to the current filtered set
   * too, with no extra code: `pagedData()` is derived from `filteredData()`
   * via `sortedData()`, so "select all" after filtering naturally only
   * ever touches rows that are both filtered-in AND on the current page.
   */
  protected readonly isAllSelected = computed(() => {
    const rows = this.pagedData();
    return rows.length > 0 && rows.every((row) => this.isRowSelected(row));
  });

  /** Drives the header checkbox's `[indeterminate]` DOM-property binding. */
  protected readonly isSomeSelected = computed(() => {
    if (this.isAllSelected()) return false;
    return this.pagedData().some((row) => this.isRowSelected(row));
  });

  /**
   * Dev-only misconfiguration guard. `virtualScroll` is a static config
   * input (not reactive state), so a one-shot check on init is enough — no
   * `effect()`, keeping Table effect-free by design. The virtualized path
   * genuinely can't render the selection checkbox column or the pagination
   * footer in v1 (see `virtualScroll`'s own doc), and today it just drops
   * them silently; this makes that visible while developing.
   */
  ngOnInit(): void {
    if (!isDevMode()) return;
    if (this.virtualScroll() && this.selectable()) {
      console.warn(
        '[dg-table] `selectable` is ignored while `virtualScroll` is enabled — the selection checkbox column is not supported on the virtualized path (v1).',
      );
    }
    if (this.virtualScroll() && this.pageSize()) {
      console.warn(
        '[dg-table] `pageSize` is ignored while `virtualScroll` is enabled — the virtualized path renders all rows and hides the pagination footer (v1).',
      );
    }
  }

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
   * calls on click) rather than needing an `effect()`. Unaffected by
   * filtering: this operates on `columns()`, not row data.
   */
  protected toggleSort(column: DynamoTableColumn<TRow>): void {
    if (this.isBusy() || !column.sortable) return;
    this.sortState.update((state) => {
      if (state?.field !== column.field)
        return { field: column.field, direction: 'asc' };
      if (state.direction === 'asc')
        return { field: column.field, direction: 'desc' };
      return null;
    });
    this.page.set(1);
  }

  /**
   * Wired to `<dg-input-text>`'s `(valueChange)` — its own public `value`
   * model, not `[ngModel]`/`(ngModelChange)`: Angular's `NgModel` directive
   * declares its own `@Input('disabled')` for template-driven disabling,
   * which silently wins over `DynamoInputText`'s own `disabled` model when
   * both are bound on the same element — discovered live via `loading()`'s
   * `[disabled]` binding on the filter input never actually taking effect
   * while `[ngModel]` was also present. `(valueChange)` sidesteps Angular
   * Forms entirely, so there's no such collision. Writing `filterText` and
   * resetting `page` to 1 together this way needs no `effect()`, the same
   * technique `toggleSort` already uses above for its own page-reset.
   */
  protected onFilterTextChange(value: string): void {
    if (this.isBusy()) return;
    this.filterText.set(value);
    this.page.set(1);
  }

  protected cellValue(row: TRow, column: DynamoTableColumn<TRow>): unknown {
    return column.cell
      ? column.cell(row)
      : (row as Record<string, unknown>)[column.field];
  }

  /**
   * Builds the context object handed to a column's `cellTemplate` via
   * `[ngTemplateOutletContext]`. `pageIndex` is the row's position within
   * `pagedData()` (the template's own `$index` for that `@for`) —
   * converted to its absolute position in `sortedData()` via the existing
   * `absoluteIndex` helper, exactly like `trackRow` already does, so
   * `index` means the same thing here as it does for `trackBy`.
   */
  protected cellContext(
    row: TRow,
    pageIndex: number,
  ): DynamoTableCellContext<TRow> {
    return { $implicit: row, row, index: this.absoluteIndex(pageIndex) };
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

  protected isRowSelected(row: TRow): boolean {
    return this.selectedKeys().has(this.selectionKey(row));
  }

  protected toggleRowSelection(row: TRow): void {
    if (this.isBusy()) return;
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
    if (this.isBusy()) return;
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
