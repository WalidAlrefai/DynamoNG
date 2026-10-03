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
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import { DynamoCheckIcon } from '@dynamong/icons';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
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
  selectClearButtonStyles,
  selectFilterInputExtraClasses,
  selectGroupHeadingStyles,
  selectListboxStyles,
  selectNoResultsStyles,
  selectOptionStyles,
  selectPanelWrapperStyles,
  selectPanelWrapperVirtualStyles,
} from '@dynamong/select';
import type {
  DynamoSelectOption,
  DynamoSelectPosition,
  DynamoSelectSize,
  DynamoSelectVariant,
} from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
} from '@dynamong/utils/typeahead';
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
  imports: [
    FormsModule,
    NgTemplateOutlet,
    DynamoInputText,
    DynamoCheckIcon,
    DynamoCheckbox,
    DynamoSpinner,
    DynamoVirtualScroll,
    DynamoPassThroughDirective,
  ],
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
  readonly variant = input<DynamoSelectVariant>('outlined');
  /** Fills the width of its container. Defaults `true` to match every existing consumer's assumption of a full-width trigger; set `false` for PrimeNG-style intrinsic sizing. */
  readonly fluid = input(true);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the trigger with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Two-way bindable array of selected values; also driven by Angular forms via `writeValue`/`setDisabledState`. */
  readonly value = model<TValue[]>([]);
  /** Fires once per option a user directly toggles (check or uncheck) with the full option object — not from `selectAll()`/`clearAll()`/the header checkbox. */
  readonly itemSelect = output<DynamoSelectOption<TValue>>();
  readonly disabled = model(false);
  /** Renders a small spinner in the trigger and makes the component fully
   *  non-interactive, like `disabled`. Never emits back — the consumer
   *  drives it. */
  readonly loading = input(false);
  readonly invalid = input(false);
  /** HTML `readonly` semantics: the trigger/panel stay browsable but
   *  selections can't be added, removed, or cleared. Unlike `disabled`,
   *  doesn't dim the trigger or remove it from the tab order. */
  readonly readOnly = input(false);
  /** Shows a trigger-level clear (×) button once at least one option is selected, clearing the whole selection at once — mirrors `DynamoSelect`'s `clearable`. */
  readonly clearable = input(false);
  readonly position = input<DynamoSelectPosition>('bottom-start');
  readonly filterable = input(false);
  readonly filterText = model('');
  readonly filterPlaceholder = input('Search...');
  readonly noResultsMessage = input('No matching options');
  /**
   * Opt-in — renders the option list through `@dynamong/virtual-scroll`
   * instead of a plain `@for`, for large option lists. Only takes effect
   * for the ungrouped case (see `isVirtualized`): `@dynamong/virtual-scroll`
   * is fixed-row-height only, and a grouped list's heading rows are a
   * different height than option rows — mixing the two would misalign
   * CDK's scroll-position math. A grouped/filterable-with-groups MultiSelect
   * silently falls back to today's full, non-virtualized render — no
   * visual regression, just no perf win for that specific shape.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matched to `selectOptionStyles`' actual rendered height (`px-4 py-2 text-sm`; the `h-4` check indicator is shorter than the text line box, so it doesn't grow the row). */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `selectPanelWrapperStyles`' own `max-h-60` (240px) so the virtualized panel is roughly the same size as today's CSS-scrolled one. */
  readonly virtualScrollHeight = input(240);
  /** Caps the number of selections; remaining unselected options become disabled once reached. */
  readonly maxSelected = input<number | undefined>(undefined);
  readonly maxSelectedMessage = input('Maximum selections reached');
  readonly showSelectAll = input(true);
  /** Accessible name for the header select-all/clear-all checkbox (it's icon-only on screen). */
  readonly selectAllLabel = input('Select all');
  /** Collapses the trigger's tag list to the first N plus a "+N more" summary once exceeded. Unset shows every tag. */
  readonly maxVisibleTags = input<number | undefined>(undefined);
  readonly overflowLabelFn = input<(count: number) => string>(
    (count) => `+${count} more`,
  );
  /** Emitted when a single tag's remove button is clicked (in addition to `value` updating). */
  readonly tagRemoved = output<TValue>();
  /** Forwarded 1:1 from `@dynamong/virtual-scroll`'s own output — the index of the first item considered "in view" after each scroll, while `virtualScroll` is on. Drive your own lazy-load fetch from this as the index nears `options().length`. */
  readonly scrolledIndexChange = output<number>();
  /** Renders a free-text `<input>` alongside the tag pills — typing and committing (Enter, comma, or
   *  blur) adds a new tag to `value`. Text matching an existing option's label selects that option
   *  properly (via `toggleOption()`, respecting `disabled`/`maxSelected`, emitting `itemSelect`) —
   *  unless it's already selected, in which case re-typing its label is a no-op (never unselects it).
   *  Anything else is appended as a raw string (only meaningful when `TValue` is/accepts `string`),
   *  deduplicated against existing values. Does NOT close the panel on commit — unlike `DynamoSelect`'s
   *  `editable`, adding one tag is expected to be followed by adding more. Mutually exclusive with
   *  `filterable` in v1 (documented, not runtime-guarded). */
  readonly editableTags = input(false);
  protected readonly chipDraft = signal('');

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly virtualScrollRef = viewChild(DynamoVirtualScroll);

  /** Optional, independently-usable projected templates — each falls back to today's plain-text rendering when omitted, mirroring `DynamoSelect`'s own `contentChild(TemplateRef)` idiom. */
  protected readonly optionTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoSelectOption<TValue> }>>(
      'optionTemplate',
    );
  protected readonly groupTemplate =
    contentChild<TemplateRef<{ $implicit: string }>>('groupTemplate');
  /** Replaces only a tag pill's label content — the pill wrapper and its real, independently-focusable remove `<button>` stay exactly as today, outside the templated region (a11y/`stopPropagation` wiring never shifts onto the consumer). Does not apply to the "+N more" overflow pill, which is a count summary, not a per-option render. */
  protected readonly tagTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoSelectOption<TValue> }>>(
      'tagTemplate',
    );

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
  /** Only consulted on the trigger's own keydown, and only while `!filterable()` — a filterable panel moves focus into its own filter input, which has its own keydown handler and never reaches this buffer. */
  private readonly typeahead = createTypeaheadBuffer();

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
  /** True only for the ungrouped case — see `virtualScroll`'s own doc comment for why grouped lists can't be virtualized in v1. `groupedOptions()` always yields at least one bucket (a single `group: null` one for ungrouped input), so "ungrouped" is exactly "at most one group". */
  protected readonly isVirtualized = computed(
    () => this.virtualScroll() && this.groupedOptions().length <= 1,
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

  /** Selection-order, not `options()` order — a stable, intuitive tag list as the user picks things.
   *  While `editableTags()` is on, a committed raw-string tag has no matching `options()` entry — a
   *  fallback option is synthesized from the value itself so it still renders as a pill, instead of
   *  silently vanishing from the tag row despite being correctly present in `value()`. */
  protected readonly selectedOptions = computed(() => {
    const options = this.options();
    const synthesize = this.editableTags();
    return this.value()
      .map((v) => {
        const match = options.find((option) => option.value === v);
        if (match) return match;
        return synthesize
          ? ({ label: String(v), value: v } as DynamoSelectOption<TValue>)
          : undefined;
      })
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
  /** Lists the labels collapsed into the "+N more" pill, for screen readers — the pill's own visible text ("+3 more") carries no information about which options those are. */
  protected readonly overflowTagAriaLabel = computed(() => {
    const hidden = this.selectedOptions().slice(this.visibleTags().length);
    return hidden.length === 0
      ? null
      : `Also selected: ${hidden.map((o) => o.label).join(', ')}`;
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

  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  /** `root` and `trigger` both target the same single trigger `<div>` — unlike `DynamoSelect`, there's no separate inner button to split them onto (see the class-level doc comment on `multiSelectPlaceholderStyles`). */
  protected readonly triggerPt = computed(() => ({
    ...this.ptFor('root'),
    ...this.ptFor('trigger'),
  }));
  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          multiSelectTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
            variant: this.variant(),
            fluid: this.fluid(),
            disabled: this.isDisabled(),
          }),
          this.ptFor('root').class,
          this.ptFor('trigger').class,
          this.styleClass(),
        ),
  );
  protected readonly placeholderClasses = multiSelectPlaceholderStyles;
  protected readonly tagClasses = computed(() =>
    cn(multiSelectTagStyles, this.ptFor('tag').class),
  );
  protected readonly overflowTagClasses = computed(() =>
    cn(multiSelectOverflowTagStyles, this.ptFor('overflowTag').class),
  );
  protected readonly tagRemoveButtonClasses = computed(() =>
    cn(multiSelectTagRemoveButtonStyles, this.ptFor('tagRemove').class),
  );
  protected readonly clearButtonClasses = computed(() =>
    cn(selectClearButtonStyles, this.ptFor('clear').class),
  );
  protected readonly chevronClasses = computed(() =>
    cn(
      selectChevronStyles({ open: this.isOpen() }),
      this.ptFor('chevron').class,
    ),
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
  protected readonly headerRowClasses = multiSelectHeaderRowStyles;
  /** Merges the `selectAll`/`clearAll` pt parts onto the one tri-state header `<dg-checkbox>` — `selectAll` wins key collisions since it's the control's primary identity. */
  protected readonly headerCheckboxPt = computed(() => ({
    ...this.ptFor('clearAll'),
    ...this.ptFor('selectAll'),
  }));
  protected readonly headerCheckboxClasses = computed(() =>
    cn(this.ptFor('clearAll').class, this.ptFor('selectAll').class),
  );
  protected readonly filterFieldWrapperClasses = selectFilterFieldWrapperStyles;
  protected readonly filterIconClasses = selectFilterIconStyles;
  protected readonly filterInputExtraClasses = selectFilterInputExtraClasses;
  protected readonly groupHeadingClasses = computed(() =>
    cn(selectGroupHeadingStyles, this.ptFor('group').class),
  );
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

    // Re-validates `activeIndex` if `effectiveOptions()` changes while the panel stays open — e.g.
    // an async-loaded list swap, a disabled flag flipping, or `maxSelected` capacity synthetically
    // disabling the currently-active row via `effectiveOptions()` itself (no external data change
    // needed — just the user's own selections reaching the cap). Without this, a stale index could
    // point past the end of the new list or at a since-disabled row, and `aria-activedescendant`
    // would reference a nonexistent/mismatched option id. Self-terminating: the write only fires
    // when the read-back condition is currently true.
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
    return cn(
      selectOptionStyles({
        active: index === this.activeIndex(),
        selected: this.isSelected(option),
        disabled: !!option.disabled,
      }),
      this.ptFor('option').class,
    );
  }

  protected checkboxClasses(option: DynamoSelectOption<TValue>): string {
    return cn(
      multiSelectOptionCheckboxStyles({ checked: this.isSelected(option) }),
      this.ptFor('optionCheckbox').class,
    );
  }

  protected isSelected(option: DynamoSelectOption<TValue>): boolean {
    return this.value().includes(option.value);
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
    this.activeIndex.set(findEnabledIndex(this.visibleOptions(), -1, 1) ?? -1);
    this.scrollActiveIntoView();
  }

  protected close(): void {
    this.isOpen.set(false);
    this.filterText.set('');
    this.typeahead.clear();
    this.onTouchedFn();
  }

  protected toggleOption(option: DynamoSelectOption<TValue>): void {
    if (option.disabled || this.readOnly()) return;
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
    this.itemSelect.emit(option);
  }

  protected removeTag(value: TValue, event: Event): void {
    event.stopPropagation();
    if (this.isDisabled() || this.readOnly()) return;
    const next = this.value().filter((v) => v !== value);
    this.value.set(next);
    this.onChangeFn(next);
    this.tagRemoved.emit(value);
  }

  protected clearSelection(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisabled() || this.readOnly()) return;
    this.value.set([]);
    this.onChangeFn([]);
    this.chipDraft.set('');
  }

  /** Mirrors `removeTag`'s `stopPropagation` — clicking directly into the chip input must never also
   *  toggle the panel shut via the wrapper `<div>`'s own `(click)="toggle()"`. Unlike that handler,
   *  this only ever opens: once the panel is open, clicking back into the field to keep typing must
   *  not unexpectedly close it. */
  protected onChipInputClick(event: MouseEvent): void {
    event.stopPropagation();
    if (!this.isOpen()) this.openList();
  }

  protected onChipInputInput(event: Event): void {
    this.chipDraft.set((event.target as HTMLInputElement).value);
  }

  protected onChipInputBlur(): void {
    this.commitChipDraft();
    this.onTouchedFn();
  }

  /**
   * Commits the chip input's typed draft as a new tag. Text matching an existing option's label
   * (exact) toggles that option properly via `toggleOption()` — respecting `disabled`/`maxSelected`,
   * emitting `itemSelect` — unless it's already selected, in which case this is a no-op (re-typing an
   * already-selected tag's label must never remove it). Anything else is appended to `value` directly
   * as a raw string (only meaningful when `TValue` is/accepts `string`), deduplicated against existing
   * values and capped by `maxSelected` the same way `toggleOption` is. Does NOT close the panel —
   * unlike `DynamoSelect`'s single-value commit, adding one tag is expected to be followed by adding
   * more. No-op on an empty draft.
   */
  private commitChipDraft(): void {
    const trimmed = this.chipDraft().trim();
    this.chipDraft.set('');
    if (trimmed === '') return;
    const matched = this.options().find((option) => option.label === trimmed);
    if (matched) {
      if (!this.isSelected(matched)) this.toggleOption(matched);
      return;
    }
    const next = trimmed as unknown as TValue;
    if (this.value().includes(next)) return;
    const capacity = this.maxSelected();
    if (capacity !== undefined && this.value().length >= capacity) return;
    const updated = [...this.value(), next];
    this.value.set(updated);
    this.onChangeFn(updated);
  }

  protected override matchOverlayWidthToTrigger(): boolean {
    return this.editableTags();
  }

  protected selectAll(): void {
    if (this.isDisabled() || this.readOnly()) return;
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
    if (this.isDisabled() || this.readOnly()) return;
    const visibleValues = new Set(
      this.filteredOptions().map((option) => option.value),
    );
    const next = this.value().filter((v) => !visibleValues.has(v));
    this.value.set(next);
    this.onChangeFn(next);
  }

  /** Wired to the header checkbox's `(checkedChange)` — one tri-state control standing in for separate select-all/clear-all buttons. */
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
        // A real textbox once `editableTags()` — Space must type a literal
        // space (e.g. a multi-word free-text tag), not act as a toggle key.
        // Same posture `DynamoSelect`'s `editable` already takes.
        if (this.editableTags()) return;
        event.preventDefault();
        if (this.isOpen()) {
          const active = this.visibleOptions()[this.activeIndex()];
          if (active) this.toggleOption(active);
        } else {
          this.openList();
        }
        break;
      case ',':
        if (this.editableTags()) {
          event.preventDefault();
          this.commitChipDraft();
        }
        break;
      case 'Enter':
        event.preventDefault();
        // Enter while a real option is actively highlighted (arrow-keyed, or
        // auto-highlighted on open) still toggles it, even in chip-input
        // mode — only falls through to committing the typed draft when
        // nothing's highlighted (closed trigger, or open with no active row).
        if (
          this.editableTags() &&
          this.chipDraft().trim() !== '' &&
          (!this.isOpen() || this.activeIndex() < 0)
        ) {
          this.commitChipDraft();
          break;
        }
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
      default:
        this.handleTypeahead(event);
        break;
    }
  }

  /**
   * Typeahead only applies while `!filterable()` — a filterable panel moves
   * focus into a separate filter `<input>` on open (its own keydown
   * handler), so this branch never fires then. On match, only moves
   * `activeIndex` — deliberately does NOT call `toggleOption`, since
   * silently checking a box from incidental typing would be a surprising
   * model mutation; unlike Select's single value, there's no natural
   * "this is obviously what I meant" commit here.
   */
  private handleTypeahead(event: KeyboardEvent): void {
    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.filterable() ||
      this.editableTags()
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
   * the `(mouseenter)="activeIndex.set(i)"` hover handlers in the template.
   * CDK's own `scrollToIndex` is an unconditional absolute scroll (always
   * jumps so the target index lands at the very top — it's not a "scroll
   * into view only if needed" call), so calling it on every `activeIndex`
   * change — including hover, which only ever targets an already-visible
   * row — visibly jumps the panel on every hover.
   */
  private scrollActiveIntoView(): void {
    if (!this.isVirtualized()) return;
    const index = this.activeIndex();
    if (index >= 0) this.virtualScrollRef()?.scrollToIndex(index);
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
