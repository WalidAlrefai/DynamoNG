import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChild,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import {
  CdkDrag,
  CdkDropList,
  CdkDropListGroup,
  moveItemInArray,
  type CdkDragDrop,
} from '@angular/cdk/drag-drop';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { DynamoCheckIcon } from '@dynamong/icons';
import { DynamoInputText } from '@dynamong/input-text';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { filterPicklistOptions } from './picklist-option-filter';
import { findEnabledPicklistIndex } from './picklist-option-nav';
import {
  picklistButtonStyles,
  picklistFilterFieldWrapperStyles,
  picklistFilterIconStyles,
  picklistFilterInputExtraClasses,
  picklistFilterWrapperStyles,
  picklistMoveButtonColumnStyles,
  picklistNoResultsStyles,
  picklistOptionCheckboxStyles,
  picklistOptionStyles,
  picklistPanelHeaderStyles,
  picklistPanelListStyles,
  picklistPanelListVirtualStyles,
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
  imports: [
    CdkDropList,
    CdkDropListGroup,
    CdkDrag,
    DynamoCheckIcon,
    DynamoVirtualScroll,
    DynamoInputText,
    DynamoPassThroughDirective,
    NgTemplateOutlet,
  ],
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
  /** HTML `readonly` semantics: rows stay visible/focusable/navigable, but
   *  moving items (drag, arrows, buttons) and selection are all blocked.
   *  Unlike `disabled`, doesn't dim either panel or remove it from the tab
   *  order. */
  readonly readOnly = input(false);
  readonly sourceLabel = input('Available');
  readonly targetLabel = input('Selected');
  /** Associates both panels' listboxes with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `true` to match every existing consumer's
   *  assumption of a full-width root; set `false` for intrinsic sizing. */
  readonly fluid = input(true);
  /** Independently shows/hides the source panel's own ▲/▼ reorder-button row. */
  readonly showSourceReorderButtons = input(true);
  /** Independently shows/hides the target panel's own ▲/▼ reorder-button row. */
  readonly showTargetReorderButtons = input(true);

  /** Shows a per-panel search box that narrows that panel's rows by label. */
  readonly filterable = input(false);
  /** Two-way bindable filter query for the source panel. */
  readonly sourceFilterText = model('');
  /** Two-way bindable filter query for the target panel. */
  readonly targetFilterText = model('');
  readonly filterPlaceholder = input('Search...');
  /** Shown when a panel is non-empty but its filter matched nothing — distinct from a genuinely empty panel, which renders no message. */
  readonly noResultsMessage = input('No matching options');

  /**
   * Opt-in — renders each panel's option list through
   * `@dynamong/virtual-scroll` instead of a plain `@for`, for large
   * `source`/`target` arrays. Unlike Listbox, Picklist has no grouping
   * concept, so there's no fixed-row-height edge case to guard against —
   * but drag-and-drop pays the price instead: while this is on, CDK
   * drag-and-drop (both same-panel reorder-via-drag and cross-panel
   * transfer-via-drag) is disabled on BOTH panels. `CdkDropList` computes
   * `previousIndex`/`currentIndex` from its own `_draggables` list of
   * currently-mounted `<li cdkDrag>` elements, which is only a subset of
   * the full array once virtualized — not the full-array positions
   * `onDropped()` assumes. Rather than risk a silently-wrong reorder/
   * transfer, drag is disabled outright; the always-visible ▲/▼
   * keyboard-reorder buttons and the ▶/◀/▶▶/◀◀ move buttons are
   * unaffected (both operate on the full array directly, never on CDK's
   * mounted-DOM index tracking), so every operation stays available while
   * virtualized, just not via drag.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matches `picklistOptionStyles`' own rendered height (`px-3 py-2 text-sm`: 16px padding + 20px line-height). */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `picklistPanelStyles`' own `max-h-80` (320px) so a virtualized panel is roughly the same size as the non-virtualized, CSS-scrolled one. */
  readonly virtualScrollHeight = input(320);

  protected readonly sourceSelected = signal<Set<TValue>>(new Set());
  protected readonly targetSelected = signal<Set<TValue>>(new Set());

  /**
   * Value-keyed, NOT index-keyed, because rendering is no longer 1:1 with
   * `source()`/`target()` once `filterable` is in play — mirrors
   * `DynamoOrderList`'s own `activeValue`/`activeIndex` split.
   * `sourceActiveIndex`/`targetActiveIndex` below are derived purely so
   * `canMoveUp`/`canMoveDown`/`reorder` keep reading a full-array position
   * exactly as before.
   */
  protected readonly sourceActiveValue = signal<TValue | null>(null);
  protected readonly targetActiveValue = signal<TValue | null>(null);

  // Template-ref-scoped (not a type-only `viewChild(DynamoVirtualScroll)`)
  // because both panels can be virtualized simultaneously — a type-only
  // query would only ever resolve one of the two instances.
  private readonly sourceVirtualScrollRef = viewChild<
    DynamoVirtualScroll<DynamoSelectOption<TValue>>
  >('sourceVirtualScroll');
  private readonly targetVirtualScrollRef = viewChild<
    DynamoVirtualScroll<DynamoSelectOption<TValue>>
  >('targetVirtualScroll');

  /** Optional per-option custom rendering, shared across both panels — falls back to plain
   *  `{{ option.label }}` text when unset. No `side` in the context: a template rendering identically
   *  regardless of which panel an option currently lives in is the expected case. */
  protected readonly optionTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoSelectOption<TValue> }>>(
      'optionTemplate',
    );

  protected readonly canMoveSelectedRight = computed(
    () => this.sourceSelected().size > 0,
  );
  protected readonly canMoveSelectedLeft = computed(
    () => this.targetSelected().size > 0,
  );
  protected readonly canMoveAllRight = computed(() => this.source().length > 0);
  protected readonly canMoveAllLeft = computed(() => this.target().length > 0);

  // --- filtering ---

  protected readonly filteredSource = computed(() =>
    filterPicklistOptions(this.source(), this.sourceFilterText()),
  );
  protected readonly filteredTarget = computed(() =>
    filterPicklistOptions(this.target(), this.targetFilterText()),
  );

  // `cdkDropListData` needs a mutable array type (CDK's own typing), unlike
  // `filteredSource()`/`filteredTarget()` (deliberately `readonly`, matching
  // `filterPicklistOptions`'s pure-function signature) — a fresh shallow
  // copy is harmless since `onDropped` never trusts CDK's in-place mutation
  // anyway, only reads `previousIndex`/`currentIndex`.
  protected readonly cdkSourceItems = computed(() => [
    ...this.filteredSource(),
  ]);
  protected readonly cdkTargetItems = computed(() => [
    ...this.filteredTarget(),
  ]);

  protected readonly isSourceFilterActive = computed(
    () => this.filterable() && this.sourceFilterText().trim().length > 0,
  );
  protected readonly isTargetFilterActive = computed(
    () => this.filterable() && this.targetFilterText().trim().length > 0,
  );

  protected readonly showSourceNoResults = computed(
    () =>
      this.filterable() &&
      this.source().length > 0 &&
      this.filteredSource().length === 0,
  );
  protected readonly showTargetNoResults = computed(
    () =>
      this.filterable() &&
      this.target().length > 0 &&
      this.filteredTarget().length === 0,
  );

  /** Full-array position of the active item, or -1. Nothing writes to this directly — see `sourceActiveValue`. */
  protected readonly sourceActiveIndex = computed(() => {
    const active = this.sourceActiveValue();
    return active === null
      ? -1
      : this.source().findIndex((option) => option.value === active);
  });
  protected readonly targetActiveIndex = computed(() => {
    const active = this.targetActiveValue();
    return active === null
      ? -1
      : this.target().findIndex((option) => option.value === active);
  });

  /** Position of the active item within the currently-rendered (filtered) panel — what keyboard nav and virtual-scroll's `scrollToIndex` operate on. */
  protected readonly sourceActiveFilteredIndex = computed(() => {
    const active = this.sourceActiveValue();
    return active === null
      ? -1
      : this.filteredSource().findIndex((option) => option.value === active);
  });
  protected readonly targetActiveFilteredIndex = computed(() => {
    const active = this.targetActiveValue();
    return active === null
      ? -1
      : this.filteredTarget().findIndex((option) => option.value === active);
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          picklistRootStyles({ fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly buttonClasses = picklistButtonStyles;
  protected panelClasses(part: 'sourcePanel' | 'targetPanel'): string {
    return cn(picklistPanelStyles, this.ptFor(part).class);
  }
  protected readonly panelHeaderClasses = picklistPanelHeaderStyles;
  protected readonly panelTitleClasses = picklistPanelTitleStyles;
  protected readonly moveButtonColumnClasses = computed(() =>
    cn(picklistMoveButtonColumnStyles, this.ptFor('moveButtons').class),
  );
  protected readonly reorderButtonRowClasses = computed(() =>
    cn(picklistReorderButtonRowStyles, this.ptFor('reorderButtons').class),
  );
  protected readonly filterWrapperClasses = picklistFilterWrapperStyles;
  protected readonly filterFieldWrapperClasses =
    picklistFilterFieldWrapperStyles;
  protected readonly filterIconClasses = picklistFilterIconStyles;
  protected readonly filterInputExtraClasses = picklistFilterInputExtraClasses;
  protected readonly noResultsClasses = computed(() =>
    cn(picklistNoResultsStyles, this.ptFor('no-results').class),
  );

  // Trivial today (Picklist has no grouping concept to guard against, unlike
  // Listbox's isVirtualized), but kept as its own computed so both panels
  // read one shared flag and stay in lockstep — Picklist never virtualizes
  // them independently.
  protected readonly isVirtualized = computed(() => this.virtualScroll());

  /**
   * Gates each panel's own `cdkDropList` off — both as a drag origin and a
   * drop target — while virtualized (see `virtualScroll`'s own doc comment
   * for why) or while THAT panel's own filter is active: a filtered panel's
   * rendered indices no longer match its full-array positions, and CDK's
   * `previousIndex`/`currentIndex` are computed from the mounted (filtered)
   * subset, not the full array `onDropped()` assumes — for either side of a
   * transfer. Folded together with `disabled()`/`readOnly()` into one
   * boolean per panel for `[cdkDropListDisabled]`.
   */
  protected readonly sourceDropListDisabled = computed(
    () =>
      this.disabled() ||
      this.readOnly() ||
      this.isVirtualized() ||
      this.isSourceFilterActive(),
  );
  protected readonly targetDropListDisabled = computed(
    () =>
      this.disabled() ||
      this.readOnly() ||
      this.isVirtualized() ||
      this.isTargetFilterActive(),
  );

  /** `dg-virtual-scroll`'s own fixed-height viewport is the sole scrolling region while virtualized — this `<ul>` must not also scroll (no double scrollbar). */
  protected readonly panelListClasses = computed(() =>
    cn(
      this.isVirtualized()
        ? picklistPanelListVirtualStyles
        : picklistPanelListStyles,
      this.ptFor('listbox').class,
    ),
  );

  /** Mirrors the existing `@for`'s `track option.value` so item identity stays stable across the virtualized/non-virtualized branches and across reorder/move operations. */
  protected readonly virtualTrackBy = (
    option: DynamoSelectOption<TValue>,
  ): unknown => option.value;

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
    if (this.disabled() || this.readOnly() || option.disabled) {
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
    if (this.disabled() || this.readOnly()) {
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
    (from === 'source' ? this.sourceActiveValue : this.targetActiveValue).set(
      null,
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
    if (this.disabled() || this.readOnly()) {
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
    if (this.disabled() || this.readOnly()) return false;
    const idx =
      side === 'source' ? this.sourceActiveIndex() : this.targetActiveIndex();
    return idx > 0;
  }

  protected canMoveDown(side: DynamoPicklistSide): boolean {
    if (this.disabled() || this.readOnly()) return false;
    const idx =
      side === 'source' ? this.sourceActiveIndex() : this.targetActiveIndex();
    const len = (side === 'source' ? this.source() : this.target()).length;
    return idx >= 0 && idx < len - 1;
  }

  protected reorder(side: DynamoPicklistSide, direction: -1 | 1): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    const listModel = side === 'source' ? this.source : this.target;
    const idx =
      side === 'source' ? this.sourceActiveIndex() : this.targetActiveIndex();
    const target = idx + direction;
    if (idx < 0 || target < 0 || target >= listModel().length) {
      return;
    }
    const next = [...listModel()];
    moveItemInArray(next, idx, target);
    listModel.set(next);
    // activeValue is unchanged — the moved item is the one that was already
    // active; activeIndex/activeFilteredIndex (derived) pick up its new
    // position automatically.
    this.scrollActiveIntoView(side);
  }

  private setActiveValue(side: DynamoPicklistSide, value: TValue | null): void {
    (side === 'source' ? this.sourceActiveValue : this.targetActiveValue).set(
      value,
    );
  }

  /**
   * Scrolls the virtualized viewport so the active item is actually
   * rendered, at its position within the currently-filtered list. Called
   * only from keyboard-driven moves (Arrow/Home/End nav and the ▲/▼ reorder
   * buttons) — deliberately NOT from the `(mouseenter)="...ActiveValue.set(
   * option.value)"` hover handlers, since CDK's `scrollToIndex` is an
   * unconditional jump-to-top (not "only scroll if out of view"), which
   * would visibly jerk the list on every hover — same fix already applied
   * in Listbox.
   */
  private scrollActiveIntoView(side: DynamoPicklistSide): void {
    if (!this.isVirtualized()) return;
    const index =
      side === 'source'
        ? this.sourceActiveFilteredIndex()
        : this.targetActiveFilteredIndex();
    if (index < 0) return;
    const ref =
      side === 'source'
        ? this.sourceVirtualScrollRef()
        : this.targetVirtualScrollRef();
    ref?.scrollToIndex(index);
  }

  // --- keyboard nav within a panel, mirrors OrderList's onKeydown shape.
  // Navigates the filtered view, never the raw source()/target() — safe
  // unconditionally, since filteredSource()/filteredTarget() are
  // reference-identical to source()/target() whenever that side's filter
  // is blank. ---

  protected onPanelKeydown(
    event: KeyboardEvent,
    side: DynamoPicklistSide,
  ): void {
    if (this.disabled()) {
      return;
    }
    const options =
      side === 'source' ? this.filteredSource() : this.filteredTarget();
    const activeFilteredIndex =
      side === 'source'
        ? this.sourceActiveFilteredIndex()
        : this.targetActiveFilteredIndex();

    switch (event.key) {
      case 'ArrowDown': {
        event.preventDefault();
        const next = findEnabledPicklistIndex(options, activeFilteredIndex, 1);
        if (next !== null) {
          this.setActiveValue(side, options[next]?.value ?? null);
          this.scrollActiveIntoView(side);
        }
        break;
      }
      case 'ArrowUp': {
        event.preventDefault();
        const next = findEnabledPicklistIndex(options, activeFilteredIndex, -1);
        if (next !== null) {
          this.setActiveValue(side, options[next]?.value ?? null);
          this.scrollActiveIntoView(side);
        }
        break;
      }
      case 'Home': {
        event.preventDefault();
        const next = findEnabledPicklistIndex(options, -1, 1);
        this.setActiveValue(
          side,
          next !== null ? (options[next]?.value ?? null) : null,
        );
        this.scrollActiveIntoView(side);
        break;
      }
      case 'End': {
        event.preventDefault();
        const next = findEnabledPicklistIndex(options, 0, -1);
        this.setActiveValue(
          side,
          next !== null ? (options[next]?.value ?? null) : null,
        );
        this.scrollActiveIntoView(side);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const option = options[activeFilteredIndex];
        if (option) {
          this.toggleSelected(side, option);
        }
        break;
      }
      default:
        break;
    }
  }

  // --- filter box, mirrors OrderList's onFilterInputChange/onFilterKeydown ---

  protected onFilterInputChange(side: DynamoPicklistSide, value: string): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    (side === 'source' ? this.sourceFilterText : this.targetFilterText).set(
      value,
    );
    // filteredSource()/filteredTarget() are read AFTER the set above, so
    // they already reflect the new query (signals recompute synchronously
    // on read).
    const options =
      side === 'source' ? this.filteredSource() : this.filteredTarget();
    const next = findEnabledPicklistIndex(options, -1, 1);
    this.setActiveValue(
      side,
      next !== null ? (options[next]?.value ?? null) : null,
    );
  }

  protected onFilterKeydown(
    side: DynamoPicklistSide,
    event: KeyboardEvent,
  ): void {
    if (this.disabled() || this.readOnly()) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        (side === 'source' ? this.sourceFilterText : this.targetFilterText).set(
          '',
        );
        break;
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const options =
          side === 'source' ? this.filteredSource() : this.filteredTarget();
        const activeFilteredIndex =
          side === 'source'
            ? this.sourceActiveFilteredIndex()
            : this.targetActiveFilteredIndex();
        const next = findEnabledPicklistIndex(
          options,
          activeFilteredIndex,
          event.key === 'ArrowDown' ? 1 : -1,
        );
        if (next !== null) {
          this.setActiveValue(side, options[next]?.value ?? null);
          this.scrollActiveIntoView(side);
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
  ): string {
    return cn(
      picklistOptionStyles({
        active:
          option.value ===
          (side === 'source'
            ? this.sourceActiveValue()
            : this.targetActiveValue()),
        selected: this.isSelected(side, option),
        disabled: !!option.disabled,
      }),
      this.ptFor('option').class,
    );
  }

  protected checkboxClasses(
    side: DynamoPicklistSide,
    option: DynamoSelectOption<TValue>,
  ): string {
    return cn(
      picklistOptionCheckboxStyles({
        checked: this.isSelected(side, option),
      }),
      this.ptFor('checkbox').class,
    );
  }
}
