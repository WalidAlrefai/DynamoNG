import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import type { DynamoSelectOption } from '@dynamong/core/api';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoSelect } from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import {
  buildPaginationRange,
  type DynamoPaginationRangeItem,
} from './pagination-range';
import {
  paginationControlsStyles,
  paginationEllipsisStyles,
  paginationNavButtonExtraClasses,
  paginationPageButtonExtraClasses,
  paginationPageSizeSelectStyles,
  paginationStyles,
  paginationSummaryStyles,
} from './pagination.styles';
import type {
  DynamoPaginationPart,
  DynamoPaginationSize,
} from './pagination.types';

@Component({
  selector: 'dg-pagination',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton, DynamoSelect],
  templateUrl: './pagination.html',
})
export class DynamoPagination extends DynamoBaseComponent<DynamoPaginationPart> {
  readonly totalItems = input.required<number>();
  /**
   * Two-way bindable, 1-indexed — mirrors `DynamoTable`'s own `page` model
   * so the two compose naturally when bound to the same signal. Like
   * Table's `page`, the *read* is clamped by `currentPage` below; `page()`
   * itself is only ever written by explicit interaction (`goToPage` and
   * its callers), never by a computed.
   */
  readonly page = model(1);
  /** Two-way bindable — the rows-per-page `<dg-select>` writes here via `onPageSizeChange`. */
  readonly pageSize = model(10);
  readonly pageSizeOptions = input<number[]>([10, 25, 50, 100]);
  readonly showPageSizeSelector = input(true);
  /** Soft target for how many page-number buttons show before collapsing to an ellipsis — see `buildPaginationRange`. */
  readonly maxVisiblePages = input(5);
  readonly size = input<DynamoPaginationSize>('md');
  readonly disabled = input(false);
  readonly ariaLabel = input('Pagination');

  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalItems() / this.pageSize())),
  );

  protected readonly currentPage = computed(() =>
    Math.min(Math.max(1, this.page()), this.pageCount()),
  );

  protected readonly rangeItems = computed<DynamoPaginationRangeItem[]>(() =>
    buildPaginationRange(
      this.currentPage(),
      this.pageCount(),
      this.maxVisiblePages(),
    ),
  );

  protected readonly pageSizeSelectOptions = computed<
    DynamoSelectOption<number>[]
  >(() =>
    this.pageSizeOptions().map((size) => ({
      label: `${size} / page`,
      value: size,
    })),
  );

  /** `aria-live="polite"` in the template — mirrors `DynamoTable`'s own page-indicator announcement pattern. */
  protected readonly summaryText = computed(() => {
    const total = this.totalItems();
    if (total === 0) return 'No results';
    const size = this.pageSize();
    const start = (this.currentPage() - 1) * size + 1;
    const end = Math.min(total, this.currentPage() * size);
    return `Showing ${start}-${end} of ${total}`;
  });

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(paginationStyles({ size: this.size() }), this.styleClass()),
  );
  protected readonly summaryClasses = paginationSummaryStyles;
  protected readonly controlsClasses = paginationControlsStyles;
  protected readonly pageSizeSelectClasses = paginationPageSizeSelectStyles;

  protected readonly navButtonExtraClasses = computed(() =>
    paginationNavButtonExtraClasses({ size: this.size() }),
  );

  protected readonly ellipsisClasses = computed(() =>
    paginationEllipsisStyles({ size: this.size() }),
  );

  protected pageButtonExtraClasses(active: boolean): string {
    return paginationPageButtonExtraClasses({ size: this.size(), active });
  }

  protected trackRangeItem(
    index: number,
    item: DynamoPaginationRangeItem,
  ): string {
    return item === 'ellipsis' ? `ellipsis-${index}` : `page-${item}`;
  }

  protected goToPage(page: number): void {
    if (this.disabled()) return;
    this.page.set(Math.min(Math.max(1, page), this.pageCount()));
  }

  protected goToPreviousPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  protected goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }

  /**
   * Changing rows-per-page also resets to page 1 — the same technique
   * `DynamoTable`'s own `onFilterInput`/`toggleSort` use for their
   * page-reset, avoiding an `effect()`. `size` is `number | null` because
   * it comes straight off `DynamoSelect`'s `valueChange`; `null` only
   * happens if a future `clearable` usage clears the field, which this
   * internal usage never enables, but the type is still nullable.
   */
  protected onPageSizeChange(size: number | null): void {
    if (size == null || this.disabled()) return;
    this.pageSize.set(size);
    this.page.set(1);
  }
}
