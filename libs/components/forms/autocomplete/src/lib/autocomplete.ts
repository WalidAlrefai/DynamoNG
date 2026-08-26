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
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
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
} from '@dynamong/select';
import { cn } from '@dynamong/utils/class-merge';
import { autocompleteFieldStyles } from './autocomplete.styles';
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
  readonly invalid = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly position = input<DynamoSelectPosition>('bottom-start');
  readonly noResultsMessage = input('No matching options');
  /** Two-way bindable; also driven by Angular forms via `writeValue`. The free-typed text — never constrained to an option's value. */
  readonly value = model('');
  /** Fires with the full matched option when a suggestion is picked (click or Enter). */
  readonly optionSelect = output<DynamoSelectOption<TValue>>();

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLInputElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');

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

  protected readonly filteredOptions = computed(() =>
    filterSelectOptions(this.options(), this.value()),
  );
  protected readonly groupedOptions = computed(() =>
    groupSelectOptions(this.filteredOptions()),
  );
  /** Flat, post-filter/post-group list — what keyboard nav and `activeIndex` operate over. */
  protected readonly visibleOptions = computed(() =>
    flattenGroupedOptions(this.groupedOptions()),
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
  protected readonly showNoResults = computed(
    () =>
      this.visibleOptions().length === 0 &&
      this.value().trim().length > 0 &&
      this.options().length > 0,
  );
  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });

  protected readonly fieldClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          autocompleteFieldStyles({
            size: this.size(),
            invalid: this.invalid(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly panelWrapperClasses = selectPanelWrapperStyles;
  protected readonly listboxClasses = selectListboxStyles;
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
    return selectOptionStyles({
      active: index === this.activeIndex(),
      selected: false,
      disabled: !!option.disabled,
    });
  }

  protected onInput(event: Event): void {
    const text = (event.target as HTMLInputElement).value;
    this.value.set(text);
    this.onChangeFn(text);
    this.activeIndex.set(-1);
    if (!this.isOpen()) {
      this.isOpen.set(true);
    }
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
    if (option.disabled) return;
    this.value.set(option.label);
    this.onChangeFn(option.label);
    this.optionSelect.emit(option);
    this.close();
  }

  protected onBlur(): void {
    this.close();
  }

  private openList(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    this.activeIndex.set(findEnabledIndex(this.visibleOptions(), -1, 1) ?? -1);
  }

  private moveActive(delta: number): void {
    const next = findEnabledIndex(
      this.visibleOptions(),
      this.activeIndex(),
      delta,
    );
    if (next !== null) this.activeIndex.set(next);
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
