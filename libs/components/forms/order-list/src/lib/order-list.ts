import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDropList,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoCheckIcon } from '@dynamong/icons';
import { cn } from '@dynamong/utils/class-merge';
import { findEnabledOrderListIndex } from './order-list-nav';
import {
  orderListButtonStyles,
  orderListCheckboxStyles,
  orderListControlsStyles,
  orderListHeaderStyles,
  orderListListStyles,
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
  imports: [CdkDropList, CdkDrag, DynamoCheckIcon],
  templateUrl: './order-list.html',
})
export class DynamoOrderList<TValue = unknown> extends DynamoBaseComponent<DynamoOrderListPart> {
  /** Two-way bindable ordered list. */
  readonly value = model<DynamoSelectOption<TValue>[]>([]);
  readonly listLabel = input('Items');
  readonly size = input<DynamoOrderListSize>('md');
  readonly disabled = input(false);
  /** When true, rows carry a checkbox and click/Enter toggles multi-selection. */
  readonly selectable = input(false);
  /** Allow CDK drag reordering. */
  readonly dragdrop = input(true);
  /** Also render "move to top" / "move to bottom" buttons. */
  readonly moveTopBottom = input(true);

  protected readonly activeIndex = signal(-1);
  protected readonly selected = signal<Set<TValue>>(new Set());

  protected readonly canMoveUp = computed(
    () => !this.disabled() && this.activeIndex() > 0,
  );
  protected readonly canMoveDown = computed(() => {
    const idx = this.activeIndex();
    return !this.disabled() && idx >= 0 && idx < this.value().length - 1;
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(orderListRootStyles, this.styleClass()),
  );
  protected readonly headerClasses = orderListHeaderStyles;
  protected readonly titleClasses = orderListTitleStyles;
  protected readonly controlsClasses = orderListControlsStyles;
  protected readonly listClasses = orderListListStyles;
  protected readonly buttonClasses = orderListButtonStyles;

  protected optionClasses(
    option: DynamoSelectOption<TValue>,
    index: number,
  ): string {
    return orderListOptionStyles({
      active: index === this.activeIndex(),
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

  protected onRowClick(index: number): void {
    if (this.disabled()) return;
    this.activeIndex.set(index);
    if (!this.selectable()) return;
    const option = this.value()[index];
    if (!option || option.disabled) return;
    const next = new Set(this.selected());
    if (next.has(option.value)) next.delete(option.value);
    else next.add(option.value);
    this.selected.set(next);
  }

  // --- reordering (adapted from Picklist's `reorder`, minus the `side` param) ---

  protected reorder(direction: -1 | 1): void {
    if (this.disabled()) return;
    const idx = this.activeIndex();
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= this.value().length) return;
    const next = [...this.value()];
    moveItemInArray(next, idx, target);
    this.value.set(next);
    this.activeIndex.set(target);
  }

  protected moveTo(edge: 'top' | 'bottom'): void {
    if (this.disabled()) return;
    const idx = this.activeIndex();
    if (idx < 0) return;
    const target = edge === 'top' ? 0 : this.value().length - 1;
    if (target === idx) return;
    const next = [...this.value()];
    moveItemInArray(next, idx, target);
    this.value.set(next);
    this.activeIndex.set(target);
  }

  // Only reads `event.previousIndex`/`currentIndex` from CDK, never trusts
  // its in-place array mutation — same reasoning as `picklist.ts`'s
  // `onDropped` doc comment.
  protected onDropped(event: CdkDragDrop<DynamoSelectOption<TValue>[]>): void {
    if (this.disabled()) return;
    const next = [...this.value()];
    moveItemInArray(next, event.previousIndex, event.currentIndex);
    this.value.set(next);
    this.activeIndex.set(event.currentIndex);
  }

  // --- keyboard nav within the list, mirrors Picklist's `onPanelKeydown` ---

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const options = this.value();

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = findEnabledOrderListIndex(options, this.activeIndex(), 1);
        if (next !== null) this.activeIndex.set(next);
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const next = findEnabledOrderListIndex(options, this.activeIndex(), -1);
        if (next !== null) this.activeIndex.set(next);
        break;
      }
      case 'Home':
        event.preventDefault();
        this.activeIndex.set(findEnabledOrderListIndex(options, -1, 1) ?? -1);
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(findEnabledOrderListIndex(options, 0, -1) ?? -1);
        break;
      case 'Enter':
      case ' ': {
        if (!this.selectable()) return;
        event.preventDefault();
        this.onRowClick(this.activeIndex());
        break;
      }
      default:
        break;
    }
  }
}
