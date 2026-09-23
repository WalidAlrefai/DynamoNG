import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { FormsModule } from '@angular/forms';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoCheckIcon } from '@dynamong/icons';
import { DynamoInputText } from '@dynamong/input-text';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { filterOrderListOptions } from './order-list-option-filter';
import { findEnabledOrderListIndex } from './order-list-nav';
import {
  orderListButtonStyles,
  orderListCheckboxStyles,
  orderListControlsStyles,
  orderListFilterFieldWrapperStyles,
  orderListFilterIconStyles,
  orderListFilterInputExtraClasses,
  orderListFilterWrapperStyles,
  orderListHeaderStyles,
  orderListListStyles,
  orderListListVirtualStyles,
  orderListNoResultsStyles,
  orderListOptionStyles,
  orderListRootStyles,
  orderListTitleStyles,
} from './order-list.styles';
import type {
  DynamoOrderListPart,
  DynamoOrderListSize,
  DynamoSelectOption,
} from './order-list.types';

/**
 * A single reorderable list — drag-drop, ▲/▼ (and optional ⤒/⤓) buttons, and
 * keyboard navigation. The one-panel half of `DynamoPicklist`; the reorder /
 * drop / keyboard mechanics are adapted from it verbatim.
 */
@Component({
  selector: 'dg-order-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CdkDropList,
    CdkDrag,
    DynamoCheckIcon,
    DynamoVirtualScroll,
    DynamoInputText,
    FormsModule,
  ],
  templateUrl: './order-list.html',
})
export class DynamoOrderList<
  TValue = unknown,
> extends DynamoBaseComponent<DynamoOrderListPart> {
  /** Two-way bindable ordered list. */
  readonly value = model<DynamoSelectOption<TValue>[]>([]);
  /** Fires once per row a user directly toggles when `selectable` is on — not from reordering (drag, ▲/▼, top/bottom). */
  readonly itemSelect = output<DynamoSelectOption<TValue>>();
  readonly listLabel = input('Items');
  readonly size = input<DynamoOrderListSize>('md');
  readonly disabled = input(false);
  /** HTML `readonly` semantics: rows stay visible/focusable/navigable, but
   *  reordering (drag, ▲/▼, ⤒/⤓) and selection are both blocked. Unlike
   *  `disabled`, doesn't dim the list or remove it from the tab order. */
  readonly readOnly = input(false);
  /** When true, rows carry a checkbox and click/Enter toggles multi-selection. */
  readonly selectable = input(false);
  /** Allow CDK drag reordering. */
  readonly dragdrop = input(true);
  /** Also render "move to top" / "move to bottom" buttons. */
  readonly moveTopBottom = input(true);
  /** Shows a search box above the list that narrows rows by label. */
  readonly filterable = input(false);
  /** Two-way bindable filter query. */
  readonly filterText = model('');
  readonly filterPlaceholder = input('Search...');
  /** Shown when `value()` is non-empty but the filter matched nothing — distinct from a genuinely empty `value()`, which renders no message. */
  readonly noResultsMessage = input('No matching items');
  /**
   * Opt-in — renders the option list through `@dynamong/virtual-scroll`
   * instead of a plain `@for`, for large `value` arrays. Drag-and-drop pays
   * the price: while this is on, CDK drag-and-drop is disabled. CdkDropList
   * computes `previousIndex`/`currentIndex` from its own mounted
   * `<li cdkDrag>` elements, which is only a subset of the full array once
   * virtualized — not the full-array positions `onDropped()` assumes.
   * Rather than risk a silently-wrong reorder, drag is disabled outright;
   * the always-visible ▲/▼/⤒/⤓ buttons and keyboard reorder are unaffected
   * (both operate on the full array directly, never on CDK's mounted-DOM
   * index tracking). Drag is disabled for the identical reason while
   * `filterable`'s filter box has an active (non-blank) query — see
   * `isFilterActive`.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matches `orderListOptionStyles`' own rendered height. */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `orderListRootStyles`' own `max-h-96` (384px) minus header/controls chrome, close enough to keep a virtualized list roughly the same size as the non-virtualized, CSS-scrolled one. */
  readonly virtualScrollHeight = input(320);

  /**
   * Value-keyed, matching `selected`'s own existing convention — NOT
   * index-keyed, because rendering is no longer 1:1 with `value()` once
   * `filterable`/`virtualScroll` are in play. `activeIndex` below is
   * derived from it purely so `reorder`/`moveTo`/`canMoveUp`/`canMoveDown`
   * keep reading a full-array position exactly as before.
   */
  protected readonly activeValue = signal<TValue | null>(null);
  protected readonly selected = signal<Set<TValue>>(new Set());

  private readonly virtualScrollRef =
    viewChild<DynamoVirtualScroll<DynamoSelectOption<TValue>>>(
      'virtualScrollRef',
    );

  /** Full-array position of the active item, or -1. Nothing writes to this directly — see `activeValue`. */
  protected readonly activeIndex = computed(() => {
    const active = this.activeValue();
    return active === null
      ? -1
      : this.value().findIndex((option) => option.value === active);
  });

  protected readonly filteredItems = computed(() =>
    filterOrderListOptions(this.value(), this.filterText()),
  );

  // `cdkDropListData` needs a mutable array type (CDK's own typing), unlike
  // `filteredItems()` (deliberately `readonly`, matching
  // `filterOrderListOptions`'s pure-function signature) — a fresh shallow
  // copy is harmless since `onDropped` never trusts CDK's in-place
  // mutation anyway, only reads `previousIndex`/`currentIndex`.
  protected readonly cdkDropListItems = computed(() => [
    ...this.filteredItems(),
  ]);

  /** Position of the active item within the currently-rendered (filtered) list — what keyboard nav and virtual-scroll's `scrollToIndex` operate on. */
  protected readonly activeFilteredIndex = computed(() => {
    const active = this.activeValue();
    return active === null
      ? -1
      : this.filteredItems().findIndex((option) => option.value === active);
  });

  protected readonly isFilterActive = computed(
    () => this.filterable() && this.filterText().trim().length > 0,
  );

  protected readonly showNoResults = computed(
    () =>
      this.filterable() &&
      this.value().length > 0 &&
      this.filteredItems().length === 0,
  );

  protected readonly isVirtualized = computed(() => this.virtualScroll());

  /** Gates the `cdkDropList` off entirely while filtering is active or virtualized — see `virtualScroll`'s own doc comment for why. Folded together with the existing `disabled()`/`readOnly()`/`dragdrop()` gating into one boolean for `[cdkDropListDisabled]`. */
  protected readonly dropListDisabled = computed(
    () =>
      this.disabled() ||
      this.readOnly() ||
      !this.dragdrop() ||
      this.isFilterActive() ||
      this.isVirtualized(),
  );

  protected readonly canMoveUp = computed(
    () => !this.disabled() && !this.readOnly() && this.activeIndex() > 0,
  );
  protected readonly canMoveDown = computed(() => {
    const idx = this.activeIndex();
    return (
      !this.disabled() &&
      !this.readOnly() &&
      idx >= 0 &&
      idx < this.value().length - 1
    );
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(orderListRootStyles, this.styleClass()),
  );
  protected readonly headerClasses = orderListHeaderStyles;
  protected readonly titleClasses = orderListTitleStyles;
  protected readonly controlsClasses = orderListControlsStyles;
  protected readonly listClasses = computed(() =>
    this.isVirtualized() ? orderListListVirtualStyles : orderListListStyles,
  );
  protected readonly buttonClasses = orderListButtonStyles;
  protected readonly filterWrapperClasses = orderListFilterWrapperStyles;
  protected readonly filterFieldWrapperClasses =
    orderListFilterFieldWrapperStyles;
  protected readonly filterIconClasses = orderListFilterIconStyles;
  protected readonly filterInputExtraClasses = orderListFilterInputExtraClasses;
  protected readonly noResultsClasses = orderListNoResultsStyles;

  /** `dg-virtual-scroll`'s own `trackBy` — mirrors the `@for`'s `track option.value` so item identity stays stable across the virtualized/non-virtualized branches. */
  protected readonly virtualTrackBy = (
    option: DynamoSelectOption<TValue>,
  ): unknown => option.value;

  protected optionClasses(option: DynamoSelectOption<TValue>): string {
    return orderListOptionStyles({
      active: option.value === this.activeValue(),
      selected: this.isSelected(option),
      disabled: !!option.disabled,
    });
  }

  protected checkboxClasses(option: DynamoSelectOption<TValue>): string {
    return orderListCheckboxStyles({ checked: this.isSelected(option) });
  }

  protected isSelected(option: DynamoSelectOption<TValue>): boolean {
    return this.selected().has(option.value);
  }

  protected onRowClick(option: DynamoSelectOption<TValue>): void {
    if (this.disabled()) return;
    this.activeValue.set(option.value);
    if (!this.selectable() || this.readOnly()) return;
    if (option.disabled) return;
    const next = new Set(this.selected());
    if (next.has(option.value)) next.delete(option.value);
    else next.add(option.value);
    this.selected.set(next);
    this.itemSelect.emit(option);
  }

  // --- reordering (adapted from Picklist's `reorder`, minus the `side` param) ---

  protected reorder(direction: -1 | 1): void {
    if (this.disabled() || this.readOnly()) return;
    const idx = this.activeIndex();
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= this.value().length) return;
    const next = [...this.value()];
    moveItemInArray(next, idx, target);
    this.value.set(next);
    // activeValue is unchanged — the moved item is the one that was already
    // active; activeIndex (derived) picks up its new position automatically.
    this.scrollActiveIntoView();
  }

  protected moveTo(edge: 'top' | 'bottom'): void {
    if (this.disabled() || this.readOnly()) return;
    const idx = this.activeIndex();
    if (idx < 0) return;
    const target = edge === 'top' ? 0 : this.value().length - 1;
    if (target === idx) return;
    const next = [...this.value()];
    moveItemInArray(next, idx, target);
    this.value.set(next);
    this.scrollActiveIntoView();
  }

  // Only reads `event.previousIndex`/`currentIndex` from CDK, never trusts
  // its in-place array mutation — same reasoning as `picklist.ts`'s
  // `onDropped` doc comment.
  protected onDropped(event: CdkDragDrop<DynamoSelectOption<TValue>[]>): void {
    if (this.disabled() || this.readOnly()) return;
    const next = [...this.value()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.value.set(next);
    // Unlike reorder()/moveTo(), the dragged item may not have already been
    // active — make the just-dropped item active, matching the original
    // index-based `activeIndex.set(event.currentIndex)` behavior.
    this.activeValue.set(next[event.currentIndex]?.value ?? null);
  }

  // --- keyboard nav within the list, mirrors Picklist's `onPanelKeydown` ---
  // Navigates `filteredItems()`, never the raw `value()` — safe
  // unconditionally, since `filteredItems() === value()` (same reference)
  // whenever the filter is blank, so no separate branch is needed.

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const options = this.filteredItems();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home': {
        event.preventDefault();
        const next = findEnabledOrderListIndex(options, -1, 1);
        this.activeValue.set(
          next !== null ? (options[next]?.value ?? null) : null,
        );
        this.scrollActiveIntoView();
        break;
      }
      case 'End': {
        event.preventDefault();
        const next = findEnabledOrderListIndex(options, 0, -1);
        this.activeValue.set(
          next !== null ? (options[next]?.value ?? null) : null,
        );
        this.scrollActiveIntoView();
        break;
      }
      case 'Enter':
      case ' ': {
        if (!this.selectable()) return;
        event.preventDefault();
        const option = options[this.activeFilteredIndex()];
        if (option) this.onRowClick(option);
        break;
      }
      default:
        break;
    }
  }

  // --- filter box, mirrors Listbox's `onFilterInputChange`/`onFilterKeydown` ---

  protected onFilterInputChange(value: string): void {
    this.filterText.set(value);
    // filteredItems() is read AFTER the set above, so it already reflects
    // the new query (signals recompute synchronously on read).
    const next = findEnabledOrderListIndex(this.filteredItems(), -1, 1);
    this.activeValue.set(
      next !== null ? (this.filteredItems()[next]?.value ?? null) : null,
    );
  }

  protected onFilterKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.filterText.set('');
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      default:
        break;
    }
  }

  private moveActive(delta: 1 | -1): void {
    const options = this.filteredItems();
    const next = findEnabledOrderListIndex(
      options,
      this.activeFilteredIndex(),
      delta,
    );
    if (next !== null) {
      this.activeValue.set(options[next]?.value ?? null);
      this.scrollActiveIntoView();
    }
  }

  // Called only from keyboard nav and reorder/moveTo — deliberately NOT
  // from `(mouseenter)`, matching Picklist's own precedent (CDK's
  // scrollToIndex is an unconditional jump-to-top, so wiring it to hover
  // would jerk the list on every mouseenter).
  private scrollActiveIntoView(): void {
    if (!this.isVirtualized()) return;
    const index = this.activeFilteredIndex();
    if (index >= 0) this.virtualScrollRef()?.scrollToIndex(index);
  }
}
