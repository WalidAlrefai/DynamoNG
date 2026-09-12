import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import type { DynamoSelectOption } from '@dynamong/core/api';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoCheckIcon } from '@dynamong/icons';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { cn } from '@dynamong/utils/class-merge';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
} from '@dynamong/utils/typeahead';
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
  listboxRootVirtualStyles,
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
  imports: [DynamoCheckIcon, DynamoVirtualScroll],
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
  /**
   * Fires once per direct user activation (click, Enter/Space, and — in
   * single-select mode only — arrow-key navigation, since selection follows
   * focus there) with the full option object.
   */
  readonly itemSelect = output<DynamoSelectOption<TValue>>();
  /**
   * Opt-in — renders the option list through `@dynamong/virtual-scroll`
   * instead of a plain `@for`, for large option lists. Only takes effect
   * for the ungrouped case (see `isVirtualized`): `@dynamong/virtual-scroll`
   * is fixed-row-height only, and a grouped list's heading rows are a
   * different height than option rows. A grouped Listbox silently falls
   * back to the full, non-virtualized render.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matched to `listboxOptionStyles`' actual rendered height (`px-4 py-2 text-sm`). */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `listboxRootStyles`' own `max-h-72` (288px) so the virtualized list is roughly the same size as today's CSS-scrolled one. */
  readonly virtualScrollHeight = input(288);

  private readonly virtualScrollRef = viewChild(DynamoVirtualScroll);

  protected readonly listboxId = this.idGenerator.next('dg-listbox');
  protected readonly activeIndex = signal(-1);
  private hasSeededActive = false;
  private readonly typeahead = createTypeaheadBuffer();

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
  /** True only for the ungrouped case — see `virtualScroll`'s own doc comment for why grouped lists can't be virtualized in v1. `groupedOptions()` always yields at least one bucket (a single `group: null` one for ungrouped input), so "ungrouped" is exactly "at most one group". */
  protected readonly isVirtualized = computed(
    () => this.virtualScroll() && this.groupedOptions().length <= 1,
  );
  protected readonly activeOptionId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.optionId(index) : null;
  });
  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          this.isVirtualized() ? listboxRootVirtualStyles : listboxRootStyles,
          this.styleClass(),
        ),
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
    this.itemSelect.emit(option);
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
      default:
        this.handleTypeahead(event, options);
        break;
    }
  }

  private handleTypeahead(
    event: KeyboardEvent,
    options: readonly DynamoSelectOption<TValue>[],
  ): void {
    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey
    ) {
      return;
    }
    const buffer = this.typeahead.append(event.key);
    const query = resolveTypeaheadQuery(buffer);
    const match = findTypeaheadMatch(options, this.activeIndex(), query);
    if (match === null) return;
    event.preventDefault();
    this.setActiveIndex(match);
  }

  private moveActive(delta: number): void {
    const next = findEnabledListboxIndex(this.visibleOptions(), this.activeIndex(), delta);
    if (next !== null) this.setActiveIndex(next);
  }

  /**
   * Scrolls the virtualized viewport so `activeIndex` is actually rendered
   * — load-bearing, not a UX nicety: once virtualized, an off-screen
   * "active" option may not exist in the DOM at all, and
   * `aria-activedescendant` (`activeOptionId`) would point at a nonexistent
   * id without this. Called only via `setActiveIndex()` (the keyboard-nav
   * path: Arrow/Home/End) — deliberately NOT from the
   * `(mouseenter)="activeIndex.set(i)"` hover handler in listbox.html, which
   * writes the signal directly. CDK's own `scrollToIndex` is an
   * unconditional absolute scroll (always jumps so the target index lands
   * at the very top — not a "scroll into view only if needed" call), so
   * calling it on every `activeIndex` change including hover would visibly
   * jump the list on every hover.
   */
  private scrollActiveIntoView(): void {
    if (!this.isVirtualized()) return;
    const index = this.activeIndex();
    if (index >= 0) this.virtualScrollRef()?.scrollToIndex(index);
  }

  // Selection follows focus in single-select mode (the WAI-ARIA-recommended
  // default for single-select listboxes — the same "arrow moves AND selects"
  // behavior Select Button's segments use), matching how a native
  // `<select size>` behaves. In multi-select mode, arrows only move the
  // active highlight — Space/Enter is the sole toggle path, matching native
  // checkbox-group conventions (no arrow-key-toggles behavior exists there).
  private setActiveIndex(index: number): void {
    this.activeIndex.set(index);
    this.scrollActiveIntoView();
    if (!this.multiple() && index >= 0) {
      const option = this.visibleOptions()[index];
      if (option) this.activate(option);
    }
  }
}
