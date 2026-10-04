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
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import {
  DynamoListboxBase,
  buildListboxPositions,
  filterSelectOptions,
  findEnabledIndex,
  flattenGroupedOptions,
  groupSelectOptions,
  selectGroupHeadingStyles,
  selectListboxStyles,
  selectNoResultsStyles,
  selectOptionStyles,
  selectPanelWrapperStyles,
  selectPanelWrapperVirtualStyles,
} from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import {
  autocompleteClearButtonStyles,
  autocompleteFieldStyles,
  autocompleteFieldWrapperStyles,
  autocompleteLoadingIndicatorStyles,
} from './autocomplete.styles';
import type {
  DynamoAutocompletePart,
  DynamoSelectOption,
  DynamoSelectPosition,
  DynamoSelectSize,
} from './autocomplete.types';

/** One rendered row inside the panel: either a group heading (`role="presentation"`) or a selectable option. `index` is the option's position within `visibleOptions()` — the flat, post-filter/post-group list keyboard nav and `aria-activedescendant` operate over. Mirrors `DynamoSelect`'s identical render-item shape. */
type DynamoAutocompleteRenderItem<TValue> =
  | { kind: 'heading'; label: string }
  | { kind: 'option'; option: DynamoSelectOption<TValue>; index: number };

@Component({
  selector: 'dg-autocomplete',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoSpinner,
    DynamoVirtualScroll,
    DynamoPassThroughDirective,
    NgTemplateOutlet,
  ],
  templateUrl: './autocomplete.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoAutocomplete),
      multi: true,
    },
  ],
})
export class DynamoAutocomplete<TValue = unknown>
  extends DynamoListboxBase<DynamoAutocompletePart>
  implements ControlValueAccessor
{
  readonly options = input.required<DynamoSelectOption<TValue>[]>();
  readonly placeholder = input('');
  readonly size = input<DynamoSelectSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Associates the field with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `true` to match every existing consumer's
   *  assumption of a full-width field; set `false` for intrinsic sizing. */
  readonly fluid = input(true);
  readonly invalid = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** HTML `readonly` semantics: the current text stays visible and the input
   *  stays focusable/tabbable, but typing and invoking the suggestion panel
   *  are blocked. Unlike `disabled`, does not remove the control from the
   *  tab order or dim its appearance. */
  readonly readOnly = input(false);
  /** Renders a small spinner over the field and makes the component fully
   *  non-interactive, like `disabled`. Never emits back — the consumer
   *  drives it. */
  readonly loading = input(false);
  /** Shows an × button that clears the typed text — mirrors `DynamoInputText`'s own `showClear`
   *  (the field here is a bare `<input>`, not a button trigger like `DynamoSelect`'s `clearable`). */
  readonly clearable = input(false);
  readonly clearAriaLabel = input('Clear');
  readonly position = input<DynamoSelectPosition>('bottom-start');
  readonly noResultsMessage = input('No matching options');
  /**
   * Opt-in — renders the suggestion list through `@dynamong/virtual-scroll`
   * instead of a plain `@for`, for large option lists. Only takes effect
   * for the ungrouped case (see `isVirtualized`): `@dynamong/virtual-scroll`
   * is fixed-row-height only, and a grouped list's heading rows are a
   * different height than option rows — mixing the two would misalign
   * CDK's scroll-position math. A grouped Autocomplete silently falls back
   * to today's full, non-virtualized render — no visual regression, just
   * no perf win for that specific shape.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matched to `selectOptionStyles`' actual rendered height (`px-4 py-2 text-sm`). */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `selectPanelWrapperStyles`' own `max-h-60` (240px) so the virtualized panel is roughly the same size as today's CSS-scrolled one. */
  readonly virtualScrollHeight = input(240);
  /** Two-way bindable; also driven by Angular forms via `writeValue`. The free-typed text — never constrained to an option's value. */
  readonly value = model('');
  /** Fires with the full matched option when a suggestion is picked (click or Enter). */
  readonly optionSelect = output<DynamoSelectOption<TValue>>();
  /**
   * Opt-in server-side/async mode: `options()` is trusted to already be
   * the current suggestion set (the consumer's own responsibility) — this
   * component stops filtering it locally by the typed text. Pair with
   * `(searchQuery)` to fetch matching options as the user types.
   */
  readonly lazy = input(false);
  /** Debounced by `debounceTime`. Only fires in `lazy` mode, once the typed text reaches `minLength`. Named `searchQuery`, not `search`, to avoid colliding with the native DOM `search` event. */
  readonly searchQuery = output<string>();
  /** Milliseconds to wait after the last keystroke before emitting `searchQuery`. */
  readonly debounceTime = input(300);
  /** Minimum typed length before `searchQuery` fires. Below this, no request is made and no event is emitted. */
  readonly minLength = input(1);

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLInputElement>>('triggerEl');
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

  protected readonly fieldId = this.idGenerator.next('dg-autocomplete-field');
  protected readonly listboxId = this.idGenerator.next(
    'dg-autocomplete-listbox',
  );

  private onChangeFn: (value: string) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };
  private searchTimer: ReturnType<typeof setTimeout> | undefined;

  protected readonly filteredOptions = computed(() =>
    this.lazy()
      ? this.options()
      : filterSelectOptions(this.options(), this.value()),
  );
  protected readonly groupedOptions = computed(() =>
    groupSelectOptions(this.filteredOptions()),
  );
  /** Flat, post-filter/post-group list — what keyboard nav and `activeIndex` operate over. */
  protected readonly visibleOptions = computed(() =>
    flattenGroupedOptions(this.groupedOptions()),
  );
  /** True only for the ungrouped case — see `virtualScroll`'s own doc comment for why grouped lists can't be virtualized in v1. `groupedOptions()` always yields at least one bucket (a single `group: null` one for ungrouped input), so "ungrouped" is exactly "at most one group". */
  protected readonly isVirtualized = computed(
    () => this.virtualScroll() && this.groupedOptions().length <= 1,
  );
  protected readonly renderItems = computed<
    DynamoAutocompleteRenderItem<TValue>[]
  >(() => {
    const items: DynamoAutocompleteRenderItem<TValue>[] = [];
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
  /**
   * In `lazy` mode, `options()` IS the current (possibly server-empty)
   * result set, not "every option that exists" — so a genuinely empty
   * server response must still show the message, unlike the non-lazy
   * case's `this.options().length > 0` guard (which exists there only to
   * distinguish "nothing configured at all" from "no matches").
   */
  protected readonly showNoResults = computed(
    () =>
      this.visibleOptions().length === 0 &&
      this.value().trim().length > 0 &&
      (this.lazy() || this.options().length > 0),
  );
  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });

  protected readonly isDisabled = computed(
    () => this.disabled() || this.loading(),
  );

  protected readonly fieldWrapperClasses = computed(() =>
    cn(autocompleteFieldWrapperStyles, this.ptFor('root').class),
  );
  /** Whether either the spinner or the clear button may occupy the field's trailing slot — they're
   *  never shown simultaneously (the clear button hides itself while loading), but either one alone
   *  still needs the same reserved padding. */
  private readonly showsTrailingIcon = computed(
    () => this.loading() || (this.clearable() && !!this.value()),
  );
  protected readonly fieldClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('field').class)
      : cn(
          autocompleteFieldStyles({
            size: this.size(),
            invalid: this.invalid(),
            fluid: this.fluid(),
            trailingIcon: this.showsTrailingIcon(),
          }),
          this.styleClass(),
          this.ptFor('field').class,
        ),
  );
  protected readonly loadingIndicatorClasses =
    autocompleteLoadingIndicatorStyles;
  protected readonly clearButtonClasses = computed(() =>
    cn(autocompleteClearButtonStyles, this.ptFor('clear').class),
  );
  /** Switches to `selectPanelWrapperVirtualStyles` while virtualized — see that constant's own doc comment for the "double scrollbar" bug this avoids. */
  protected readonly panelWrapperClasses = computed(() =>
    cn(
      this.isVirtualized()
        ? selectPanelWrapperVirtualStyles
        : selectPanelWrapperStyles,
      this.ptFor('panel').class,
    ),
  );
  protected readonly listboxClasses = computed(() =>
    cn(selectListboxStyles, this.ptFor('listbox').class),
  );
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

    // Re-validates `activeIndex` if `visibleOptions()` changes while the panel stays open (e.g. an
    // async `lazy`-mode result swap, or a disabled flag flipping) — without this, a stale index could
    // point past the end of the new list or at a since-disabled row, and `aria-activedescendant` would
    // reference a nonexistent/mismatched option id. Self-terminating: the write only fires when
    // `recovered` actually differs from the current value, so a no-op pass never re-triggers itself.
    // Adapted from `DynamoSelect`'s identical effect, with one deliberate difference: `current < 0` is
    // NOT treated as invalid here — unlike Select (whose `openList()` always seeds a real index),
    // Autocomplete's `onInput` intentionally resets `activeIndex` to `-1` on every keystroke so nothing
    // is pre-highlighted while typing; promoting that back to `0` would silently highlight (and let
    // Enter select) a suggestion the user never actually navigated to.
    effect(() => {
      if (!this.isOpen()) return;
      const options = this.visibleOptions();
      const current = this.activeIndex();
      if (current < 0) return;
      const isInvalid = current >= options.length || options[current]?.disabled;
      if (!isInvalid) return;
      const recovered = findEnabledIndex(options, -1, 1) ?? -1;
      if (recovered !== current) this.activeIndex.set(recovered);
    });

    this.destroyRef.onDestroy(() => {
      this.destroyOverlay();
      clearTimeout(this.searchTimer);
    });
  }

  protected triggerElRef(): ElementRef<HTMLElement> {
    return this.triggerEl();
  }

  // The field is a directly-typed-into text input, so the panel matching
  // its width (and staying in sync as it resizes) is the expected
  // behavior — unlike DynamoSelect/DynamoMultiSelect's button trigger,
  // which keeps a fixed min-width panel regardless of trigger width.
  protected override matchOverlayWidthToTrigger(): boolean {
    return true;
  }

  protected panelTemplateRef(): TemplateRef<unknown> {
    return this.panelTemplate();
  }

  protected overlayPositions(): ConnectedPosition[] {
    return buildListboxPositions(this.position());
  }

  protected entryKey(item: DynamoAutocompleteRenderItem<TValue>): string {
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
        selected: false,
        disabled: !!option.disabled,
      }),
      this.ptFor('option').class,
    );
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text);
    this.onChangeFn(text);
    this.activeIndex.set(-1);
    // Typing-driven open/close is gated on `minLength` in both modes — not just `lazy`'s own
    // `searchQuery` emission gate below, a separate concern (network-request gating, not panel
    // visibility). Keyboard-driven `openList()` (ArrowDown/Up while closed) deliberately stays
    // un-gated — an existing escape hatch to browse the current list regardless of typed length.
    if (text.trim().length >= this.minLength()) {
      if (!this.isOpen()) {
        this.isOpen.set(true);
      }
    } else if (this.isOpen()) {
      this.isOpen.set(false);
    }
    if (this.lazy()) {
      this.debounceSearch(text);
    }
  }

  private debounceSearch(text: string): void {
    clearTimeout(this.searchTimer);
    if (text.trim().length < this.minLength()) {
      return;
    }
    this.searchTimer = setTimeout(() => {
      this.searchQuery.emit(text);
    }, this.debounceTime());
  }

  protected onKeydown(event: KeyboardEvent): void {
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
      case 'Enter': {
        if (this.isOpen() && this.activeIndex() >= 0) {
          event.preventDefault();
          const active = this.visibleOptions()[this.activeIndex()];
          if (active) this.selectOption(active);
        }
        break;
      }
      case 'Escape':
        if (this.isOpen()) {
          event.preventDefault();
          this.close();
        }
        break;
    }
  }

  protected selectOption(option: DynamoSelectOption<TValue>): void {
    if (this.readOnly() || option.disabled) return;
    this.value.set(option.label);
    this.onChangeFn(option.label);
    this.optionSelect.emit(option);
    this.close();
  }

  protected onBlur(): void {
    this.close();
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisabled() || this.readOnly()) return;
    this.value.set('');
    this.onChangeFn('');
    this.triggerEl().nativeElement.focus();
  }

  private openList(): void {
    if (this.isDisabled() || this.readOnly()) return;
    this.isOpen.set(true);
    this.activeIndex.set(findEnabledIndex(this.visibleOptions(), -1, 1) ?? -1);
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
   * (openList/moveActive/Home/End) — deliberately NOT from the
   * `(mouseenter)="activeIndex.set(i)"` hover handler in the template.
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

  protected close(): void {
    this.isOpen.set(false);
    this.onTouchedFn();
  }

  writeValue(value: string | null): void {
    this.value.set(value ?? '');
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }
}
