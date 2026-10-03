import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  type OnInit,
  type TemplateRef,
  computed,
  input,
  isDevMode,
  model,
  output,
  signal,
} from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoPagination } from '@dynamong/pagination';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { cn } from '@dynamong/utils/class-merge';
import { filterRows, filterRowsByColumns } from './table.filter';
import {
  sortRowsMulti,
  type DynamoTableSortDescriptor,
  type DynamoTableSortDirection,
} from './table.sort';
import {
  tableBodyCellStyles,
  tableBodyRowStyles,
  tableColumnFilterCellStyles,
  tableColumnFilterRowStyles,
  tableDetailCellStyles,
  tableEmptyCellStyles,
  tableExpandButtonStyles,
  tableExpandCellStyles,
  tableExpandIconStyles,
  tableFilterWrapperStyles,
  tableHeaderCellStyles,
  tableHeaderRowStyles,
  tableLoadingWrapperStyles,
  tablePaginationWrapperStyles,
  tableSelectionCellStyles,
  tableSortButtonStyles,
  tableSortIconStyles,
  tableSortPriorityStyles,
  tableStyles,
  tableVirtualBodyRowStyles,
  tableVirtualHeaderRowStyles,
  tableVirtualStyles,
  tableWrapperStyles,
} from './table.styles';
import type {
  DynamoTableCellContext,
  DynamoTableColumn,
  DynamoTableColumnFilterContext,
  DynamoTableExpandMode,
  DynamoTableLazyLoadEvent,
  DynamoTablePart,
  DynamoTableSize,
  DynamoTableSortMode,
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
    DynamoPassThroughDirective,
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
  /** Associates the table with an external help/error message element via `aria-describedby`,
   *  bound on both render paths' primary element — same pattern as `ariaLabel`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `true` to match every existing consumer's
   *  assumption of a full-width table; set `false` for content-driven/intrinsic sizing. */
  readonly fluid = input(true);
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
   * indices): `<dg-table [(selected)]="selectedRows">`. `itemSelect` fires
   * alongside this for row-level selection events; bulk operations
   * (select-all) only update this model, they don't fire `itemSelect` per
   * row.
   */
  readonly selected = model<TRow[]>([]);
  /** Fires once per row a user directly checks/unchecks — not from `toggleSelectAll()`. */
  readonly itemSelect = output<TRow>();

  /**
   * Opt-in row expansion. Setting this renders a leading chevron column;
   * expanding a row renders this template in a full-width detail row right
   * under it, with the same `{ $implicit, row, index }` context a column's
   * `cellTemplate` gets. Unset (default) renders no expander column at all.
   * Not supported with `virtualScroll` (see `ngOnInit`).
   */
  readonly expansionTemplate = input<
    TemplateRef<DynamoTableCellContext<TRow>> | undefined
  >(undefined);
  /** Two-way bindable array of the actual expanded row objects: `<dg-table [(expandedRows)]="open">`. */
  readonly expandedRows = model<TRow[]>([]);
  readonly expandMode = input<DynamoTableExpandMode>('multiple');

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
  /** Accessible name for the search input rendered when `filterable` is `true` — like every
   *  other user-facing string on Table, this is configurable instead of a hardcoded string. */
  readonly filterAriaLabel = input('Search table');
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
   * Two-way bindable per-column filter values, keyed by `column.field`:
   * `<dg-table [(columnFilters)]="filters">`. Mirrors `filterText`'s own
   * model pattern but scoped per-column instead of one global query —
   * composes as a logical AND with `filterText`, never replaces it. See
   * `filteredData` for how the two layers combine.
   */
  readonly columnFilters = model<Record<string, unknown>>({});

  /**
   * Opt-in server-driven mode: `data()` is expected to hold only the
   * *current page's* already-filtered/sorted rows, and `totalRecords` — not
   * `data().length` — drives `pageCount`. Table no longer filters, sorts, or
   * slices `data()` itself while this is on; it only emits `lazyLoad`
   * whenever page/pageSize/sort/filter state changes via Table's OWN UI,
   * and the consumer re-fetches and re-binds `data` in response. Mutually
   * exclusive with `virtualScroll` (dev warning, not a hard block — same
   * posture as the existing `virtualScroll`+`pageSize` exclusion): true
   * lazy-loading virtualization (fetch-more-as-scrolled) is a materially
   * bigger feature with no `scrolledIndexChange`-equivalent output yet,
   * out of scope for this round.
   */
  readonly lazy = input(false);
  /** Required in `lazy` mode to compute the correct page count from a `data()` that only holds
   *  the current page (dev warning if omitted — falls back to `data().length`, which is almost
   *  certainly wrong). Ignored otherwise. */
  readonly totalRecords = input<number | undefined>(undefined);
  /** Emitted from `lazy` mode whenever page/pageSize/sort/either filter changes via Table's own
   *  UI — see `DynamoTableLazyLoadEvent`'s own doc comment for the full contract. */
  readonly lazyLoad = output<DynamoTableLazyLoadEvent>();

  /**
   * Opt-in — renders the body through `@dynamong/virtual-scroll` instead
   * of a plain `@for`, for large datasets. Mutually exclusive with
   * `pageSize`: enabling this renders `sortedData()` directly (bypassing
   * `pagedData()`'s slice — virtualizing an already-small paginated page
   * defeats the purpose), and the pagination footer is hidden while this
   * is on — a deliberate, permanent design choice, not a v1 gap.
   * `selectable` IS supported here (v6) — see `table.html`'s comment on
   * why the virtualized path is a different DOM shape (CSS Grid with
   * explicit ARIA roles, not a real `<table>`) and how the checkbox
   * column is woven into that grid.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized. */
  readonly virtualScrollItemSize = input(40);
  /** Viewport height in px when virtualized. */
  readonly virtualScrollHeight = input(400);

  /** `'single'` (default) is today's click-cycle: a plain click always
   *  collapses to just that column. `'multiple'` additionally lets a
   *  shift-click add/cycle a column as an extra sort key without
   *  disturbing the others — see `toggleSort`. */
  readonly sortMode = input<DynamoTableSortMode>('single');

  /** Sole source of truth for the active sort. Always an array — empty
   *  means unsorted, one entry is single-sort (byte-for-byte today's
   *  behavior), 2+ entries is multi-sort (`sortMode="multiple"` only). */
  protected readonly sortState = signal<DynamoTableSortDescriptor[]>([]);

  /**
   * New pipeline stage, inserted BEFORE sorting: `data()` -> here ->
   * `sortedData()` -> `pagedData()`. Delegates to the pure `filterRows`
   * (`table.filter.ts`), passing `cellValue` as the accessor so filtering
   * reads `cell()`'s formatted output when present (unlike sorting, which
   * always reads the raw `field` — see `table.filter.ts`'s own doc for
   * why these deliberately differ). Never reads `cellTemplate`. Per-column
   * filters (`filterRowsByColumns`) run AFTER the global pass, as a logical
   * AND on top of it — never instead of it.
   */
  /** While `lazy()`, `data()` already holds exactly the rows to show — filtering it again here
   *  would be redundant (and wrong, since it's only ever the current page's worth, not the full set). */
  protected readonly filteredData = computed(() => {
    if (this.lazy()) return this.data();
    const globallyFiltered = filterRows(
      this.data(),
      this.columns(),
      this.filterText(),
      (row, column) => this.cellValue(row, column),
    );
    return filterRowsByColumns(
      globallyFiltered,
      this.columns(),
      this.columnFilters(),
      (row, column) => this.cellValue(row, column),
    );
  });

  /** Sorts the FILTERED set (`filteredData()`), not raw `data()` — see
   *  `filteredData` above. `sortRowsMulti` handles single-sort identically
   *  to before — a one-descriptor array is just a primary key with no
   *  tiebreakers. Skipped while `lazy()`, same reasoning as `filteredData`. */
  protected readonly sortedData = computed(() =>
    this.lazy()
      ? this.filteredData()
      : sortRowsMulti(this.filteredData(), this.columns(), this.sortState()),
  );

  /** The pagination footer's total-item count — `totalRecords()` (falling back to `data().length`,
   *  dev-warned) while `lazy()`, since `data()` only ever holds the current page's rows in that
   *  mode; `sortedData().length` otherwise. */
  protected readonly totalItemCount = computed(() =>
    this.lazy()
      ? (this.totalRecords() ?? this.data().length)
      : this.sortedData().length,
  );

  /**
   * Always >= 1, even for zero rows — see `currentPage`'s doc for why this
   * matters. Based on `totalItemCount()`, which reflects sorting AND
   * filtering in non-lazy mode, or `totalRecords()` in `lazy` mode — the
   * same >=1 safety property holds whether the length shrank to zero
   * because `data()` itself is empty or because a filter excluded every row.
   */
  protected readonly pageCount = computed(() => {
    const size = this.pageSize();
    if (!size) return 1;
    return Math.max(1, Math.ceil(this.totalItemCount() / size));
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

  /** While `lazy()`, `data()` already holds exactly the current page's rows — slicing it again
   *  here would be wrong (it would cut an already-page-sized array down further). */
  protected readonly pagedData = computed(() => {
    if (this.lazy()) return this.data();
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
   *     `filterText()`/`columnFilters()` — an active-but-irrelevant filter
   *     must not steal this message from genuinely-empty data.
   *  2. `data()` has rows but the active `filterText()`/`columnFilters()`
   *     matched none of them -> `noMatchesMessage()`.
   *  3. Both filters are blank/inactive -> always `emptyMessage()` (falls
   *     into case 1) — an inactive filter can never be "the reason"
   *     nothing matched.
   */
  protected readonly emptyStateMessage = computed(() => {
    const hasActiveGlobalFilter = this.filterText().trim().length > 0;
    const hasActiveColumnFilter = Object.values(this.columnFilters()).some(
      (value) => value !== undefined && value !== null && value !== '',
    );
    const hasActiveFilter = hasActiveGlobalFilter || hasActiveColumnFilter;
    return hasActiveFilter && this.data().length > 0
      ? this.noMatchesMessage()
      : this.emptyMessage();
  });

  /** Plain alias, not a `disabled`-merge — Table has no `disabled` input of its own to merge with. */
  protected readonly isBusy = computed(() => this.loading());

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          tableWrapperStyles({ fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly tableClasses = computed(() =>
    cn(tableStyles, this.ptFor('table').class),
  );
  protected readonly headerRowClasses = computed(() =>
    cn(tableHeaderRowStyles, this.ptFor('headerRow').class),
  );
  protected readonly sortButtonClasses = computed(() =>
    cn(tableSortButtonStyles, this.ptFor('sortButton').class),
  );
  protected readonly sortPriorityClasses = tableSortPriorityStyles;
  protected readonly emptyCellClasses = tableEmptyCellStyles;
  protected readonly paginationWrapperClasses = computed(() =>
    cn(tablePaginationWrapperStyles, this.ptFor('paginationWrapper').class),
  );
  protected readonly filterWrapperClasses = computed(() =>
    cn(tableFilterWrapperStyles, this.ptFor('filterWrapper').class),
  );
  protected readonly columnFilterRowClasses = computed(() =>
    cn(tableColumnFilterRowStyles, this.ptFor('columnFilterRow').class),
  );
  protected readonly columnFilterCellClasses = computed(() =>
    cn(
      tableColumnFilterCellStyles({ size: this.size() }),
      this.ptFor('columnFilterCell').class,
    ),
  );
  /** True when ANY column declares `columnFilter` — drives whether the
   *  second header filter row renders at all. No separate Table-level
   *  toggle input (unlike `filterable`, which gates the global search box)
   *  — consistent with how `sortable`/`cellTemplate` are also purely
   *  column-level opt-ins with no parent "sortingEnabled" flag. */
  protected readonly hasColumnFilters = computed(() =>
    this.columns().some((column) => !!column.columnFilter),
  );
  protected readonly virtualTableClasses = computed(() =>
    cn(tableVirtualStyles, this.ptFor('table').class),
  );
  protected readonly virtualHeaderRowClasses = computed(() =>
    cn(tableVirtualHeaderRowStyles, this.ptFor('headerRow').class),
  );
  protected readonly virtualBodyRowClasses = computed(() =>
    cn(tableVirtualBodyRowStyles, this.ptFor('bodyRow').class),
  );
  protected readonly loadingWrapperClasses = tableLoadingWrapperStyles;

  /**
   * Shared verbatim by the header row and every body row — see
   * `virtualScroll`'s own doc comment for why the two grid contexts can't
   * rely on native table auto-layout to stay aligned. A leading `2.5rem`
   * track is prepended for the selection column when `selectable` is on.
   */
  protected readonly virtualGridTemplate = computed(() => {
    const tracks = this.columns().map(() => 'minmax(0, 1fr)');
    return this.selectable()
      ? ['2.5rem', ...tracks].join(' ')
      : tracks.join(' ');
  });

  protected readonly headerCellClasses = computed(() =>
    cn(
      tableHeaderCellStyles({ size: this.size() }),
      this.ptFor('headerCell').class,
    ),
  );
  protected readonly bodyCellClasses = computed(() =>
    cn(
      tableBodyCellStyles({ size: this.size() }),
      this.ptFor('bodyCell').class,
    ),
  );
  protected readonly selectionCellClasses = computed(() =>
    cn(
      tableSelectionCellStyles({ size: this.size() }),
      this.ptFor('selectionCell').class,
    ),
  );
  protected readonly expandCellClasses = computed(() =>
    cn(
      tableExpandCellStyles({ size: this.size() }),
      this.ptFor('expandCell').class,
    ),
  );
  protected readonly expandButtonClasses = computed(() =>
    cn(tableExpandButtonStyles, this.ptFor('expandButton').class),
  );
  protected readonly detailCellClasses = computed(() =>
    cn(tableDetailCellStyles, this.ptFor('detailCell').class),
  );
  private readonly tableId = this.idGenerator.next('dg-table');

  /** Expansion is off under `virtualScroll` — its grid DOM has no detail-row slot. */
  protected readonly expansionEnabled = computed(
    () => !!this.expansionTemplate() && !this.virtualScroll(),
  );

  /** Columns + selection + expander, for full-width detail/empty cells. */
  protected readonly fullColspan = computed(
    () =>
      this.columns().length +
      (this.selectable() ? 1 : 0) +
      (this.expansionEnabled() ? 1 : 0),
  );

  /** O(1) expansion lookup, keyed by the same row identity selection uses. */
  protected readonly expandedKeys = computed(
    () => new Set(this.expandedRows().map((row) => this.selectionKey(row))),
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
   * `effect()`, keeping Table effect-free by design. `pageSize` is a
   * deliberate, permanent exclusion (see `virtualScroll`'s own doc) — the
   * virtualized path renders all rows and hides the pagination footer;
   * this makes that visible while developing rather than silently
   * dropping it.
   */
  ngOnInit(): void {
    if (!isDevMode()) return;
    if (this.virtualScroll() && this.expansionTemplate()) {
      console.warn(
        '[dg-table] `expansionTemplate` is ignored while `virtualScroll` is enabled — the virtualized grid has no detail-row slot.',
      );
    }
    if (this.virtualScroll() && this.pageSize()) {
      console.warn(
        '[dg-table] `pageSize` is ignored while `virtualScroll` is enabled — the virtualized path renders all rows and hides the pagination footer.',
      );
    }
    if (this.lazy() && this.virtualScroll()) {
      console.warn(
        '[dg-table] `lazy` and `virtualScroll` cannot be meaningfully combined yet — `virtualScroll` renders `data()` as-is with no fetch-more-on-scroll hook, so `lazy` has no effect while it is on.',
      );
    }
    if (this.lazy() && this.totalRecords() === undefined) {
      console.warn(
        "[dg-table] `lazy` is on without `totalRecords` — `pageCount` falls back to `data().length` (the current page's own row count), which is almost certainly not the real total. Set `totalRecords`.",
      );
    }
    if (
      this.lazy() &&
      (this.selectable() || this.expansionTemplate()) &&
      !this.trackBy()
    ) {
      console.warn(
        '[dg-table] `lazy` is on with `selectable`/`expansionTemplate` but no `trackBy` — re-fetching a previously-visited page returns new row-object references, so selection/expansion state for that page will appear to silently clear even though the underlying rows are unchanged. Provide a stable `trackBy`.',
      );
    }
  }

  protected sortIconClasses(
    direction: DynamoTableSortDirection | 'none',
  ): string {
    return cn(tableSortIconStyles({ direction }), this.ptFor('sortIcon').class);
  }

  protected sortDirectionFor(field: string): DynamoTableSortDirection | 'none' {
    return this.sortState().find((s) => s.field === field)?.direction ?? 'none';
  }

  /**
   * `'none'` (not `null`) for a sortable column with no active sort
   * descriptor — WAI-ARIA authoring practice wants an explicit "none" so
   * assistive tech can distinguish "sortable, not currently sorted" from
   * "not sortable at all". The `null` case for a genuinely non-sortable
   * column is still handled entirely by the template's own
   * `column.sortable ? ariaSortFor(...) : null` ternary — this method is
   * only ever consulted for a sortable column, so it never itself needs to
   * return `null`.
   */
  protected ariaSortFor(field: string): 'ascending' | 'descending' | 'none' {
    const state = this.sortState().find((s) => s.field === field);
    if (!state) return 'none';
    return state.direction === 'asc' ? 'ascending' : 'descending';
  }

  /** 1-indexed sort priority for the header badge; `null` when this column
   *  isn't sorted, or when only one key is active (a lone "1" badge would
   *  be visual noise single-sort mode already doesn't have). */
  protected sortPriorityFor(field: string): number | null {
    if (this.sortState().length < 2) return null;
    const index = this.sortState().findIndex((s) => s.field === field);
    return index === -1 ? null : index + 1;
  }

  /**
   * Plain click: unsorted -> ascending -> descending -> unsorted, always
   * collapsing to just this column regardless of how many other keys were
   * active — single-column sort behavior, unchanged from before
   * `sortMode` existed. Shift-click while `sortMode="multiple"` instead
   * adds/cycles this column as an EXTRA key, leaving the others' order and
   * direction untouched, cycling asc -> desc -> removed for that key
   * alone. Also resets to page 1 either way: changing sort order without
   * returning to page 1 would leave a paginated table showing a
   * disorienting mid-list slice under the new order. Table owns this
   * reset directly (a plain `page.set(1)` inside a method it already
   * calls on click) rather than needing an `effect()`. Unaffected by
   * filtering: this operates on `columns()`, not row data.
   */
  protected toggleSort(
    column: DynamoTableColumn<TRow>,
    event?: MouseEvent,
  ): void {
    if (this.isBusy() || !column.sortable) return;
    const additive = this.sortMode() === 'multiple' && !!event?.shiftKey;
    this.sortState.update((state) => {
      const existingIndex = state.findIndex((s) => s.field === column.field);
      const existing = existingIndex === -1 ? null : state[existingIndex];

      if (!additive) {
        if (!existing) return [{ field: column.field, direction: 'asc' }];
        if (existing.direction === 'asc')
          return [{ field: column.field, direction: 'desc' }];
        return [];
      }

      if (!existing)
        return [...state, { field: column.field, direction: 'asc' }];
      if (existing.direction === 'asc') {
        const next = [...state];
        next[existingIndex] = { field: column.field, direction: 'desc' };
        return next;
      }
      return state.filter((s) => s.field !== column.field);
    });
    this.page.set(1);
    this.emitLazyLoad();
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
    this.emitLazyLoad();
  }

  /** Writes one column's filter value and resets `page` to 1 — same pattern `onFilterTextChange` uses for the global filter. */
  protected onColumnFilterChange(field: string, value: unknown): void {
    if (this.isBusy()) return;
    this.columnFilters.update((filters) => ({ ...filters, [field]: value }));
    this.page.set(1);
    this.emitLazyLoad();
  }

  /** `<dg-pagination>`'s own `(pageChange)` handler — explicit instead of `[(page)]` two-way
   *  sugar so a page change can also trigger `emitLazyLoad()`; behaves identically to the plain
   *  `page.set(value)` the sugar used to do otherwise. */
  protected onPageChange(value: number): void {
    this.page.set(value);
    this.emitLazyLoad();
  }

  /** `<dg-pagination>`'s own `(pageSizeChange)` handler — same reasoning as `onPageChange`. */
  protected onPageSizeChange(value: number): void {
    this.pageSize.set(value);
    this.emitLazyLoad();
  }

  /**
   * Single emission point for `lazyLoad` — called from every one of Table's
   * OWN call sites that change page/pageSize/sort/filter state
   * (`onPageChange`, `onPageSizeChange`, `toggleSort`, `onFilterTextChange`,
   * `onColumnFilterChange`), the same way `toggleSort`/`onFilterTextChange`
   * already each own their own `page.set(1)` reset inline instead of a
   * shared `effect()`. No-op while `!lazy()`. Deliberately NOT triggered by
   * a consumer writing directly to `page`/`filterText`/`columnFilters` from
   * outside Table's own UI (e.g. calling `.set(...)` on the model
   * programmatically) — keeping Table effect-free, consistent with its
   * entire existing architecture, at the cost of that one gap (documented
   * in the README).
   */
  private emitLazyLoad(): void {
    if (!this.lazy()) return;
    this.lazyLoad.emit({
      page: this.currentPage(),
      pageSize: this.pageSize() ?? this.totalItemCount(),
      sort: this.sortState(),
      filterText: this.filterText(),
      columnFilters: this.columnFilters(),
    });
  }

  /** Builds the context handed to a column's `filterTemplate`. */
  protected columnFilterContext(
    column: DynamoTableColumn<TRow>,
  ): DynamoTableColumnFilterContext<TRow> {
    const value = this.columnFilters()[column.field];
    return {
      $implicit: value,
      value,
      setValue: (v) => this.onColumnFilterChange(column.field, v),
      column,
    };
  }

  /** String form of a column's current filter value, for the built-in text input's `[value]` binding. */
  protected columnFilterValue(field: string): string {
    const value = this.columnFilters()[field];
    return value === undefined || value === null ? '' : String(value);
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

  protected expandIconClasses(row: TRow): string {
    return cn(
      tableExpandIconStyles({ expanded: this.isRowExpanded(row) }),
      this.ptFor('expandIcon').class,
    );
  }

  protected isRowExpanded(row: TRow): boolean {
    return this.expandedKeys().has(this.selectionKey(row));
  }

  /** Stable id linking a row's chevron (`aria-controls`) to its detail cell. */
  protected detailId(pageIndex: number): string {
    return `${this.tableId}-detail-${this.absoluteIndex(pageIndex)}`;
  }

  /**
   * aria-label for the row-expansion toggle button. Routes `pageIndex`
   * through `absoluteIndex()` — exactly like `detailId`/`cellContext`/
   * `trackRow` already do — so page 2 of a paginated table announces
   * "Expand row 11", not "Expand row 1". A page-relative index silently
   * restarted from 1 on every page; that was a real screen-reader-facing
   * bug, not a cosmetic one.
   */
  protected expandButtonLabel(row: TRow, pageIndex: number): string {
    const verb = this.isRowExpanded(row) ? 'Collapse row ' : 'Expand row ';
    return verb + (this.absoluteIndex(pageIndex) + 1);
  }

  /** sr-only label for a row's selection checkbox — same `absoluteIndex()` routing fix as `expandButtonLabel`. */
  protected selectionLabel(pageIndex: number): string {
    return 'Select row ' + (this.absoluteIndex(pageIndex) + 1);
  }

  /**
   * `'single'` mode replaces the array with just this row when expanding
   * (accordion); `'multiple'` appends. Collapsing always just removes it.
   */
  protected toggleRowExpansion(row: TRow): void {
    if (this.isBusy()) return;
    const key = this.selectionKey(row);
    if (this.expandedKeys().has(key)) {
      this.expandedRows.update((rows) =>
        rows.filter((r) => this.selectionKey(r) !== key),
      );
      return;
    }
    this.expandedRows.update((rows) =>
      this.expandMode() === 'single' ? [row] : [...rows, row],
    );
  }

  protected bodyRowClasses(row: TRow): string {
    return cn(
      tableBodyRowStyles({ selected: this.isRowSelected(row) }),
      this.ptFor('bodyRow').class,
    );
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
    this.itemSelect.emit(row);
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
