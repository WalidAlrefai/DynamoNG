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
  viewChild,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { FormsModule } from '@angular/forms';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import type { DynamoSelectOption } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoListboxBase } from './listbox-base.component';
import { buildListboxPositions } from './listbox-positioning';
import {
  filterSelectOptions,
  findEnabledIndex,
  flattenGroupedOptions,
  groupSelectOptions,
} from './select-option-filter';
import {
  selectChevronStyles,
  selectClearButtonStyles,
  selectFilterFieldWrapperStyles,
  selectFilterIconStyles,
  selectFilterInputExtraClasses,
  selectFilterWrapperStyles,
  selectGroupHeadingStyles,
  selectListboxStyles,
  selectNoResultsStyles,
  selectOptionStyles,
  selectPanelWrapperStyles,
  selectPanelWrapperVirtualStyles,
  selectTriggerButtonStyles,
  selectTriggerStyles,
} from './select.styles';
import type {
  DynamoSelectPart,
  DynamoSelectPosition,
  DynamoSelectSize,
} from './select.types';

/** One rendered row inside the panel: either a group heading (`role="presentation"`) or a selectable option. `index` is the option's position within `visibleOptions()` — the flat, post-filter/post-group list keyboard nav and `aria-activedescendant` operate over. */
type DynamoSelectRenderItem<TValue> =
  | { kind: 'heading'; label: string }
  | { kind: 'option'; option: DynamoSelectOption<TValue>; index: number };

@Component({
  selector: 'dg-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FormsModule, DynamoInputText, DynamoVirtualScroll],
  templateUrl: './select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoSelect),
      multi: true,
    },
  ],
})
export class DynamoSelect<TValue = unknown>
  extends DynamoListboxBase<DynamoSelectPart>
  implements ControlValueAccessor
{
  readonly options = input.required<DynamoSelectOption<TValue>[]>();
  readonly placeholder = input('Select an option');
  readonly size = input<DynamoSelectSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `writeValue`/`setDisabledState`. */
  readonly value = model<TValue | null>(null);
  readonly disabled = model(false);
  readonly invalid = input(false);
  /** Shows an "x" button in the trigger, clearing the value without opening the panel, once a value is selected. */
  readonly clearable = input(false);
  readonly position = input<DynamoSelectPosition>('bottom-start');
  /** Opt-in filter box rendered above the option list — mirrors `DynamoTable`'s `filterable`. */
  readonly filterable = input(false);
  readonly filterText = model('');
  readonly filterPlaceholder = input('Search...');
  /** Shown when `options()` is non-empty but the filter matched nothing — distinct from a genuinely empty `options()`, which renders no message. */
  readonly noResultsMessage = input('No matching options');
  /**
   * Opt-in — renders the option list through `@dynamong/virtual-scroll`
   * instead of a plain `@for`, for large option lists. Only takes effect
   * for the ungrouped case (see `isVirtualized`): `@dynamong/virtual-scroll`
   * is fixed-row-height only, and a grouped list's heading rows are a
   * different height than option rows — mixing the two would misalign
   * CDK's scroll-position math. A grouped/filterable-with-groups Select
   * silently falls back to today's full, non-virtualized render — no
   * visual regression, just no perf win for that specific shape.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matched to `selectOptionStyles`' actual rendered height (`px-4 py-2 text-sm`). */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `selectPanelWrapperStyles`' own `max-h-60` (240px) so the virtualized panel is roughly the same size as today's CSS-scrolled one. */
  readonly virtualScrollHeight = input(240);

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly virtualScrollRef = viewChild(DynamoVirtualScroll);

  protected readonly triggerId = this.idGenerator.next('dg-select-trigger');
  protected readonly listboxId = this.idGenerator.next('dg-select-listbox');
  protected readonly filterInputId = this.idGenerator.next('dg-select-filter');

  private onChangeFn: (value: TValue | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly filteredOptions = computed(() =>
    filterSelectOptions(this.options(), this.filterText()),
  );
  protected readonly groupedOptions = computed(() =>
    groupSelectOptions(this.filteredOptions()),
  );
  /** Flat, post-filter/post-group list — what keyboard nav and `activeIndex` operate over. */
  protected readonly visibleOptions = computed(() =>
    flattenGroupedOptions(this.groupedOptions()),
  );
  protected readonly renderItems = computed<DynamoSelectRenderItem<TValue>[]>(
    () => {
      const items: DynamoSelectRenderItem<TValue>[] = [];
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
    },
  );
  protected readonly showNoResults = computed(
    () =>
      this.visibleOptions().length === 0 &&
      this.filterText().trim().length > 0 &&
      this.options().length > 0,
  );

  /** True only for the ungrouped case — see `virtualScroll`'s own doc comment for why grouped lists can't be virtualized in v1. `groupedOptions()` always yields at least one bucket (a single `group: null` one for ungrouped input), so "ungrouped" is exactly "at most one group". */
  protected readonly isVirtualized = computed(
    () => this.virtualScroll() && this.groupedOptions().length <= 1,
  );

  protected readonly selectedOption = computed(() => {
    const value = this.value();
    return this.options().find((option) => option.value === value) ?? null;
  });

  protected readonly selectedLabel = computed(
    () => this.selectedOption()?.label ?? this.placeholder(),
  );

  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          selectTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly triggerButtonClasses = selectTriggerButtonStyles;
  protected readonly chevronClasses = computed(() =>
    selectChevronStyles({ open: this.isOpen() }),
  );
  protected readonly clearButtonClasses = selectClearButtonStyles;
  /** Switches to `selectPanelWrapperVirtualStyles` while virtualized — see that constant's own doc comment for the "double scrollbar" bug this avoids. */
  protected readonly panelWrapperClasses = computed(() =>
    this.isVirtualized() ? selectPanelWrapperVirtualStyles : selectPanelWrapperStyles,
  );
  protected readonly listboxClasses = selectListboxStyles;
  protected readonly filterWrapperClasses = selectFilterWrapperStyles;
  protected readonly filterFieldWrapperClasses = selectFilterFieldWrapperStyles;
  protected readonly filterIconClasses = selectFilterIconStyles;
  protected readonly filterInputExtraClasses = selectFilterInputExtraClasses;
  protected readonly groupHeadingClasses = selectGroupHeadingStyles;
  protected readonly noResultsClasses = selectNoResultsStyles;

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

  protected entryKey(item: DynamoSelectRenderItem<TValue>): string {
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

  protected isSelected(option: DynamoSelectOption<TValue>): boolean {
    return option.value === this.value();
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
    const options = this.visibleOptions();
    const selectedIndex = options.findIndex(
      (option) => option.value === this.value(),
    );
    this.activeIndex.set(
      selectedIndex >= 0
        ? selectedIndex
        : (findEnabledIndex(options, -1, 1) ?? -1),
    );
    this.scrollActiveIntoView();
  }

  protected close(): void {
    this.isOpen.set(false);
    this.filterText.set('');
    this.onTouchedFn();
  }

  protected selectOption(option: DynamoSelectOption<TValue>): void {
    if (option.disabled) return;
    this.value.set(option.value);
    this.onChangeFn(option.value);
    this.close();
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    if (this.disabled()) return;
    this.value.set(null);
    this.onChangeFn(null);
  }

  protected onFilterInputChange(value: string): void {
    this.filterText.set(value);
    this.activeIndex.set(findEnabledIndex(this.visibleOptions(), -1, 1) ?? -1);
    this.scrollActiveIntoView();
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
        if (active) this.selectOption(active);
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
          this.scrollActiveIntoView();
        }
        break;
      case 'End':
        if (this.isOpen()) {
          event.preventDefault();
          this.activeIndex.set(
            findEnabledIndex(this.visibleOptions(), 0, -1) ?? -1,
          );
          this.scrollActiveIntoView();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.isOpen()) {
          const active = this.visibleOptions()[this.activeIndex()];
          if (active) this.selectOption(active);
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
    if (next !== null) {
      this.activeIndex.set(next);
      this.scrollActiveIntoView();
    }
  }

  /**
   * Scrolls the virtualized viewport so `activeIndex` is actually rendered
   * — load-bearing, not a UX nicety: once virtualized, an off-screen
   * "active" option may not exist in the DOM at all, and
   * `aria-activedescendant` (`activeOptionId`) would point at a nonexistent
   * id without this. Called explicitly only from keyboard-driven moves
   * (openList/moveActive/Home/End/filter-reset) — deliberately NOT from
   * the `(mouseenter)="activeIndex.set(i)"` hover handlers in select.html.
   * CDK's own `scrollToIndex` is an unconditional absolute scroll (always
   * jumps so the target index lands at the very top — confirmed by reading
   * `FixedSizeVirtualScrollStrategy.scrollToIndex` directly, it's not a
   * "scroll into view only if needed" call), so calling it on every
   * `activeIndex` change — including hover, which only ever targets an
   * already-visible row — was the bug: the panel visibly jumped on every
   * hover. A prior version of this method was a constructor `effect()`
   * watching `activeIndex()` directly, which had exactly this problem: an
   * effect can't distinguish *why* the signal changed, and that's exactly
   * what matters here.
   */
  private scrollActiveIntoView(): void {
    if (!this.isVirtualized()) return;
    const index = this.activeIndex();
    if (index >= 0) this.virtualScrollRef()?.scrollToIndex(index);
  }

  writeValue(value: TValue | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: TValue | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
