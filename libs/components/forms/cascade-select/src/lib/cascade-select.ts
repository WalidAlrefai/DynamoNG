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
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import {
  DynamoListboxBase,
  buildListboxPositions,
  selectChevronStyles,
  selectClearButtonStyles,
  selectFilterFieldWrapperStyles,
  selectFilterIconStyles,
  selectFilterInputExtraClasses,
  selectFilterWrapperStyles,
  selectPanelWrapperStyles,
  selectPanelWrapperVirtualStyles,
  selectTriggerButtonStyles,
  selectTriggerStyles,
} from '@dynamong/select';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { DynamoCheckIcon } from '@dynamong/icons';
import type { DynamoTreeNode } from '@dynamong/tree';
import type { DynamoOverlayHandle } from '@dynamong/core/overlay';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
} from '@dynamong/utils/typeahead';
import { flattenCascadeFilterResults } from './cascade-select.filter';
import { buildCascadePositions } from './cascade-select.positioning';
import {
  cascadeSelectCaretStyles,
  cascadeSelectCheckboxIndeterminateDashStyles,
  cascadeSelectCheckboxIndicatorStyles,
  cascadeSelectRowStyles,
} from './cascade-select.styles';
import type {
  DynamoCascadeSelectPart,
  DynamoCascadeSelectSelectionMode,
} from './cascade-select.types';

interface DynamoCascadeLevel<TValue> {
  nodes: DynamoTreeNode<TValue>[];
  activeIndex: number;
  /** The row DOM element (in the *previous* level) this level's flyout is anchored to. `null` only for level 0, which anchors to the trigger instead. */
  anchorEl: HTMLElement | null;
}

function nodeValue<TValue>(node: DynamoTreeNode<TValue>): TValue {
  return (node.value ?? node.id) as TValue;
}

function findNodeByValue<TValue>(
  nodes: DynamoTreeNode<TValue>[],
  value: TValue | null,
): DynamoTreeNode<TValue> | undefined {
  if (value == null) {
    return undefined;
  }
  for (const node of nodes) {
    if (nodeValue(node) === value) {
      return node;
    }
    if (node.children) {
      const found = findNodeByValue(node.children, value);
      if (found) {
        return found;
      }
    }
  }
  return undefined;
}

function containsValue<TValue>(
  node: DynamoTreeNode<TValue>,
  value: TValue,
): boolean {
  if (nodeValue(node) === value) return true;
  return node.children?.some((child) => containsValue(child, value)) ?? false;
}

type DynamoCascadeSelectCheckState = 'checked' | 'unchecked' | 'indeterminate';

// Local, value-keyed port of `@dynamong/tree-select`'s own `selectionMode`
// algorithm (`computeNodeCheckState`/`shouldCascadeCheck`/
// `collectCascadeValues`), duplicated rather than shared — matching this
// codebase's own established precedent of `DynamoTreeSelect` itself
// duplicating from `DynamoTree`'s own `tree-selection.ts` rather than
// extracting a shared util (this is now the third independent copy of the
// same tree-shaped algorithm across the three components; the duplication
// is a deliberate, confirmed call, not an oversight — see the README's
// Design notes).
function computeNodeCheckState<TValue>(
  node: DynamoTreeNode<TValue>,
  selectedValues: ReadonlySet<TValue>,
): DynamoCascadeSelectCheckState {
  if (!node.children?.length) {
    return selectedValues.has(nodeValue(node)) ? 'checked' : 'unchecked';
  }
  const states = node.children.map((child) =>
    computeNodeCheckState(child, selectedValues),
  );
  if (states.every((state) => state === 'checked')) {
    return 'checked';
  }
  if (states.every((state) => state === 'unchecked')) {
    return 'unchecked';
  }
  return 'indeterminate';
}

// Whether toggling `node` should check (true) or uncheck (false) its
// subtree — ignores disabled descendants entirely, so a branch with any
// disabled, unchecked descendant doesn't get stuck permanently
// indeterminate.
function shouldCascadeCheck<TValue>(
  node: DynamoTreeNode<TValue>,
  selectedValues: ReadonlySet<TValue>,
): boolean {
  const enabledLeafStates: boolean[] = [];
  const walk = (current: DynamoTreeNode<TValue>): void => {
    if (current.disabled) return;
    if (!current.children?.length) {
      enabledLeafStates.push(selectedValues.has(nodeValue(current)));
      return;
    }
    current.children.forEach(walk);
  };
  walk(node);
  return enabledLeafStates.length === 0 || !enabledLeafStates.every(Boolean);
}

// Every value in `node`'s own subtree (including itself) whose checked
// state changes together when `node` is toggled. Disabled descendants are
// excluded so a cascading check/uncheck never silently flips a disabled
// node's own state.
function collectCascadeValues<TValue>(node: DynamoTreeNode<TValue>): TValue[] {
  const values: TValue[] = [];
  const walk = (current: DynamoTreeNode<TValue>): void => {
    if (current.disabled) return;
    values.push(nodeValue(current));
    current.children?.forEach(walk);
  };
  walk(node);
  return values;
}

// Mirrors TreeSelect's `findEnabledEntryIndex` shape (linear scan, skip
// disabled, no wrap) — reimplemented locally since each level's `nodes` is
// already a flat array here (no depth/parentId bookkeeping needed).
function findEnabledNodeIndex<TValue>(
  nodes: DynamoTreeNode<TValue>[],
  current: number,
  delta: number,
): number | null {
  let index = current + delta;
  while (index >= 0 && index < nodes.length) {
    if (!nodes[index]?.disabled) {
      return index;
    }
    index += delta;
  }
  return null;
}

@Component({
  selector: 'dg-cascade-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoSpinner,
    DynamoVirtualScroll,
    DynamoInputText,
    DynamoPassThroughDirective,
    DynamoCheckIcon,
  ],
  templateUrl: './cascade-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoCascadeSelect),
      multi: true,
    },
  ],
})
export class DynamoCascadeSelect<TValue = string>
  extends DynamoListboxBase<DynamoCascadeSelectPart>
  implements ControlValueAccessor
{
  readonly nodes = input.required<DynamoTreeNode<TValue>[]>();
  readonly placeholder = input('Select...');
  readonly size = input<DynamoSize>('md');
  readonly invalid = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  /** Renders a small spinner in the trigger and makes the component fully
   *  non-interactive, like `disabled`. Never emits back — the consumer
   *  drives it. */
  readonly loading = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the trigger. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `true` — `selectTriggerStyles`'
   *  own default variant already renders the trigger full-width, so this is
   *  purely an escape hatch, not a behavior change. */
  readonly fluid = input(true);
  /** HTML `readonly` semantics: the trigger stays focusable and the panel
   *  still opens for browsing/drilling, but committing a leaf (or, once
   *  `selectionMode !== 'single'`, toggling any row) is blocked. Unlike
   *  `disabled`, doesn't dim it or remove it from the tab order. */
  readonly readOnly = input(false);
  /** Shows a clear (×) button next to the trigger once a value is selected — mirrors `DynamoSelect`'s own `clearable`. */
  readonly clearable = input(false);
  /** `'single'` (default) is this component's original, only-ever behavior — a plain scalar `value`,
   *  replaced on each pick, panel closes on commit, and only a drilled-into-a-leaf row commits at all.
   *  `'multiple'`/`'checkbox'` are new, non-default modes that make `value` an array: clicking/activating
   *  ANY row (branch or leaf) toggles it instead of drilling — hover/ArrowRight remain the sole drilling
   *  triggers in every mode, unchanged. `'checkbox'` cascades tri-state to enabled descendants, mirroring
   *  `DynamoTreeSelect`'s own `selectionMode='checkbox'` — see the README's Design notes. */
  readonly selectionMode = input<DynamoCascadeSelectSelectionMode>('single');
  /** Two-way bindable; also driven by Angular forms via `writeValue`. A plain `TValue | null` in
   *  `'single'` mode; `TValue[] | null` in `'multiple'`/`'checkbox'` mode. */
  readonly value = model<TValue | TValue[] | null>(null);
  /** Fires once a leaf node is committed (click or keyboard Enter/Space) with the full node object — not while drilling into a branch. */
  readonly itemSelect = output<DynamoTreeNode<TValue>>();
  /**
   * Opt-in — renders every open level's row list through
   * `@dynamong/virtual-scroll` instead of a plain `@for`, for levels with
   * many sibling nodes. Each `level.nodes` is already a flat array and every
   * row is the same height, so fixed-size virtualization applies with no
   * grouping caveat.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matched to `cascadeSelectRowStyles`' actual rendered height. */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `selectPanelWrapperStyles`' own `max-h-60` (240px). */
  readonly virtualScrollHeight = input(240);
  /**
   * Opt-in filter box rendered above the root panel — mirrors
   * `DynamoTreeSelect`'s own `filterable`. Typing switches the panel from
   * the normal nested-flyout view to a single flat list of every matching
   * LEAF (own label or any ancestor's label matches), each shown with its
   * ancestor path as secondary text — not a per-level narrowing of the
   * currently-open flyouts. See `isFilterActive`'s doc comment for why.
   */
  readonly filterable = input(false);
  /** Two-way bindable filter query. */
  readonly filterText = model('');
  readonly filterPlaceholder = input('Search...');
  /** Shown when `nodes()` is non-empty but the filter matched no leaf. */
  readonly noResultsMessage = input('No matching options');

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  // One `<dg-virtual-scroll>` per open level (the shared `#panelTemplate` is
  // instantiated once per level, all via this component's own
  // `viewContainerRef`, so this query captures them all). Indexed by level
  // position — order matches level order for the common "navigate the
  // deepest level" case; a transient mismatch is possible if a mid-stack
  // flyout closes while a sibling opens, which just means one keyboard
  // scroll-into-view lands on the wrong level until the next move. Only
  // consulted while `isVirtualized()`.
  private readonly virtualScrollRefs = viewChildren(DynamoVirtualScroll);

  protected readonly panelId = this.idGenerator.next('dg-cascade-select-panel');

  private onChangeFn: (value: TValue | TValue[] | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };
  /** Cleared on close and on every level switch (ArrowLeft/ArrowRight) — a level change invalidates the buffer's context, since it was matching against a different `nodes` array. */
  private readonly typeahead = createTypeaheadBuffer();

  /** Every currently-open level: `levels()[0]` is the root panel (base-managed overlay), `levels()[1..N]` are flyouts this component manages itself. */
  protected readonly levels = signal<DynamoCascadeLevel<TValue>[]>([]);
  /** Which level currently owns Up/Down/Enter/Escape. */
  protected readonly activeLevelIndex = signal(0);
  /** `flyoutHandles[k]` backs `levels()[k + 1]` — a plain stack, push/pop only, so index bookkeeping never needs a placeholder for the base-managed root level. */
  private readonly flyoutHandles: (DynamoOverlayHandle & {
    anchorEl: HTMLElement;
  })[] = [];
  /** Incremented on every `openPanel()`/`close()` — guards the restore-
   *  drilled-path `requestAnimationFrame` poll against a rapid close then
   *  reopen (with a different value) racing a still-in-flight poll from the
   *  PREVIOUS open. See `pollForAnchorAndAdvance`'s own doc comment. */
  private openGenerationCounter = 0;

  /** Normalizes `value()` into a `Set` regardless of mode/shape — the single source every selection
   *  query (`isSelected`/`checkState`/`hasSelection`) reads from. */
  private readonly selectedValuesSet = computed(() => {
    const current = this.value();
    return new Set<TValue>(
      Array.isArray(current) ? current : current == null ? [] : [current],
    );
  });
  protected readonly hasSelection = computed(
    () => this.selectedValuesSet().size > 0,
  );
  /** Only meaningful in `'single'` mode — `undefined` whenever `value()` is an array. */
  protected readonly selectedNode = computed(() => {
    const current = this.value();
    return Array.isArray(current)
      ? undefined
      : findNodeByValue(this.nodes(), current);
  });
  /** Every currently-selected node, in tree order — used for `'multiple'`/`'checkbox'`'s comma-joined
   *  trigger label. */
  protected readonly selectedNodesList = computed(() => {
    const ids = this.selectedValuesSet();
    if (ids.size === 0) return [];
    const result: DynamoTreeNode<TValue>[] = [];
    const walk = (list: DynamoTreeNode<TValue>[]): void => {
      for (const node of list) {
        if (ids.has(nodeValue(node))) result.push(node);
        if (node.children) walk(node.children);
      }
    };
    walk(this.nodes());
    return result;
  });
  protected readonly selectedLabel = computed(() => {
    if (this.selectionMode() === 'single') {
      return this.selectedNode()?.label ?? this.placeholder();
    }
    const labels = this.selectedNodesList().map((node) => node.label);
    return labels.length > 0 ? labels.join(', ') : this.placeholder();
  });
  protected readonly ariaMultiselectable = computed(
    () => this.selectionMode() !== 'single',
  );
  protected readonly activeDescendantId = computed(() => {
    if (!this.isOpen()) return null;
    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level || level.activeIndex < 0) return null;
    return this.rowId(levelIndex, level.activeIndex);
  });
  protected readonly isVirtualized = computed(() => this.virtualScroll());

  /** True once filtering has replaced the nested-flyout view with the flat
   *  results list. Blank query (or `filterable()` off) means normal
   *  per-level browsing — unlike `filterTree`/TreeSelect's own filter,
   *  which narrow a single already-rendered list in place, CascadeSelect's
   *  "levels" are real, independently DOM-anchored flyout overlays, so
   *  filtering switches the WHOLE panel to a different rendering mode
   *  entirely rather than attempting to narrow the nested view — see
   *  `filteredResults`' own doc comment for the render-order reason a
   *  narrowed *nested* view isn't attempted. */
  protected readonly isFilterActive = computed(
    () => this.filterable() && this.filterText().trim() !== '',
  );
  /** The flattened, filtered leaf list — see `flattenCascadeFilterResults`'
   *  own doc comment for the exact match/exclusion semantics. Empty
   *  whenever `isFilterActive()` is false; there is no "browse everything
   *  flattened" mode. */
  protected readonly filteredResults = computed(() =>
    this.isFilterActive()
      ? flattenCascadeFilterResults(this.nodes(), this.filterText())
      : [],
  );
  protected readonly showNoResults = computed(
    () => this.isFilterActive() && this.filteredResults().length === 0,
  );
  /** Active row index within `filteredResults()` — separate from any
   *  `level.activeIndex`, since there's no level to index into while
   *  filtering. */
  protected readonly filterActiveIndex = signal(-1);

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
    cn(
      this.isVirtualized()
        ? selectPanelWrapperVirtualStyles
        : selectPanelWrapperStyles,
      this.ptFor('panel').class,
    ),
  );
  protected readonly caretClasses = computed(() =>
    cn(cascadeSelectCaretStyles, this.ptFor('caret').class),
  );
  protected readonly noResultsClasses = computed(() =>
    cn('px-3 py-2 text-sm text-text-muted', this.ptFor('no-results').class),
  );
  protected readonly filterWrapperClasses = selectFilterWrapperStyles;
  protected readonly filterFieldWrapperClasses = selectFilterFieldWrapperStyles;
  protected readonly filterIconClasses = selectFilterIconStyles;
  protected readonly filterInputExtraClasses = selectFilterInputExtraClasses;
  protected readonly checkboxIndeterminateDashClasses =
    cascadeSelectCheckboxIndeterminateDashStyles;

  constructor() {
    super();
    effect(() => {
      if (this.isOpen()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });
    this.destroyRef.onDestroy(() => {
      this.destroyOverlay();
      while (this.flyoutHandles.length > 0) {
        this.flyoutHandles.pop()?.overlayRef.dispose();
      }
    });

    // Resyncs `flyoutHandles` (levels 1..N) to `levels()` after every
    // change — a full resync rather than a surgical diff, since it's O(depth)
    // per run (trivially cheap for a UI list) and is obviously correct where
    // a diff would need its own separate tests to trust.
    effect(() => {
      const current = this.levels();
      const neededFlyoutCount = Math.max(0, current.length - 1);

      while (this.flyoutHandles.length > neededFlyoutCount) {
        this.flyoutHandles.pop()?.overlayRef.dispose();
      }

      for (let k = this.flyoutHandles.length; k < neededFlyoutCount; k++) {
        const levelIndex = k + 1;
        // `levels()[levelIndex].anchorEl` is the row DOM element (in the
        // *previous* level) that this level's flyout is anchored to — set
        // by `drillInto` when the level was pushed. Not `levels()[levelIndex
        // - 1].anchorEl`, which is that PREVIOUS level's own anchor (always
        // null for the root) — an easy off-by-one to get backwards here.
        const anchor = current[levelIndex]?.anchorEl;
        if (!anchor) break; // shouldn't happen — stay defensive rather than throw
        const handle = this.overlayService.createConnectedOverlay(
          anchor,
          buildCascadePositions(),
          { hasBackdrop: false }, // only the root panel gets the backdrop that closes everything
        );
        handle.overlayRef.attach(
          new TemplatePortal(this.panelTemplate(), this.viewContainerRef, {
            levelIndex,
          }),
        );
        this.flyoutHandles.push({ ...handle, anchorEl: anchor });
      }
    });

    // Filtering replaces the nested-flyout view with a single flat list
    // rendered inside the root panel — any deeper flyouts (levels()[1..])
    // must close. Truncating levels() to length 1 here is sufficient: the
    // flyout-resync effect above already detaches/disposes any flyout
    // handle beyond what levels().length - 1 calls for, so no separate
    // "close flyouts" call is needed. levels()[0] itself stays populated
    // (its nodes/activeIndex become irrelevant while filtering, but the
    // template's own `@if (levels()[levelIndex ?? 0]; as level)` guard
    // needs it present to render the root panel at all).
    effect(() => {
      if (this.isFilterActive() && this.levels().length > 1) {
        this.levels.update((current) => current.slice(0, 1));
      }
    });
  }

  writeValue(value: TValue | TValue[] | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: TValue | TValue[] | null) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  protected triggerElRef(): ElementRef<HTMLElement> {
    return this.triggerEl();
  }

  protected panelTemplateRef(): TemplateRef<unknown> {
    return this.panelTemplate();
  }

  protected overlayPositions(): ConnectedPosition[] {
    return buildListboxPositions('bottom-start');
  }

  protected panelIdForLevel(levelIndex: number): string {
    return `${this.panelId}-level-${levelIndex}`;
  }

  protected rowId(levelIndex: number, index: number): string {
    return `${this.panelIdForLevel(levelIndex)}-row-${index}`;
  }

  protected isSelected(node: DynamoTreeNode<TValue>): boolean {
    return this.selectedValuesSet().has(nodeValue(node));
  }

  /** Only meaningful in `'checkbox'` mode — a branch's state is always derived from its children. */
  protected checkState(
    node: DynamoTreeNode<TValue>,
  ): DynamoCascadeSelectCheckState {
    return computeNodeCheckState(node, this.selectedValuesSet());
  }

  protected ariaCheckedAttr(
    node: DynamoTreeNode<TValue>,
  ): 'true' | 'false' | 'mixed' {
    const state = this.checkState(node);
    return state === 'checked'
      ? 'true'
      : state === 'indeterminate'
        ? 'mixed'
        : 'false';
  }

  protected checkboxIndicatorClasses(node: DynamoTreeNode<TValue>): string {
    return cn(
      cascadeSelectCheckboxIndicatorStyles({ state: this.checkState(node) }),
      this.ptFor('checkbox').class,
    );
  }

  protected rowClasses(
    node: DynamoTreeNode<TValue>,
    levelIndex: number,
    index: number,
  ): string {
    const level = this.levels()[levelIndex];
    return cn(
      cascadeSelectRowStyles({
        active: level?.activeIndex === index,
        selected: this.isSelected(node),
        disabled: !!node.disabled,
      }),
      this.ptFor('row').class,
    );
  }

  protected filterRowClasses(
    node: DynamoTreeNode<TValue>,
    index: number,
  ): string {
    return cn(
      cascadeSelectRowStyles({
        active: this.filterActiveIndex() === index,
        selected: this.isSelected(node),
        disabled: !!node.disabled,
      }),
      this.ptFor('row').class,
    );
  }

  protected onFilterRowActivate(index: number): void {
    const result = this.filteredResults()[index];
    if (!result || result.node.disabled) return;
    this.selectNode(result.node);
  }

  protected onFilterInputChange(value: string): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    this.filterText.set(value);
    // filteredResults() is read AFTER the set above, so it already reflects
    // the new query (signals recompute synchronously on read).
    const results = this.filteredResults();
    this.filterActiveIndex.set(
      findEnabledNodeIndex(
        results.map((r) => r.node),
        -1,
        1,
      ) ?? -1,
    );
    this.scrollActiveIntoView(0);
  }

  protected onFilterKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readOnly()) {
      return;
    }
    switch (event.key) {
      case 'Escape':
        event.preventDefault();
        if (this.filterText()) {
          // First Escape clears the filter and returns to normal
          // nested-flyout browsing — levels()[0] is already intact.
          this.filterText.set('');
        } else {
          this.close();
          this.triggerEl().nativeElement.focus();
        }
        break;
      case 'ArrowDown':
        event.preventDefault();
        this.moveFilterActive(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveFilterActive(-1);
        break;
      case 'Enter': {
        event.preventDefault();
        const result = this.filteredResults()[this.filterActiveIndex()];
        if (result) this.selectNode(result.node);
        break;
      }
      default:
        break;
    }
  }

  private moveFilterActive(delta: number): void {
    const results = this.filteredResults();
    const next = findEnabledNodeIndex(
      results.map((r) => r.node),
      this.filterActiveIndex(),
      delta,
    );
    if (next !== null) {
      this.filterActiveIndex.set(next);
      this.scrollActiveIntoView(0);
    }
  }

  protected toggle(): void {
    if (this.isDisabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.isDisabled()) return;
    this.openGenerationCounter++;
    this.isOpen.set(true);
    // Restoring the drilled path only makes sense in 'single' mode — "the"
    // path is ambiguous once a selection can span multiple scattered
    // branches, so 'multiple'/'checkbox' always reopen at the root,
    // matching this component's pre-Phase-1 behavior.
    const current = this.value();
    const restoreValue =
      this.selectionMode() === 'single' && !Array.isArray(current)
        ? current
        : null;
    const chain = this.buildAncestorChain(restoreValue);
    const root = chain[0];
    if (!root) return;
    this.levels.set([
      { nodes: root.nodes, activeIndex: root.activeIndex, anchorEl: null },
    ]);
    this.activeLevelIndex.set(0);
    this.scrollActiveIntoView(0);
    if (chain.length > 1) {
      this.restoreDrilledPath(chain);
    }
  }

  close(): void {
    this.openGenerationCounter++;
    this.isOpen.set(false);
    this.levels.set([]);
    this.activeLevelIndex.set(0);
    this.filterText.set('');
    this.filterActiveIndex.set(-1);
    this.typeahead.clear();
    this.onTouchedFn();
  }

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisabled() || this.readOnly()) return;
    const next = this.selectionMode() === 'single' ? null : [];
    this.value.set(next);
    this.onChangeFn(next);
  }

  /** Dispatches by `selectionMode()`. `'single'` replaces the value and closes the panel (the original,
   *  only-ever behavior). `'multiple'`/`'checkbox'` leave the panel open — picking one of several items
   *  shouldn't force a reopen for the next. */
  protected selectNode(node: DynamoTreeNode<TValue>): void {
    if (node.disabled || this.readOnly()) return;
    switch (this.selectionMode()) {
      case 'checkbox':
        this.toggleChecked(node);
        return;
      case 'multiple':
        this.toggleMultiple(node);
        return;
      case 'single':
      default: {
        const next = nodeValue(node);
        this.value.set(next);
        this.onChangeFn(next);
        this.itemSelect.emit(node);
        this.close();
        this.triggerEl().nativeElement.focus();
      }
    }
  }

  private toggleChecked(node: DynamoTreeNode<TValue>): void {
    const selectedValues = this.selectedValuesSet();
    const willCheck = shouldCascadeCheck(node, selectedValues);
    const next = new Set(selectedValues);
    for (const v of collectCascadeValues(node)) {
      if (willCheck) next.add(v);
      else next.delete(v);
    }
    this.value.set([...next]);
    this.onChangeFn([...next]);
    this.itemSelect.emit(node);
  }

  private toggleMultiple(node: DynamoTreeNode<TValue>): void {
    const v = nodeValue(node);
    const current = this.value();
    const arr = Array.isArray(current) ? current : [];
    const next = arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v];
    this.value.set(next);
    this.onChangeFn(next);
    this.itemSelect.emit(node);
  }

  protected isRowExpanded(levelIndex: number, index: number): boolean {
    const level = this.levels()[levelIndex];
    return (
      level?.activeIndex === index && this.levels().length > levelIndex + 1
    );
  }

  protected onRowHover(
    levelIndex: number,
    index: number,
    event?: MouseEvent,
  ): void {
    this.activeLevelIndex.set(levelIndex);
    this.drillInto(
      levelIndex,
      index,
      event?.currentTarget as HTMLElement | undefined,
    );
  }

  protected onRowActivate(levelIndex: number, index: number): void {
    const level = this.levels()[levelIndex];
    const node = level?.nodes[index];
    if (!node || node.disabled) return;
    if (this.selectionMode() !== 'single') {
      // Branch or leaf — toggle, never drill. Hover/ArrowRight remain the
      // sole drilling triggers in every mode, unchanged.
      this.selectNode(node);
      return;
    }
    if (node.children?.length) {
      this.onRowHover(levelIndex, index);
    } else {
      this.selectNode(node);
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (!this.isOpen()) {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          event.preventDefault();
          this.openPanel();
          break;
        default:
          this.handleClosedTypeahead(event);
          break;
      }
      return;
    }

    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level) return;

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
        this.moveActiveOnly(
          levelIndex,
          findEnabledNodeIndex(level.nodes, -1, 1) ?? -1,
        );
        break;
      case 'End':
        event.preventDefault();
        this.moveActiveOnly(
          levelIndex,
          findEnabledNodeIndex(level.nodes, level.nodes.length, -1) ?? -1,
        );
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const node = level.nodes[level.activeIndex];
        if (!node || node.disabled || !node.children?.length) break;
        this.scrollActiveIntoView(levelIndex);
        this.drillInto(levelIndex, level.activeIndex);
        this.activeLevelIndex.set(levelIndex + 1);
        this.scrollActiveIntoView(levelIndex + 1);
        this.typeahead.clear();
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (levelIndex === 0) break;
        this.levels.update((current) => current.slice(0, levelIndex));
        this.activeLevelIndex.set(levelIndex - 1);
        this.scrollActiveIntoView(levelIndex - 1);
        this.typeahead.clear();
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const node = level.nodes[level.activeIndex];
        if (!node) break;
        if (this.selectionMode() !== 'single') {
          this.selectNode(node);
          break;
        }
        if (node.children?.length) {
          this.scrollActiveIntoView(levelIndex);
          this.drillInto(levelIndex, level.activeIndex);
          this.activeLevelIndex.set(levelIndex + 1);
          this.scrollActiveIntoView(levelIndex + 1);
          this.typeahead.clear();
        } else {
          this.selectNode(node);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        this.triggerEl().nativeElement.focus();
        break;
      default:
        this.handleOpenTypeahead(event, levelIndex, level);
        break;
    }
  }

  // Typeahead only applies to the non-filterable path — once `filterable()`
  // is true, the filter box's own `onFilterKeydown` supersedes it, same
  // gating TreeSelect's own `handleTypeahead` already established.
  private handleClosedTypeahead(event: KeyboardEvent): void {
    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.filterable()
    ) {
      return;
    }
    const buffer = this.typeahead.append(event.key);
    const query = resolveTypeaheadQuery(buffer);
    const match = findTypeaheadMatch(this.nodes(), -1, query);
    if (match === null) return;
    event.preventDefault();
    this.openPanel();
    this.moveActiveOnly(0, match);
  }

  private handleOpenTypeahead(
    event: KeyboardEvent,
    levelIndex: number,
    level: DynamoCascadeLevel<TValue>,
  ): void {
    if (
      event.key.length !== 1 ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      this.filterable()
    ) {
      return;
    }
    const buffer = this.typeahead.append(event.key);
    const query = resolveTypeaheadQuery(buffer);
    const match = findTypeaheadMatch(level.nodes, level.activeIndex, query);
    if (match === null) return;
    event.preventDefault();
    this.moveActiveOnly(levelIndex, match);
  }

  private moveActive(delta: number): void {
    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level) return;
    const next = findEnabledNodeIndex(level.nodes, level.activeIndex, delta);
    if (next !== null) this.moveActiveOnly(levelIndex, next);
  }

  // Moves the active row within a level, truncating any deeper levels first
  // (moving off a drilled row must close its flyout) — but does NOT open a
  // new flyout for the newly active row. Used by Up/Down/Home/End (all
  // keyboard-driven), so scrolling the virtualized viewport here is safe —
  // the hover path (`onRowHover`) goes through `drillInto`, never here.
  private moveActiveOnly(levelIndex: number, index: number): void {
    this.levels.update((current) => {
      const next = current.slice(0, levelIndex + 1);
      const level = next[levelIndex];
      if (!level) return current;
      next[levelIndex] = { ...level, activeIndex: index };
      return next;
    });
    this.scrollActiveIntoView(levelIndex);
  }

  /**
   * Scrolls level `levelIndex`'s virtualized viewport so its `activeIndex`
   * row is actually rendered — load-bearing once virtualized, since an
   * off-screen active row may not exist in the DOM and `activeDescendantId`
   * would dangle. Called only from keyboard-driven sites (openPanel /
   * moveActiveOnly / Arrow drill-in-out) — never from `onRowHover` /
   * `drillInto`, which are the mouse path: CDK's `scrollToIndex` is an
   * unconditional absolute scroll, so a hover-driven call would jump the
   * panel on every mouseover.
   */
  private scrollActiveIntoView(levelIndex: number): void {
    if (!this.isVirtualized()) return;
    if (this.isFilterActive()) {
      // Only one virtual-scroll instance exists while filtering — the root
      // panel's, now bound to filteredResults() instead of level.nodes.
      // levels() stays truncated to length 1 whenever filtering is active
      // (see the constructor effect), so virtualScrollRefs()[0] is still
      // the correct (and only) ref to scroll.
      if (levelIndex !== 0 || this.filterActiveIndex() < 0) return;
      this.virtualScrollRefs()[0]?.scrollToIndex(this.filterActiveIndex());
      return;
    }
    const level = this.levels()[levelIndex];
    if (!level || level.activeIndex < 0) return;
    this.virtualScrollRefs()[levelIndex]?.scrollToIndex(level.activeIndex);
  }

  // Sets the active row within a level AND opens its child flyout if it has
  // children, truncating any deeper levels first. Used by hover, ArrowRight,
  // and Enter/Space on a branch row. `explicitAnchor` lets the mouse path
  // (onRowHover) hand over the real DOM element straight from the triggering
  // MouseEvent — a mouseenter can only ever fire on an element already in
  // the DOM, so this sidesteps the racy post-hoc `getRowElement` ID lookup
  // entirely for that path (the lookup can return null for a row that's
  // hovered before a virtualized viewport has mounted it yet).
  private drillInto(
    levelIndex: number,
    index: number,
    explicitAnchor?: HTMLElement,
  ): void {
    const anchor = explicitAnchor ?? this.getRowElement(levelIndex, index);
    this.levels.update((current) => {
      const next = current.slice(0, levelIndex + 1);
      const level = next[levelIndex];
      if (!level) return current;
      next[levelIndex] = { ...level, activeIndex: index };
      const node = level.nodes[index];
      if (node && !node.disabled && node.children?.length) {
        const childNodes = node.children;
        // Seed the new level's active row to its first enabled item (not
        // -1) — otherwise a subsequent ArrowRight/Enter at this level has no
        // active row to act on, since keyboard nav (unlike a fresh
        // openPanel()) has no other point where this gets seeded.
        const seededActive = findEnabledNodeIndex(childNodes, -1, 1) ?? -1;
        next.push({
          nodes: childNodes,
          activeIndex: seededActive,
          anchorEl: anchor,
        });
      }
      return next;
    });
  }

  private getRowElement(levelIndex: number, index: number): HTMLElement | null {
    const doc = this.triggerEl().nativeElement.ownerDocument;
    return doc.getElementById(this.rowId(levelIndex, index));
  }

  // Walks from the root down `value`'s ancestor chain, purely from `nodes()`
  // data — no DOM involved, so this is always safe to call synchronously.
  // Returns one entry per level from the root to `value`'s own leaf (or, if
  // `value` is null/not found, a single root-only entry). `openPanel` seeds
  // `levels()[0]` from `chain[0]` synchronously; any further entries are
  // opened progressively by `restoreDrilledPath`, since each one needs the
  // previous level's row DOM element to exist first — see that method's own
  // doc comment.
  private buildAncestorChain(
    forValue: TValue | null,
  ): { nodes: DynamoTreeNode<TValue>[]; activeIndex: number }[] {
    const chain: { nodes: DynamoTreeNode<TValue>[]; activeIndex: number }[] =
      [];
    let currentNodes = this.nodes();
    if (forValue == null) {
      return [
        {
          nodes: currentNodes,
          activeIndex: findEnabledNodeIndex(currentNodes, -1, 1) ?? -1,
        },
      ];
    }
    for (;;) {
      const index = currentNodes.findIndex((node) =>
        containsValue(node, forValue),
      );
      if (index < 0) {
        if (chain.length === 0) {
          chain.push({
            nodes: currentNodes,
            activeIndex: findEnabledNodeIndex(currentNodes, -1, 1) ?? -1,
          });
        }
        break;
      }
      chain.push({ nodes: currentNodes, activeIndex: index });
      const node = currentNodes[index];
      if (!node?.children?.length || nodeValue(node) === forValue) break;
      currentNodes = node.children;
    }
    return chain;
  }

  // Progressively opens every level in `chain` beyond the root (already
  // seeded synchronously by `openPanel`), one confirmed-mounted level at a
  // time — reusing `DynamoTree.focusRow`'s own bounded
  // `requestAnimationFrame`-poll pattern (a single `afterNextRender` was
  // tried there first and found insufficient: CDK's own mount after
  // `scrollToIndex` settles over several render passes, not just the next
  // one, which applies here too once a level is virtualized). `generation`
  // guards against a rapid close -> reopen racing a still-in-flight poll
  // from the PREVIOUS open — a real hazard now that this spans multiple
  // frames, unlike the rest of this file's fully-synchronous level changes.
  private restoreDrilledPath(
    chain: { nodes: DynamoTreeNode<TValue>[]; activeIndex: number }[],
  ): void {
    const generation = this.openGenerationCounter;
    this.advanceDrilledPath(chain, 1, generation);
  }

  private advanceDrilledPath(
    chain: { nodes: DynamoTreeNode<TValue>[]; activeIndex: number }[],
    step: number,
    generation: number,
  ): void {
    if (step >= chain.length) return;
    this.pollForAnchorAndAdvance(chain, step, generation, 20);
  }

  // If the walk stalls (a disabled ancestor row, a row that never mounts),
  // it stops silently at the deepest confirmed level once `framesLeft`
  // expires — degrading to the pre-Phase-1 root-only-with-the-right-branch-
  // highlighted behavior in the worst case, never a broken half-open state,
  // matching this file's existing defensive posture elsewhere (the
  // flyout-resync effect's own `if (!anchor) break;`).
  private pollForAnchorAndAdvance(
    chain: { nodes: DynamoTreeNode<TValue>[]; activeIndex: number }[],
    step: number,
    generation: number,
    framesLeft: number,
  ): void {
    if (
      framesLeft <= 0 ||
      generation !== this.openGenerationCounter ||
      !this.isOpen()
    ) {
      return;
    }
    requestAnimationFrame(() => {
      if (generation !== this.openGenerationCounter || !this.isOpen()) return;
      // Deliberately called here, inside the rAF callback, rather than
      // synchronously before scheduling it — `openPanel()`'s own effect
      // (which attaches the overlay and mounts level `step - 1`'s virtual-
      // scroll viewport, when virtualized) hasn't necessarily run yet at
      // the point this poll is first kicked off, since Angular's `effect()`
      // always flushes asynchronously relative to the signal write that
      // triggered it — by the time ANY `requestAnimationFrame` callback
      // fires, that effect is guaranteed to have already run, so the
      // viewport ref `scrollActiveIntoView` reads is reliably populated
      // here, unlike at the call site in `advanceDrilledPath`.
      this.scrollActiveIntoView(step - 1);
      const prevLevel = this.levels()[step - 1];
      const anchor = prevLevel
        ? this.getRowElement(step - 1, prevLevel.activeIndex)
        : null;
      if (!anchor) {
        this.pollForAnchorAndAdvance(chain, step, generation, framesLeft - 1);
        return;
      }
      const entry = chain[step];
      if (!entry) return;
      this.levels.update((current) => [
        ...current.slice(0, step),
        {
          nodes: entry.nodes,
          activeIndex: entry.activeIndex,
          anchorEl: anchor,
        },
      ]);
      this.activeLevelIndex.set(step);
      this.scrollActiveIntoView(step);
      this.advanceDrilledPath(chain, step + 1, generation);
    });
  }
}
