import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  effect,
  forwardRef,
  input,
  model,
  output,
  viewChild,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { FormsModule } from '@angular/forms';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoCheckIcon } from '@dynamong/icons';
import { DynamoInputText } from '@dynamong/input-text';
import {
  DynamoListboxBase,
  buildListboxPositions,
  filterSelectOptions,
  findEnabledIndex,
  flattenGroupedOptions,
  groupSelectOptions,
  selectChevronStyles,
  selectFilterFieldWrapperStyles,
  selectFilterIconStyles,
  selectFilterInputExtraClasses,
  selectGroupHeadingStyles,
  selectListboxStyles,
  selectNoResultsStyles,
  selectOptionStyles,
  selectPanelWrapperStyles,
} from '@dynamong/select';
import type {
  DynamoSelectOption,
  DynamoSelectPosition,
  DynamoSelectSize,
} from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import {
  multiSelectHeaderRowStyles,
  multiSelectMaxSelectedMessageStyles,
  multiSelectOptionCheckboxStyles,
  multiSelectOverflowTagStyles,
  multiSelectPlaceholderStyles,
  multiSelectTagRemoveButtonStyles,
  multiSelectTagStyles,
  multiSelectTriggerStyles,
} from './multi-select.styles';
import type { DynamoMultiSelectPart } from './multi-select.types';

/** One rendered row inside the panel — see `DynamoSelectRenderItem` (`@dynamong/select`) for the identical concept in single-select. */
type DynamoMultiSelectRenderItem<TValue> =
  | { kind: 'heading'; label: string }
  | { kind: 'option'; option: DynamoSelectOption<TValue>; index: number };

@Component({
  selector: 'dg-multi-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DynamoInputText, DynamoCheckIcon, DynamoCheckbox],
  templateUrl: './multi-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoMultiSelect),
      multi: true,
    },
  ],
})
export class DynamoMultiSelect<TValue = unknown>
  extends DynamoListboxBase<DynamoMultiSelectPart>
  implements ControlValueAccessor
{
  readonly options = input.required<DynamoSelectOption<TValue>[]>();
  readonly placeholder = input('Select options');
  readonly size = input<DynamoSelectSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable array of selected values; also driven by Angular forms via `writeValue`/`setDisabledState`. */
  readonly value = model<TValue[]>([]);
  readonly disabled = model(false);
  readonly invalid = input(false);
  readonly position = input<DynamoSelectPosition>('bottom-start');
  readonly filterable = input(false);
  readonly filterText = model('');
  readonly filterPlaceholder = input('Search...');
  readonly noResultsMessage = input('No matching options');
  /** Caps the number of selections; remaining unselected options become disabled once reached. */
  readonly maxSelected = input<number | undefined>(undefined);
  readonly maxSelectedMessage = input('Maximum selections reached');
  readonly showSelectAll = input(true);
  /** Accessible name for the header select-all/clear-all checkbox (it's icon-only on screen, matching PrimeNG). */
  readonly selectAllLabel = input('Select all');
  /** Collapses the trigger's tag list to the first N plus a "+N more" summary once exceeded. Unset shows every tag. */
  readonly maxVisibleTags = input<number | undefined>(undefined);
  readonly overflowLabelFn = input<(count: number) => string>(
    (count) => `+${count} more`,
  );
  /** Emitted when a single tag's remove button is clicked (in addition to `value` updating). */
  readonly tagRemoved = output<TValue>();

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');

  protected readonly triggerId = this.idGenerator.next(
    'dg-multi-select-trigger',
  );
  protected readonly listboxId = this.idGenerator.next(
    'dg-multi-select-listbox',
  );

  private onChangeFn: (value: TValue[]) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly filteredOptions = computed(() =>
    filterSelectOptions(this.options(), this.filterText()),
  );
  /** `filteredOptions()` with unselected options synthetically disabled once `maxSelected()` is reached — never mutates `options()`. */
  protected readonly effectiveOptions = computed(() => {
    const capacity = this.maxSelected();
    const filtered = this.filteredOptions();
    if (capacity === undefined || this.value().length < capacity) {
      return filtered;
    }
    return filtered.map((option) =>
      option.disabled || this.isSelected(option)
        ? option
        : { ...option, disabled: true },
    );
  });
  protected readonly groupedOptions = computed(() =>
    groupSelectOptions(this.effectiveOptions()),
  );
  protected readonly visibleOptions = computed(() =>
    flattenGroupedOptions(this.groupedOptions()),
  );
  protected readonly renderItems = computed<
    DynamoMultiSelectRenderItem<TValue>[]
  >(() => {
    const items: DynamoMultiSelectRenderItem<TValue>[] = [];
    let index = 0;
    for (const group of this.groupedOptions()) {
      if (group.group !== null) {
        items.push({ kind: 'heading', label: group.group });
      }
      for (const option of group.options) {
        items.push({ kind: 'option', option, index: index++ });
      }
    }
    return items;
  });
  protected readonly showNoResults = computed(
    () =>
      this.visibleOptions().length === 0 &&
      this.filterText().trim().length > 0 &&
      this.options().length > 0,
  );
  protected readonly isCapped = computed(() => {
    const capacity = this.maxSelected();
    return capacity !== undefined && this.value().length >= capacity;
  });

  /** Selection-order, not `options()` order — a stable, intuitive tag list as the user picks things. */
  protected readonly selectedOptions = computed(() => {
    const options = this.options();
    return this.value()
      .map((v) => options.find((option) => option.value === v))
      .filter(
        (option): option is DynamoSelectOption<TValue> => option !== undefined,
      );
  });
  protected readonly visibleTags = computed(() => {
    const max = this.maxVisibleTags();
    const selected = this.selectedOptions();
    return max === undefined ? selected : selected.slice(0, max);
  });
  protected readonly overflowCount = computed(() => {
    const max = this.maxVisibleTags();
    if (max === undefined) return 0;
    return Math.max(0, this.selectedOptions().length - max);
  });

  protected readonly selectAllState = computed(() => {
    const enabled = this.filteredOptions().filter((option) => !option.disabled);
    if (enabled.length === 0) return { checked: false, indeterminate: false };
    const selectedCount = enabled.filter((option) =>
      this.isSelected(option),
    ).length;
    return {
      checked: selectedCount === enabled.length,
      indeterminate: selectedCount > 0 && selectedCount < enabled.length,
    };
  });

  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          multiSelectTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly placeholderClasses = multiSelectPlaceholderStyles;
  protected readonly tagClasses = multiSelectTagStyles;
  protected readonly overflowTagClasses = multiSelectOverflowTagStyles;
  protected readonly tagRemoveButtonClasses = multiSelectTagRemoveButtonStyles;
  protected readonly chevronClasses = computed(() =>
    selectChevronStyles({ open: this.isOpen() }),
  );
  protected readonly panelWrapperClasses = selectPanelWrapperStyles;
  protected readonly listboxClasses = selectListboxStyles;
  protected readonly headerRowClasses = multiSelectHeaderRowStyles;
  protected readonly filterFieldWrapperClasses = selectFilterFieldWrapperStyles;
  protected readonly filterIconClasses = selectFilterIconStyles;
  protected readonly filterInputExtraClasses = selectFilterInputExtraClasses;
  protected readonly groupHeadingClasses = selectGroupHeadingStyles;
  protected readonly noResultsClasses = selectNoResultsStyles;
  protected readonly maxSelectedMessageClasses =
    multiSelectMaxSelectedMessageStyles;

  constructor() {
    super();

    effect(() => {
      if (this.isOpen()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  protected triggerElRef(): ElementRef<HTMLElement> {
    return this.triggerEl();
  }

  protected panelTemplateRef(): TemplateRef<unknown> {
    return this.panelTemplate();
  }

  protected overlayPositions(): ConnectedPosition[] {
    return buildListboxPositions(this.position());
  }

  protected entryKey(item: DynamoMultiSelectRenderItem<TValue>): string {
    return item.kind === 'heading'
      ? `heading:${item.label}`
      : `option:${String(item.option.value)}`;
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected optionClasses(
    option: DynamoSelectOption<TValue>,
    index: number,
  ): string {
    return selectOptionStyles({
      active: index === this.activeIndex(),
      selected: this.isSelected(option),
      disabled: !!option.disabled,
    });
  }

  protected checkboxClasses(option: DynamoSelectOption<TValue>): string {
    return multiSelectOptionCheckboxStyles({
      checked: this.isSelected(option),
    });
  }

  protected isSelected(option: DynamoSelectOption<TValue>): boolean {
    return this.value().includes(option.value);
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.openList();
    }
  }

  protected openList(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    this.activeIndex.set(findEnabledIndex(this.visibleOptions(), -1, 1) ?? -1);
  }

  protected close(): void {
    this.isOpen.set(false);
    this.filterText.set('');
    this.onTouchedFn();
  }

  protected toggleOption(option: DynamoSelectOption<TValue>): void {
    if (option.disabled) return;
    const current = this.value();
    const isSelected = current.includes(option.value);
    let next: TValue[];
    if (isSelected) {
      next = current.filter((v) => v !== option.value);
    } else {
      const capacity = this.maxSelected();
      if (capacity !== undefined && current.length >= capacity) return;
      next = [...current, option.value];
    }
    this.value.set(next);
    this.onChangeFn(next);
  }

  protected removeTag(value: TValue, event: Event): void {
    event.stopPropagation();
    if (this.disabled()) return;
    const next = this.value().filter((v) => v !== value);
    this.value.set(next);
    this.onChangeFn(next);
    this.tagRemoved.emit(value);
  }

  protected selectAll(): void {
    if (this.disabled()) return;
    const current = this.value();
    const currentSet = new Set(current);
    let candidates = this.filteredOptions().filter(
      (option) => !option.disabled && !currentSet.has(option.value),
    );
    const capacity = this.maxSelected();
    if (capacity !== undefined) {
      const room = Math.max(0, capacity - current.length);
      candidates = candidates.slice(0, room);
    }
    if (candidates.length === 0) return;
    const next = [...current, ...candidates.map((option) => option.value)];
    this.value.set(next);
    this.onChangeFn(next);
  }

  protected clearAll(): void {
    if (this.disabled()) return;
    const visibleValues = new Set(
      this.filteredOptions().map((option) => option.value),
    );
    const next = this.value().filter((v) => !visibleValues.has(v));
    this.value.set(next);
    this.onChangeFn(next);
  }

  /** Wired to the header checkbox's `(checkedChange)` — one tri-state control standing in for separate select-all/clear-all buttons, matching PrimeNG's MultiSelect. */
  protected onSelectAllToggle(checked: boolean): void {
    if (checked) {
      this.selectAll();
    } else {
      this.clearAll();
    }
  }

  protected onFilterInputChange(value: string): void {
    this.filterText.set(value);
    this.activeIndex.set(findEnabledIndex(this.visibleOptions(), -1, 1) ?? -1);
  }

  protected onFilterKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Enter': {
        event.preventDefault();
        const active = this.visibleOptions()[this.activeIndex()];
        if (active) this.toggleOption(active);
        break;
      }
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveActive(1);
        } else {
          this.openList();
        }
        break;
      case 'ArrowUp':
        event.preventDefault();
        if (this.isOpen()) {
          this.moveActive(-1);
        } else {
          this.openList();
        }
        break;
      case 'Home':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(
            findEnabledIndex(this.visibleOptions(), -1, 1) ?? -1,
          );
        }
        break;
      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(
            findEnabledIndex(this.visibleOptions(), 0, -1) ?? -1,
          );
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen()) {
          const active = this.visibleOptions()[this.activeIndex()];
          if (active) this.toggleOption(active);
        } else {
          this.openList();
        }
        break;
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  private moveActive(delta: number): void {
    const next = findEnabledIndex(
      this.visibleOptions(),
      this.activeIndex(),
      delta,
    );
    if (next !== null) this.activeIndex.set(next);
  }

  writeValue(value: TValue[] | null): void {
    this.value.set(value ?? []);
  }

  registerOnChange(fn: (value: TValue[]) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
