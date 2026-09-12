import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoCheckIcon } from '@dynamong/icons';
import { cn } from '@dynamong/utils/class-merge';
import { findEnabledPicklistIndex } from './picklist-option-nav';
import {
  picklistButtonStyles,
  picklistMoveButtonColumnStyles,
  picklistOptionCheckboxStyles,
  picklistOptionStyles,
  picklistPanelHeaderStyles,
  picklistPanelListStyles,
  picklistPanelStyles,
  picklistPanelTitleStyles,
  picklistReorderButtonRowStyles,
  picklistRootStyles,
} from './picklist.styles';
import type {
  DynamoPicklistItemSelectEvent,
  DynamoPicklistPart,
  DynamoPicklistSide,
  DynamoPicklistSize,
  DynamoSelectOption,
} from './picklist.types';

@Component({
  selector: 'dg-picklist',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CdkDropList, CdkDropListGroup, CdkDrag, DynamoCheckIcon],
  templateUrl: './picklist.html',
})
export class DynamoPicklist<
  TValue = unknown,
> extends DynamoBaseComponent<DynamoPicklistPart> {
  /** Two-way bindable. */
  readonly source = model<DynamoSelectOption<TValue>[]>([]);
  /** Two-way bindable. */
  readonly target = model<DynamoSelectOption<TValue>[]>([]);
  /** Fires once per option a user directly toggles (check or uncheck), tagged with which panel it lives in — not from moving items between panels. */
  readonly itemSelect = output<DynamoPicklistItemSelectEvent<TValue>>();
  readonly size = input<DynamoPicklistSize>('md');
  readonly disabled = input(false);
  readonly sourceLabel = input('Available');
  readonly targetLabel = input('Selected');

  protected readonly sourceSelected = signal<Set<TValue>>(new Set());
  protected readonly targetSelected = signal<Set<TValue>>(new Set());
  protected readonly sourceActiveIndex = signal(-1);
  protected readonly targetActiveIndex = signal(-1);

  protected readonly canMoveSelectedRight = computed(
    () => this.sourceSelected().size > 0,
  );
  protected readonly canMoveSelectedLeft = computed(
    () => this.targetSelected().size > 0,
  );
  protected readonly canMoveAllRight = computed(() => this.source().length > 0);
  protected readonly canMoveAllLeft = computed(() => this.target().length > 0);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(picklistRootStyles, this.styleClass()),
  );
  protected readonly buttonClasses = picklistButtonStyles;
  protected readonly panelClasses = picklistPanelStyles;
  protected readonly panelHeaderClasses = picklistPanelHeaderStyles;
  protected readonly panelTitleClasses = picklistPanelTitleStyles;
  protected readonly panelListClasses = picklistPanelListStyles;
  protected readonly moveButtonColumnClasses = picklistMoveButtonColumnStyles;
  protected readonly reorderButtonRowClasses = picklistReorderButtonRowStyles;

  // --- selection ---

  protected isSelected(
    side: DynamoPicklistSide,
    option: DynamoSelectOption<TValue>,
  ): boolean {
    return (
      side === 'source' ? this.sourceSelected() : this.targetSelected()
    ).has(option.value);
  }

  protected toggleSelected(
    side: DynamoPicklistSide,
    option: DynamoSelectOption<TValue>,
  ): void {
    if (this.disabled() || option.disabled) {
      return;
    }
    const sig = side === 'source' ? this.sourceSelected : this.targetSelected;
    const next = new Set(sig());
    if (next.has(option.value)) {
      next.delete(option.value);
    } else {
      next.add(option.value);
    }
    sig.set(next);
    this.itemSelect.emit({ option, side });
  }

  // --- move buttons ---

  protected moveSelectedRight(): void {
    this.moveMatching(
      (o) => this.sourceSelected().has(o.value),
      'source',
      'target',
    );
    this.sourceSelected.set(new Set());
  }

  protected moveSelectedLeft(): void {
    this.moveMatching(
      (o) => this.targetSelected().has(o.value),
      'target',
      'source',
    );
    this.targetSelected.set(new Set());
  }

  protected moveAllRight(): void {
    this.moveMatching(() => true, 'source', 'target');
    this.sourceSelected.set(new Set());
  }

  protected moveAllLeft(): void {
    this.moveMatching(() => true, 'target', 'source');
    this.targetSelected.set(new Set());
  }

  /**
   * Moves every option matching `predicate` from `from` to the end of `to`,
   * preserving relative order in both resulting arrays. The bulk-move
   * buttons (moveAllRight/moveAllLeft) pass `() => true`, which
   * intentionally includes disabled options — `disabled` only blocks
   * per-item checkbox/drag interaction, never a bulk move.
   */
  private moveMatching(
    predicate: (o: DynamoSelectOption<TValue>) => boolean,
    from: DynamoPicklistSide,
    to: DynamoPicklistSide,
  ): void {
    if (this.disabled()) {
      return;
    }
    const fromModel = from === 'source' ? this.source : this.target;
    const toModel = to === 'source' ? this.source : this.target;
    const moving = fromModel().filter(predicate);
    if (moving.length === 0) {
      return;
    }
    fromModel.set(fromModel().filter((o) => !predicate(o)));
    toModel.set([...toModel(), ...moving]);
    (from === 'source' ? this.sourceActiveIndex : this.targetActiveIndex).set(
      -1,
    );
  }

  // --- drag & drop ---

  // Never relies on CDK's own in-place array mutation as the source of
  // truth for the model()s — moveItemInArray/transferArrayItem splice
  // arrays in place, and binding [cdkDropListData] straight to source()/
  // target() and trusting that mutation would silently break signal change
  // detection (same object reference, no new emission). Only
  // event.previousIndex/currentIndex/container identity are read from the
  // event; the arrays themselves are cloned, spliced, then explicitly
  // .set() onto the model()s.
  protected onDropped(
    event: CdkDragDrop<DynamoSelectOption<TValue>[]>,
    side: DynamoPicklistSide,
  ): void {
    if (this.disabled()) {
      return;
    }
    const ownModel = side === 'source' ? this.source : this.target;

    if (event.previousContainer === event.container) {
      const next = [...ownModel()];
      moveItemInArray(next, event.previousIndex, event.currentIndex);
      ownModel.set(next);
      return;
    }

    // Cross-panel drag: item moved FROM the other panel INTO this one.
    const otherModel = side === 'source' ? this.target : this.source;
    const otherNext = [...otherModel()];
    const ownNext = [...ownModel()];
    const [moved] = otherNext.splice(event.previousIndex, 1);
    if (!moved || moved.disabled) {
      return; // defensive: disabled rows are cdkDragDisabled, shouldn't reach here
    }
    ownNext.splice(event.currentIndex, 0, moved);
    otherModel.set(otherNext);
    ownModel.set(ownNext);

    // Discard stale selection state for the moved item on the side it left.
    const otherSelected =
      side === 'source' ? this.targetSelected : this.sourceSelected;
    if (otherSelected().has(moved.value)) {
      const next = new Set(otherSelected());
      next.delete(moved.value);
      otherSelected.set(next);
    }
  }

  // --- keyboard reorder (activeIndex-driven, always-visible buttons) ---

  protected canMoveUp(side: DynamoPicklistSide): boolean {
    const idx =
      side === 'source' ? this.sourceActiveIndex() : this.targetActiveIndex();
    return idx > 0;
  }

  protected canMoveDown(side: DynamoPicklistSide): boolean {
    const idx =
      side === 'source' ? this.sourceActiveIndex() : this.targetActiveIndex();
    const len = (side === 'source' ? this.source() : this.target()).length;
    return idx >= 0 && idx < len - 1;
  }

  protected reorder(side: DynamoPicklistSide, direction: -1 | 1): void {
    if (this.disabled()) {
      return;
    }
    const activeSig =
      side === 'source' ? this.sourceActiveIndex : this.targetActiveIndex;
    const listModel = side === 'source' ? this.source : this.target;
    const idx = activeSig();
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= listModel().length) {
      return;
    }
    const next = [...listModel()];
    moveItemInArray(next, idx, target);
    listModel.set(next);
    activeSig.set(target);
  }

  // --- keyboard nav within a panel, mirrors Listbox's onKeydown shape ---

  protected onPanelKeydown(
    event: KeyboardEvent,
    side: DynamoPicklistSide,
  ): void {
    if (this.disabled()) {
      return;
    }
    const options = side === 'source' ? this.source() : this.target();
    const activeSig =
      side === 'source' ? this.sourceActiveIndex : this.targetActiveIndex;

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = findEnabledPicklistIndex(options, activeSig(), 1);
        if (next !== null) {
          activeSig.set(next);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const next = findEnabledPicklistIndex(options, activeSig(), -1);
        if (next !== null) {
          activeSig.set(next);
        }
        break;
      }
      case 'Home':
        event.preventDefault();
        activeSig.set(findEnabledPicklistIndex(options, -1, 1) ?? -1);
        break;
      case 'End':
        event.preventDefault();
        activeSig.set(findEnabledPicklistIndex(options, 0, -1) ?? -1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = options[activeSig()];
        if (option) {
          this.toggleSelected(side, option);
        }
        break;
      }
      default:
        break;
    }
  }

  // --- styling helpers ---

  protected optionClasses(
    side: DynamoPicklistSide,
    option: DynamoSelectOption<TValue>,
    index: number,
  ): string {
    return picklistOptionStyles({
      active:
        index ===
        (side === 'source'
          ? this.sourceActiveIndex()
          : this.targetActiveIndex()),
      selected: this.isSelected(side, option),
      disabled: !!option.disabled,
    });
  }

  protected checkboxClasses(
    side: DynamoPicklistSide,
    option: DynamoSelectOption<TValue>,
  ): string {
    return picklistOptionCheckboxStyles({
      checked: this.isSelected(side, option),
    });
  }
}
