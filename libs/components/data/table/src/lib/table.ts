import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { sortRows, type DynamoTableSortDirection } from './table.sort';
import {
  tableBodyCellStyles,
  tableBodyRowStyles,
  tableEmptyCellStyles,
  tableHeaderCellStyles,
  tableHeaderRowStyles,
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
   * nodes.
   */
  readonly trackBy = input<((row: TRow, index: number) => unknown) | undefined>(
    undefined,
  );

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

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(tableWrapperStyles, this.styleClass()),
  );
  protected readonly tableClasses = tableStyles;
  protected readonly headerRowClasses = tableHeaderRowStyles;
  protected readonly sortButtonClasses = tableSortButtonStyles;
  protected readonly bodyRowClasses = tableBodyRowStyles;
  protected readonly emptyCellClasses = tableEmptyCellStyles;

  protected readonly headerCellClasses = computed(() =>
    tableHeaderCellStyles({ size: this.size() }),
  );
  protected readonly bodyCellClasses = computed(() =>
    tableBodyCellStyles({ size: this.size() }),
  );

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
   * sorted column.
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
  }

  protected cellValue(row: TRow, column: DynamoTableColumn<TRow>): unknown {
    return column.cell
      ? column.cell(row)
      : (row as Record<string, unknown>)[column.field];
  }

  protected trackRow(row: TRow, index: number): unknown {
    const fn = this.trackBy();
    return fn ? fn(row, index) : row;
  }
}
