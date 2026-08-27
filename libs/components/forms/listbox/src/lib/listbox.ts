import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  signal,
} from '@angular/core';
import type { DynamoSelectOption } from '@dynamong/core/api';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoCheckIcon } from '@dynamong/icons';
import { cn } from '@dynamong/utils/class-merge';
import {
  findEnabledListboxIndex,
  flattenGroupedListboxOptions,
  groupListboxOptions,
} from './listbox-option-filter';
import {
  listboxGroupHeadingStyles,
  listboxOptionCheckboxStyles,
  listboxOptionStyles,
  listboxRootStyles,
} from './listbox.styles';
import type {
  DynamoListboxPart,
  DynamoListboxSize,
  DynamoListboxValue,
} from './listbox.types';

/**
 * One rendered row: a group heading (`role="presentation"`) or a selectable
 * option. `index` is the option's position within `visibleOptions()` — the
 * flat list keyboard nav / activeIndex / aria-activedescendant operate over.
 */
type DynamoListboxRenderItem<TValue> =
  | { kind: 'heading'; label: string }
  | { kind: 'option'; option: DynamoSelectOption<TValue>; index: number };

@Component({
  selector: 'dg-listbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCheckIcon],
  templateUrl: './listbox.html',
})
export class DynamoListbox<TValue = unknown> extends DynamoBaseComponent<DynamoListboxPart> {
  readonly options = input.required<DynamoSelectOption<TValue>[]>();
  readonly multiple = input(false);
  readonly size = input<DynamoListboxSize>('md');
  readonly disabled = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable. Scalar (`TValue | null`) in single-select mode, array (`TValue[]`) once `multiple` is true. */
  readonly value = model<DynamoListboxValue<TValue>>(null);

  protected readonly listboxId = this.idGenerator.next('dg-listbox');
  protected readonly activeIndex = signal(-1);
  private hasSeededActive = false;

  protected readonly groupedOptions = computed(() => groupListboxOptions(this.options()));
  protected readonly visibleOptions = computed(() =>
    flattenGroupedListboxOptions(this.groupedOptions()),
  );
  protected readonly renderItems = computed<DynamoListboxRenderItem<TValue>[]>(() => {
    const items: DynamoListboxRenderItem<TValue>[] = [];
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
  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });
  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(listboxRootStyles, this.styleClass()),
  );
  protected readonly groupHeadingClasses = listboxGroupHeadingStyles;

  constructor() {
    super();
    // Seed activeIndex to the first selected option (single mode) or the
    // first enabled option, exactly once — after that, the user's own
    // hover/arrow-key movement owns activeIndex.
    effect(() => {
      const opts = this.visibleOptions();
      if (this.hasSeededActive || opts.length === 0) return;
      this.hasSeededActive = true;
      const selectedIndex = opts.findIndex((o) => this.isSelected(o));
      this.activeIndex.set(
        selectedIndex >= 0 ? selectedIndex : (findEnabledListboxIndex(opts, -1, 1) ?? -1),
      );
    });
  }

  private toArray(value: DynamoListboxValue<TValue>): TValue[] {
    if (value === null) return [];
    return Array.isArray(value) ? value : [value];
  }

  protected entryKey(item: DynamoListboxRenderItem<TValue>): string {
    return item.kind === 'heading'
      ? `heading:${item.label}`
      : `option:${String(item.option.value)}`;
  }

  protected optionId(index: number): string {
    return `${this.listboxId}-option-${index}`;
  }

  protected isSelected(option: DynamoSelectOption<TValue>): boolean {
    return this.toArray(this.value()).includes(option.value);
  }

  protected isOptionDisabled(option: DynamoSelectOption<TValue>): boolean {
    return this.disabled() || !!option.disabled;
  }

  protected optionClasses(option: DynamoSelectOption<TValue>, index: number): string {
    return listboxOptionStyles({
      active: index === this.activeIndex(),
      selected: this.isSelected(option),
      disabled: !!option.disabled,
    });
  }

  protected checkboxClasses(option: DynamoSelectOption<TValue>): string {
    return listboxOptionCheckboxStyles({ checked: this.isSelected(option) });
  }

  protected activate(option: DynamoSelectOption<TValue>): void {
    if (this.isOptionDisabled(option)) return;

    if (this.multiple()) {
      const current = this.toArray(this.value());
      const next = current.includes(option.value)
        ? current.filter((v) => v !== option.value)
        : [...current, option.value];
      this.value.set(next);
    } else {
      // Re-selecting the already-active option is a no-op re-set — a
      // listbox never toggles off, matching "always exactly one" semantics.
      this.value.set(option.value);
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const options = this.visibleOptions();

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.setActiveIndex(findEnabledListboxIndex(options, -1, 1) ?? -1);
        break;
      case 'End':
        event.preventDefault();
        this.setActiveIndex(findEnabledListboxIndex(options, 0, -1) ?? -1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const active = options[this.activeIndex()];
        if (active) this.activate(active);
        break;
      }
    }
  }

  private moveActive(delta: number): void {
    const next = findEnabledListboxIndex(this.visibleOptions(), this.activeIndex(), delta);
    if (next !== null) this.setActiveIndex(next);
  }

  // Selection follows focus in single-select mode (the WAI-ARIA-recommended
  // default for single-select listboxes — the same "arrow moves AND selects"
  // behavior Select Button's segments use), matching how a native
  // `<select size>` behaves. In multi-select mode, arrows only move the
  // active highlight — Space/Enter is the sole toggle path, matching native
  // checkbox-group conventions (no arrow-key-toggles behavior exists there).
  private setActiveIndex(index: number): void {
    this.activeIndex.set(index);
    if (!this.multiple() && index >= 0) {
      const option = this.visibleOptions()[index];
      if (option) this.activate(option);
    }
  }
}
