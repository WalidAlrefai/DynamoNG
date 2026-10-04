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
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { DynamoCheckIcon } from '@dynamong/icons';
import type { DynamoTreeNode } from '@dynamong/tree';
import type { DynamoSize } from '@dynamong/core/api';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
} from '@dynamong/utils/typeahead';
import {
  treeSelectCheckboxIndicatorStyles,
  treeSelectCheckboxIndeterminateDashStyles,
  treeSelectExpandButtonStyles,
  treeSelectExpandIconStyles,
  treeSelectExpandSpacerStyles,
  treeSelectRowStyles,
} from './tree-select.styles';
import type {
  DynamoTreeSelectPart,
  DynamoTreeSelectSelectionMode,
} from './tree-select.types';

interface DynamoTreeSelectEntry<TValue> {
  node: DynamoTreeNode<TValue>;
  depth: number;
  parentId: string | null;
}

// Depth-first walk of `nodes`, skipping the children of any node whose id
// isn't in `expandedIds` — same algorithm as DynamoTree's own `visibleEntries`
// (that implementation isn't exported, so this is a fresh, simpler
// reimplementation with no checkbox/cascade concerns).
function flattenVisibleNodes<TValue>(
  nodes: DynamoTreeNode<TValue>[],
  expandedIds: string[],
): DynamoTreeSelectEntry<TValue>[] {
  const result: DynamoTreeSelectEntry<TValue>[] = [];
  const walk = (
    list: DynamoTreeNode<TValue>[],
    depth: number,
    parentId: string | null,
  ): void => {
    for (const node of list) {
      result.push({ node, depth, parentId });
      if (node.children?.length && expandedIds.includes(node.id)) {
        walk(node.children, depth + 1, node.id);
      }
    }
  };
  walk(nodes, 0, null);
  return result;
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

// Mirrors Select's `findEnabledIndex` shape (linear scan, skip disabled, no
// wrap) — reimplemented locally since Select's version lives in
// `select-option-filter.ts`, which is option-shape-specific.
function findEnabledEntryIndex<TValue>(
  entries: DynamoTreeSelectEntry<TValue>[],
  current: number,
  delta: number,
): number | null {
  let index = current + delta;
  while (index >= 0 && index < entries.length) {
    if (!entries[index]?.node.disabled) {
      return index;
    }
    index += delta;
  }
  return null;
}

function nodeMatchesFilter<TValue>(
  node: DynamoTreeNode<TValue>,
  query: string,
): boolean {
  return node.label.toLowerCase().includes(query);
}

function subtreeMatchesFilter<TValue>(
  node: DynamoTreeNode<TValue>,
  query: string,
): boolean {
  if (nodeMatchesFilter(node, query)) return true;
  return !!node.children?.some((child) => subtreeMatchesFilter(child, query));
}

// Ids of every branch that must be force-expanded to keep a matching
// descendant visible, regardless of the user's own `expandedIds` selection —
// a branch that itself matches only reveals its children when the user has
// actually expanded it.
function collectForcedExpandedIds<TValue>(
  nodes: DynamoTreeNode<TValue>[],
  query: string,
): Set<string> {
  const ids = new Set<string>();
  const visit = (list: DynamoTreeNode<TValue>[]): boolean => {
    let anyMatch = false;
    for (const node of list) {
      const childMatches = node.children?.length ? visit(node.children) : false;
      if (childMatches) ids.add(node.id);
      if (nodeMatchesFilter(node, query) || childMatches) anyMatch = true;
    }
    return anyMatch;
  };
  visit(nodes);
  return ids;
}

// Same depth-first walk as `flattenVisibleNodes`, but skips branches with no
// match anywhere in their subtree and relies on `isNodeExpanded` (which
// already folds in `collectForcedExpandedIds`) to decide what to descend into.
function flattenFilteredNodes<TValue>(
  nodes: DynamoTreeNode<TValue>[],
  isNodeExpanded: (id: string) => boolean,
  query: string,
): DynamoTreeSelectEntry<TValue>[] {
  const result: DynamoTreeSelectEntry<TValue>[] = [];
  const walk = (
    list: DynamoTreeNode<TValue>[],
    depth: number,
    parentId: string | null,
  ): void => {
    for (const node of list) {
      if (!subtreeMatchesFilter(node, query)) continue;
      result.push({ node, depth, parentId });
      if (node.children?.length && isNodeExpanded(node.id)) {
        walk(node.children, depth + 1, node.id);
      }
    }
  };
  walk(nodes, 0, null);
  return result;
}

type DynamoTreeSelectCheckState = 'checked' | 'unchecked' | 'indeterminate';

// Local, value-keyed port of `@dynamong/tree`'s own `tree-selection.ts`
// algorithm (not exported from that package's public API, so this is a
// reimplementation — same precedent as `flattenVisibleNodes`/
// `findEnabledEntryIndex` above). Keyed by `nodeValue(node)` instead of
// `node.id`: TreeSelect's `value` model is value-based, not id-based, so
// this sidesteps needing any id<->value bridging. The cascade logic itself
// (a branch's displayed state is always derived from its children, never
// stored; only downward cascade is materialized into `value`; disabled
// nodes and their subtrees are skipped) is unchanged from the original.
function computeNodeCheckState<TValue>(
  node: DynamoTreeNode<TValue>,
  selectedValues: ReadonlySet<TValue>,
): DynamoTreeSelectCheckState {
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
// subtree — deliberately ignores disabled descendants entirely, so a branch
// with any disabled, unchecked descendant doesn't get stuck permanently
// indeterminate (which would make its checkbox always decide to check).
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

@Component({
  selector: 'dg-tree-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    DynamoInputText,
    DynamoSpinner,
    DynamoVirtualScroll,
    DynamoCheckIcon,
    DynamoPassThroughDirective,
  ],
  templateUrl: './tree-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoTreeSelect),
      multi: true,
    },
  ],
})
export class DynamoTreeSelect<TValue = string>
  extends DynamoListboxBase<DynamoTreeSelectPart>
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
  /** Associates the trigger with an external help/error message element via `aria-describedby`. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `true` to match every existing consumer's
   *  assumption of a full-width trigger; set `false` for PrimeNG-style intrinsic sizing. */
  readonly fluid = input(true);
  /** Two-way bindable: which branch node ids are currently expanded. */
  readonly expandedIds = model<string[]>([]);
  /** `'single'` (default) is TreeSelect's original, only-ever behavior — a plain scalar `value`,
   *  replaced on each pick, panel closes on commit. `'multiple'`/`'checkbox'` are new, non-default
   *  modes that make `value` an array: `'multiple'` toggles plain membership via a bare click (no
   *  modifier key); `'checkbox'` cascades tri-state to enabled descendants, mirroring `DynamoTree`'s
   *  own `selectionMode='checkbox'` default — see the README's Design notes. */
  readonly selectionMode = input<DynamoTreeSelectSelectionMode>('single');
  /** Two-way bindable; also driven by Angular forms via `writeValue`. A plain `TValue | null` in
   *  `'single'` mode; `TValue[] | null` in `'multiple'`/`'checkbox'` mode. */
  readonly value = model<TValue | TValue[] | null>(null);
  /** Fires once a node is committed (click or keyboard Enter/Space) with the full node object. */
  readonly itemSelect = output<DynamoTreeNode<TValue>>();
  /**
   * Opt-in — renders the visible-entry list through `@dynamong/virtual-scroll`
   * instead of a plain `@for`, for large trees. `visibleEntries()` is already
   * a flat, post-expand/collapse array, and every `treeitem` row is the same
   * height (depth is `padding-left`, not extra height), so fixed-size
   * virtualization applies with no grouping caveat.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized — matched to `treeSelectRowStyles`' actual rendered height. */
  readonly virtualScrollItemSize = input(36);
  /** Viewport height in px when virtualized — matches `selectPanelWrapperStyles`' own `max-h-60` (240px). */
  readonly virtualScrollHeight = input(240);
  /** HTML `readonly` semantics: the trigger stays focusable and the panel
   *  still opens for browsing, but committing a node is blocked. Unlike
   *  `disabled`, doesn't dim it or remove it from the tab order. */
  readonly readOnly = input(false);
  /** Shows a clear (×) button next to the trigger once a value is selected — mirrors `DynamoCascadeSelect`'s own `clearable`. */
  readonly clearable = input(false);
  /** Opt-in filter box rendered above the tree — mirrors `DynamoSelect`'s `filterable`. Matching branches auto-reveal regardless of `expandedIds`. */
  readonly filterable = input(false);
  readonly filterText = model('');
  readonly filterPlaceholder = input('Search...');
  /** Shown when `nodes()` is non-empty but the filter matched nothing. */
  readonly noResultsMessage = input('No matching options');

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly virtualScrollRef = viewChild(DynamoVirtualScroll);

  protected readonly panelId = this.idGenerator.next('dg-tree-select-panel');

  private onChangeFn: (value: TValue | TValue[] | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };
  private readonly typeahead = createTypeaheadBuffer();

  protected readonly activeFilterQuery = computed(() =>
    this.filterable() ? this.filterText().trim().toLowerCase() : '',
  );
  private readonly forcedExpandedIds = computed(() => {
    const query = this.activeFilterQuery();
    return query ? collectForcedExpandedIds(this.nodes(), query) : null;
  });
  protected readonly visibleEntries = computed(() => {
    const query = this.activeFilterQuery();
    return query
      ? flattenFilteredNodes(this.nodes(), (id) => this.isExpanded(id), query)
      : flattenVisibleNodes(this.nodes(), this.expandedIds());
  });
  /** Distinct from a genuinely empty `nodes()`, which renders no message. */
  protected readonly showNoResults = computed(
    () =>
      this.nodes().length > 0 &&
      this.activeFilterQuery() !== '' &&
      this.visibleEntries().length === 0,
  );
  protected readonly isVirtualized = computed(() => this.virtualScroll());
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
  /** Every currently-selected node, in tree order — used for `'multiple'`/`'checkbox'`'s
   *  comma-joined trigger label. */
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
  protected readonly activeEntryId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.entryId(index) : null;
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
    cn(
      this.isVirtualized()
        ? selectPanelWrapperVirtualStyles
        : selectPanelWrapperStyles,
      this.ptFor('panel').class,
    ),
  );
  protected readonly expandButtonClasses = computed(() =>
    cn(treeSelectExpandButtonStyles, this.ptFor('expandButton').class),
  );
  protected readonly expandSpacerClasses = treeSelectExpandSpacerStyles;
  protected readonly noResultsClasses = computed(() =>
    cn('px-3 py-2 text-sm text-text-muted', this.ptFor('no-results').class),
  );
  protected readonly filterWrapperClasses = selectFilterWrapperStyles;
  protected readonly filterFieldWrapperClasses = selectFilterFieldWrapperStyles;
  protected readonly filterIconClasses = selectFilterIconStyles;
  protected readonly filterInputExtraClasses = selectFilterInputExtraClasses;
  protected readonly checkboxIndeterminateDashClasses =
    treeSelectCheckboxIndeterminateDashStyles;

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

  protected entryId(index: number): string {
    return `${this.panelId}-entry-${index}`;
  }

  protected isExpanded(id: string): boolean {
    return (
      this.expandedIds().includes(id) || !!this.forcedExpandedIds()?.has(id)
    );
  }

  protected isSelected(node: DynamoTreeNode<TValue>): boolean {
    return this.selectedValuesSet().has(nodeValue(node));
  }

  /** Only meaningful in `'checkbox'` mode — a branch's state is always derived from its children. */
  protected checkState(
    node: DynamoTreeNode<TValue>,
  ): DynamoTreeSelectCheckState {
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
      treeSelectCheckboxIndicatorStyles({ state: this.checkState(node) }),
      this.ptFor('checkbox').class,
    );
  }

  protected rowClasses(
    entry: DynamoTreeSelectEntry<TValue>,
    index: number,
  ): string {
    return cn(
      treeSelectRowStyles({
        active: index === this.activeIndex(),
        selected: this.isSelected(entry.node),
        disabled: !!entry.node.disabled,
      }),
      this.ptFor('row').class,
    );
  }

  protected expandIconClasses(id: string): string {
    return treeSelectExpandIconStyles({ expanded: this.isExpanded(id) });
  }

  protected toggle(): void {
    if (this.isDisabled()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.isDisabled()) {
      return;
    }
    this.isOpen.set(true);
    const entries = this.visibleEntries();
    const selectedIndex = entries.findIndex((entry) =>
      this.isSelected(entry.node),
    );
    this.activeIndex.set(
      selectedIndex >= 0
        ? selectedIndex
        : (findEnabledEntryIndex(entries, -1, 1) ?? -1),
    );
    this.scrollActiveIntoView();
  }

  protected close(): void {
    this.isOpen.set(false);
    this.filterText.set('');
    this.typeahead.clear();
    this.onTouchedFn();
  }

  protected toggleExpanded(id: string, event: Event): void {
    event.stopPropagation();
    this.expandedIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  /** Dispatches by `selectionMode()`. `'single'` replaces the value and closes the panel (the original,
   *  only-ever behavior). `'multiple'`/`'checkbox'` leave the panel open — picking one of several items
   *  shouldn't force a reopen for the next, mirroring `DynamoMultiSelect`'s own panel behavior. */
  protected selectNode(node: DynamoTreeNode<TValue>): void {
    if (node.disabled || this.readOnly()) {
      return;
    }
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

  protected clearValue(event: MouseEvent): void {
    event.stopPropagation();
    if (this.isDisabled() || this.readOnly()) return;
    const next = this.selectionMode() === 'single' ? null : [];
    this.value.set(next);
    this.onChangeFn(next);
  }

  // All keyboard handling — both closed-state "open the panel" and
  // open-state navigation — lives here, on the trigger's own keydown, not
  // split off into a separate panel-level handler: focus never actually
  // moves off the trigger button into the panel (rows are `tabindex="-1"`,
  // nothing calls `.focus()` on them), so a handler bound to the panel
  // would simply never receive these events. Mirrors `DynamoSelect`'s
  // `onTriggerKeydown`, which does the same for the same reason.
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
          this.handleTypeahead(event);
          break;
      }
      return;
    }

    const entries = this.visibleEntries();
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
        this.activeIndex.set(findEnabledEntryIndex(entries, -1, 1) ?? -1);
        this.scrollActiveIntoView();
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(
          findEnabledEntryIndex(entries, entries.length, -1) ?? -1,
        );
        this.scrollActiveIntoView();
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const entry = entries[this.activeIndex()];
        if (!entry) break;
        const hasChildren = !!entry.node.children?.length;
        if (hasChildren && !this.isExpanded(entry.node.id)) {
          this.expandedIds.update((ids) => [...ids, entry.node.id]);
        } else if (hasChildren) {
          const activeIndex = this.activeIndex();
          const next = entries.findIndex(
            (candidate, i) =>
              i > activeIndex && candidate.parentId === entry.node.id,
          );
          if (next >= 0) {
            this.activeIndex.set(next);
            this.scrollActiveIntoView();
          }
        }
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        const entry = entries[this.activeIndex()];
        if (!entry) break;
        if (entry.node.children?.length && this.isExpanded(entry.node.id)) {
          this.expandedIds.update((ids) =>
            ids.filter((x) => x !== entry.node.id),
          );
        } else if (entry.parentId) {
          const parentIndex = entries.findIndex(
            (candidate) => candidate.node.id === entry.parentId,
          );
          if (parentIndex >= 0) {
            this.activeIndex.set(parentIndex);
            this.scrollActiveIntoView();
          }
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const active = entries[this.activeIndex()];
        if (active) this.selectNode(active.node);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        break;
      default:
        this.handleTypeahead(event);
        break;
    }
  }

  protected onFilterInputChange(value: string): void {
    this.filterText.set(value);
    const entries = this.visibleEntries();
    this.activeIndex.set(findEnabledEntryIndex(entries, -1, 1) ?? -1);
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
        const active = this.visibleEntries()[this.activeIndex()];
        if (active) this.selectNode(active.node);
        break;
      }
    }
  }

  /** Typeahead only applies to the non-filterable path — once `filterable()` is true, the filter box's own `onFilterKeydown` supersedes it. */
  private handleTypeahead(event: KeyboardEvent): void {
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
    const entries = this.visibleEntries();
    const match = findTypeaheadMatch(
      entries.map((entry) => entry.node),
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
    const next = findEnabledEntryIndex(
      this.visibleEntries(),
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
   * "active" entry may not exist in the DOM at all, and
   * `aria-activedescendant` (`activeEntryId`) would point at a nonexistent
   * id without this. Called explicitly only from keyboard-driven moves
   * (openPanel/moveActive/Home/End/Arrow expand-collapse) — deliberately
   * NOT from the `(mouseenter)="activeIndex.set(i)"` hover handler in
   * tree-select.html. CDK's own `scrollToIndex` is an unconditional
   * absolute scroll (always jumps so the target index lands at the very
   * top — not a "scroll into view only if needed" call), so calling it on
   * every `activeIndex` change including hover would visibly jump the panel
   * on every hover.
   */
  private scrollActiveIntoView(): void {
    if (!this.isVirtualized()) return;
    const index = this.activeIndex();
    if (index >= 0) this.virtualScrollRef()?.scrollToIndex(index);
  }
}
