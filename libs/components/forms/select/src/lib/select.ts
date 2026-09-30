import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  TemplateRef,
  computed,
  contentChild,
  effect,
  forwardRef,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { FormsModule } from '@angular/forms';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoCheckIcon } from '@dynamong/icons';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import type { DynamoSelectOption } from '@dynamong/core/api';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
} from '@dynamong/utils/typeahead';
import { DynamoListboxBase } from './listbox-base.component';
import { buildListboxPositions } from './listbox-positioning';
import {
  filterSelectOptions,
  findEnabledIndex,
  flattenGroupedOptions,
  groupSelectOptions,
} from './select-option-filter';
import {
  selectCheckboxIndicatorStyles,
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
  selectTriggerIconButtonStyles,
  selectTriggerStyles,
} from './select.styles';
import type {
  DynamoSelectPart,
  DynamoSelectPosition,
  DynamoSelectSelectedIndicator,
  DynamoSelectSize,
  DynamoSelectVariant,
} from './select.types';

/** One rendered row inside the panel: either a group heading (`role="presentation"`) or a selectable option. `index` is the option's position within `visibleOptions()` — the flat, post-filter/post-group list keyboard nav and `aria-activedescendant` operate over. */
type DynamoSelectRenderItem<TValue> =
  | { kind: 'heading'; label: string }
  | { kind: 'option'; option: DynamoSelectOption<TValue>; index: number };

@Component({
  selector: 'dg-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    NgTemplateOutlet,
    DynamoInputText,
    DynamoCheckIcon,
    DynamoSpinner,
    DynamoVirtualScroll,
    DynamoPassThroughDirective,
  ],
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
  readonly variant = input<DynamoSelectVariant>('outlined');
  /** Fills the width of its container. Defaults `true` to match every existing consumer's
   *  assumption of a full-width trigger; set `false` for PrimeNG-style intrinsic sizing. */
  readonly fluid = input(true);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the trigger with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `writeValue`/`setDisabledState`. */
  readonly value = model<TValue | null>(null);
  /** Fires once per direct user selection (click or keyboard Enter/Space on an option) with the full option object — not from `writeValue`/programmatic `value` changes. */
  readonly itemSelect = output<DynamoSelectOption<TValue>>();
  readonly disabled = model(false);
  /** Renders a small spinner in the trigger and makes the component fully
   *  non-interactive, like `disabled`. Never emits back — the consumer
   *  drives it. */
  readonly loading = input(false);
  readonly invalid = input(false);
  /** HTML `readonly` semantics: the trigger/panel stay browsable but the
   *  value can't be changed or cleared. Unlike `disabled`, doesn't dim the
   *  trigger or remove it from the tab order. */
  readonly readOnly = input(false);
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
  readonly selectedIndicator = input<DynamoSelectSelectedIndicator>('none');
  /** Converts the trigger from a plain `<button>` into a real typable `<input>` — typing commits an
   *  arbitrary value directly (not required to match an option), matching PrimeNG's actual "Editable"
   *  Select semantics (distinct from `filterable`, which narrows options but still requires picking
   *  one). Mutually exclusive with `filterable` in v1 (documented, not runtime-guarded) — typing in
   *  the trigger never also filters the panel. Only meaningful when `TValue` is/accepts `string`,
   *  since a committed free-text value is always a raw string. */
  readonly editable = input(false);
  /** Forwarded 1:1 from `@dynamong/virtual-scroll`'s own `scrolledIndexChange` — the index of the
   *  first item considered "in view" after each scroll. A consumer can use this to drive its own
   *  lazy-load fetch as the index nears `options().length`. Only meaningful while `isVirtualized()`. */
  readonly scrolledIndexChange = output<number>();

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly virtualScrollRef = viewChild(DynamoVirtualScroll);

  /** Optional per-option custom rendering — falls back to plain `{{ option.label }}` text when unset. */
  protected readonly optionTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoSelectOption<TValue> }>>(
      'optionTemplate',
    );
  /** Optional custom group-heading rendering — falls back to plain `{{ label }}` text when unset. */
  protected readonly groupTemplate =
    contentChild<TemplateRef<{ $implicit: string }>>('groupTemplate');
  /** Optional custom rendering for the trigger's own selected-value display — falls back to
   *  `selectedLabel()` (plain text) when unset. Receives `null` while nothing is selected. */
  protected readonly selectedTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoSelectOption<TValue> | null }>>(
      'selectedTemplate',
    );

  protected readonly triggerId = this.idGenerator.next('dg-select-trigger');
  protected readonly listboxId = this.idGenerator.next('dg-select-listbox');
  protected readonly filterInputId = this.idGenerator.next('dg-select-filter');

  private onChangeFn: (value: TValue | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };
  /** Only consulted on the trigger's own keydown, and only while `!filterable()` — a filterable panel moves focus into its own filter input, which has its own keydown handler and never reaches this buffer. */
  private readonly typeahead = createTypeaheadBuffer();
  /** Non-null while the user has typed something not yet committed — only meaningful while
   *  `editable()`. Mirrors DatePicker's identical `typedDraft` idiom. */
  protected readonly editableDraft = signal<string | null>(null);

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

  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          selectTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
            variant: this.variant(),
            fluid: this.fluid(),
            disabled: this.isDisabled(),
          }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly triggerButtonClasses = computed(() =>
    cn(selectTriggerButtonStyles, this.ptFor('trigger').class),
  );
  /** `editable` mode's dedicated open/close icon button — see
   *  `selectTriggerIconButtonStyles`'s own doc comment for why it exists. */
  protected readonly triggerIconButtonClasses = selectTriggerIconButtonStyles;
  /** Only meaningful while `editable()`. Falls back to the selected option's label, or `''` when
   *  nothing's selected (never `placeholder()` itself — that's shown via the native `placeholder`
   *  attribute instead, same "draft-or-derived" idiom as DatePicker's `inputText`). */
  protected readonly editableDisplayText = computed(
    () => this.editableDraft() ?? this.selectedOption()?.label ?? '',
  );
  protected readonly chevronClasses = computed(() =>
    cn(
      selectChevronStyles({ open: this.isOpen() }),
      this.ptFor('chevron').class,
    ),
  );
  protected readonly clearButtonClasses = computed(() =>
    cn(selectClearButtonStyles, this.ptFor('clear').class),
  );
  /** Switches to `selectPanelWrapperVirtualStyles` while virtualized — see that constant's own doc comment for the "double scrollbar" bug this avoids. */
  protected readonly panelWrapperClasses = computed(() =>
    this.isVirtualized()
      ? selectPanelWrapperVirtualStyles
      : selectPanelWrapperStyles,
  );
  protected readonly listboxClasses = computed(() =>
    cn(selectListboxStyles, this.ptFor('listbox').class),
  );
  protected readonly filterWrapperClasses = selectFilterWrapperStyles;
  protected readonly filterFieldWrapperClasses = selectFilterFieldWrapperStyles;
  protected readonly filterIconClasses = selectFilterIconStyles;
  protected readonly filterInputExtraClasses = selectFilterInputExtraClasses;
  protected readonly groupHeadingClasses = computed(() =>
    cn(selectGroupHeadingStyles, this.ptFor('group').class),
  );
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

    // Re-validates `activeIndex` if `options()` changes while the panel stays
    // open (e.g. an async-loaded list swap, or a disabled flag flipping) —
    // without this, a stale index could point past the end of the new list
    // or at a since-disabled row (or stay stuck at -1 even after previously
    // all-disabled options become enabled), and `aria-activedescendant`
    // would reference a nonexistent/mismatched option id. Self-terminating:
    // the write only fires when `recovered` actually differs from the
    // current value, so a no-op pass never re-triggers itself.
    effect(() => {
      if (!this.isOpen()) return;
      const options = this.visibleOptions();
      const current = this.activeIndex();
      const isInvalid =
        current < 0 || current >= options.length || options[current]?.disabled;
      if (!isInvalid) return;
      const recovered = findEnabledIndex(options, -1, 1) ?? -1;
      if (recovered !== current) this.activeIndex.set(recovered);
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  /** Matches the panel's width to the trigger's while `editable()` — same reasoning
   *  `@dynamong/autocomplete` already uses this base-class hook for: a typed-into trigger expects a
   *  width-matched panel. Non-editable mode keeps the base class's fixed-width default. */
  protected override matchOverlayWidthToTrigger(): boolean {
    return this.editable();
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
    return cn(
      selectOptionStyles({
        active: index === this.activeIndex(),
        selected: this.isSelected(option),
        disabled: !!option.disabled,
      }),
      this.ptFor('option').class,
    );
  }

  protected isSelected(option: DynamoSelectOption<TValue>): boolean {
    return option.value === this.value();
  }

  /** Only meaningful while `selectedIndicator() === 'checkbox'`. */
  protected checkboxIndicatorClasses(
    option: DynamoSelectOption<TValue>,
  ): string {
    return selectCheckboxIndicatorStyles({ checked: this.isSelected(option) });
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.openList();
    }
  }

  protected openList(): void {
    if (this.isDisabled()) return;
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
    this.typeahead.clear();
    this.onTouchedFn();
  }

  protected selectOption(option: DynamoSelectOption<TValue>): void {
    if (option.disabled || this.readOnly()) return;
    this.value.set(option.value);
    this.onChangeFn(option.value);
    // Clears any stale typed draft — a direct mouse-click selection (which
    // never goes through `commitEditableDraft`) must still make
    // `editableDisplayText` re-derive from the newly-selected option, not
    // keep showing whatever partial text was typed before the click.
    this.editableDraft.set(null);
    this.itemSelect.emit(option);
    this.close();
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisabled() || this.readOnly()) return;
    this.value.set(null);
    this.onChangeFn(null);
    this.editableDraft.set(null);
  }

  /** Clicking the typable input always ensures the panel is open — never closes it (unlike the icon
   *  button's `toggle()`) — so clicking back into the field to fix a typo, once it's already open,
   *  doesn't unexpectedly snap the panel shut. Mirrors DatePicker's identical `onTriggerClick`. */
  protected onTriggerClick(): void {
    if (!this.isOpen()) this.openList();
  }

  protected onEditableInput(event: Event): void {
    this.editableDraft.set((event.target as HTMLInputElement).value);
  }

  protected onEditableBlur(): void {
    this.commitEditableDraft();
    this.onTouchedFn();
  }

  /**
   * Commits the typed draft: an empty draft clears the value (same as `clearValue`); text matching an
   * existing option's label selects that option properly (a real typed `value`, not a raw string);
   * anything else commits the raw string directly as `value` — the "editable" free-text behavior
   * PrimeNG's own Select has. The `as unknown as TValue` cast is intentionally local to this one
   * method: the public `value` contract stays `TValue | null` throughout, but a committed free-text
   * value is always a raw string, so `editable` is only meaningful when `TValue` is/accepts `string`
   * (documented in the README). No-op if nothing's been typed (`editableDraft() === null`) — e.g. a
   * pristine trigger receiving Enter/blur falls through to whatever that action normally does instead.
   */
  private commitEditableDraft(): void {
    const draft = this.editableDraft();
    if (draft === null) return;
    const trimmed = draft.trim();
    this.editableDraft.set(null);
    if (trimmed === '') {
      if (this.value() !== null) {
        this.value.set(null);
        this.onChangeFn(null);
      }
      return;
    }
    const matched = this.options().find((option) => option.label === trimmed);
    if (matched) {
      this.selectOption(matched);
    } else {
      const next = trimmed as unknown as TValue;
      this.value.set(next);
      this.onChangeFn(next);
      this.close();
    }
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
      case ' ':
        // A real textbox once `editable()` — Space must type a literal
        // space (e.g. a multi-word free-text value), not act as a select
        // key. Intentional behavior difference from the non-editable
        // button trigger, same posture DatePicker's Phase 1 already took.
        if (this.editable()) return;
        event.preventDefault();
        if (this.isOpen()) {
          const active = this.visibleOptions()[this.activeIndex()];
          if (active) this.selectOption(active);
        } else {
          this.openList();
        }
        break;
      case 'Enter':
        event.preventDefault();
        // Enter while a real option is actively highlighted (the user
        // arrow-keyed into the list) still selects it, even in editable
        // mode — only falls through to committing the typed draft when
        // nothing's highlighted (closed trigger, or open with no active row).
        if (
          this.editable() &&
          this.editableDraft() !== null &&
          (!this.isOpen() || this.activeIndex() < 0)
        ) {
          this.commitEditableDraft();
          break;
        }
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
      default:
        this.handleTypeahead(event);
        break;
    }
  }

  /**
   * Typeahead only applies to the closed-trigger/non-filterable,
   * non-editable path — once `filterable()` is true, opening the panel
   * moves focus into the separate filter `<input>` (its own
   * `onFilterKeydown` handler); once `editable()` is true, typing goes
   * straight to the real trigger `<input>`'s own value via
   * `onEditableInput` instead. Either way this branch simply never fires.
   */
  private handleTypeahead(event: KeyboardEvent): void {
    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.filterable() ||
      this.editable()
    ) {
      return;
    }
    const buffer = this.typeahead.append(event.key);
    const query = resolveTypeaheadQuery(buffer);
    const match = findTypeaheadMatch(
      this.visibleOptions(),
      this.activeIndex(),
      query,
    );
    if (match === null) return;
    event.preventDefault();
    if (!this.isOpen()) this.isOpen.set(true);
    this.activeIndex.set(match);
    this.scrollActiveIntoView();
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
