import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type TemplateRef,
  computed,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoSpinner } from '@dynamong/spinner';
import { DynamoVirtualScroll } from '@dynamong/virtual-scroll';
import { cn } from '@dynamong/utils/class-merge';
import {
  createTypeaheadBuffer,
  findTypeaheadMatch,
  resolveTypeaheadQuery,
} from '@dynamong/utils/typeahead';
import { filterTree } from './tree.filter';
import { DynamoTreeItem } from './tree-item';
import { isTreeNodeExpandable } from './tree-node';
import {
  collectCascadeIds,
  computeNodeCheckState,
  shouldCascadeCheck,
} from './tree-selection';
import { DynamoTreeState } from './tree-state';
import {
  treeEmptyStateStyles,
  treeFilterWrapperStyles,
  treeStyles,
  treeVirtualStyles,
  treeWrapperStyles,
} from './tree.styles';
import type {
  DynamoTreeNode,
  DynamoTreeNodeContext,
  DynamoTreePart,
  DynamoTreeSelectionMode,
} from './tree.types';

interface DynamoTreeEntry {
  node: DynamoTreeNode;
  depth: number;
  parentId: string | undefined;
  posinset: number;
  setsize: number;
}

@Component({
  selector: 'dg-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoSpinner,
    DynamoTreeItem,
    DynamoInputText,
    DynamoPassThroughDirective,
    DynamoVirtualScroll,
  ],
  providers: [DynamoTreeState],
  templateUrl: './tree.html',
})
export class DynamoTree extends DynamoBaseComponent<DynamoTreePart> {
  readonly items = input.required<DynamoTreeNode[]>();
  /** Two-way bindable: which node ids are currently expanded. */
  readonly expandedIds = model<string[]>([]);
  /**
   * Two-way bindable. In the default `'checkbox'` mode: every node id (leaf
   * or branch) currently fully checked. In `'single'`/`'multiple'` mode:
   * the plain (non-cascading) selected id(s) — see `selectionMode`'s own
   * doc comment.
   */
  readonly selected = model<string[]>([]);
  /** `'checkbox'` (default) is the original always-cascading tri-state model. `'single'`/`'multiple'` are new non-cascading modes — see Design notes. */
  readonly selectionMode = input<DynamoTreeSelectionMode>('checkbox');
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Controls the root wrapper's width — `true` (default) is `w-full`; `false` shrinks to content. */
  readonly fluid = input(true);
  /** Shown in place of the tree when `items()` is empty. */
  readonly emptyMessage = input('No data');
  /** Renders a spinner + message in the empty-state slot and makes
   *  expand/collapse, checking, and row activation non-interactive. Never
   *  emits back — the consumer drives it. */
  readonly loading = input(false);
  /** Shown in the empty-state slot instead of `emptyMessage` while `loading` is true. */
  readonly loadingMessage = input('Loading…');
  /**
   * Opt-in virtual scrolling over `visibleEntries()` (the already flat,
   * expand-state-aware row list — `tree.html` feeds it straight into
   * `<dg-virtual-scroll>`, reusing the exact same `DynamoTreeItem` that
   * renders the normal recursive path, just with `renderChildren` off) via
   * `@dynamong/virtual-scroll`. Unlike `@dynamong/tree-table`'s own
   * `virtualScroll`, no tier bump was needed here — `virtual-scroll` is
   * `tier:0`, Tree stays `tier:1`.
   */
  readonly virtualScroll = input(false);
  /** Row height in px when virtualized. */
  readonly virtualScrollItemSize = input(40);
  /** Viewport height in px when virtualized. */
  readonly virtualScrollHeight = input(400);
  /** Custom per-node content (icon/label/whatever), replacing the default plain-`label` rendering when supplied. */
  readonly nodeTemplate = input<TemplateRef<DynamoTreeNodeContext> | undefined>(
    undefined,
  );
  /** Fires on Enter/Space or a row click — independent of checkbox toggling. */
  readonly nodeActivate = output<DynamoTreeNode>();
  /** Fires once per node a user directly checks/unchecks with the full node object — not once per cascaded descendant. */
  readonly itemSelect = output<DynamoTreeNode>();
  /** Fires when a node is expanded and it's expandable (`leaf: false` or
   *  has `children`) but has no `children` loaded yet — the consumer's cue
   *  to fetch and patch them into their own `items()` array. Never fires
   *  again for that node once it has `children` (whether patched in by the
   *  consumer, or the node was never lazy to begin with). */
  readonly nodeExpand = output<DynamoTreeNode>();

  /**
   * Opt-in global filter. `false` (default) renders no search UI at all —
   * byte-for-byte identical to pre-filter behavior. Mirrors Table's/
   * TreeTable's own `filterable`.
   */
  readonly filterable = input(false);
  /** Placeholder text for the search input rendered when `filterable` is `true`. */
  readonly filterPlaceholder = input('Search...');
  /**
   * Two-way bindable filter query — mirrors Table's/TreeTable's own
   * `filterText`. Case-insensitive substring match against `label`;
   * blank/whitespace-only text matches every node.
   */
  readonly filterText = model('');
  /** Shown in the empty-state slot instead of `emptyMessage` when `items` has nodes but the active `filterText` matched none of them. */
  readonly noMatchesMessage = input('No matching results');

  private readonly activeIdSignal = signal<string | undefined>(undefined);
  private readonly treeState = inject(DynamoTreeState);
  private readonly typeahead = createTypeaheadBuffer();
  private readonly elementRef: ElementRef<HTMLElement> = inject(ElementRef);
  private readonly virtualScrollRef = viewChild(DynamoVirtualScroll);

  protected readonly wrapperClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          treeWrapperStyles({ fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly treeClasses = computed(() =>
    cn(treeStyles, this.ptFor('tree').class),
  );
  protected readonly emptyStateClasses = computed(() =>
    cn(treeEmptyStateStyles, this.ptFor('emptyState').class),
  );
  protected readonly filterWrapperClasses = computed(() =>
    cn(treeFilterWrapperStyles, this.ptFor('filterWrapper').class),
  );
  protected readonly treeVirtualClasses = computed(() =>
    cn(treeVirtualStyles, this.ptFor('tree').class),
  );

  /** Plain alias, not a `disabled`-merge — Tree has no `disabled` input of its own to merge with. */
  protected readonly isBusy = computed(() => this.loading());

  private readonly selectedSet = computed(() => new Set(this.selected()));

  /** `false` in `'single'` mode (ARIA requires it reflect the real constraint); `true` otherwise — `'checkbox'`'s cascading model and `'multiple'` both allow more than one selected node. */
  protected readonly ariaMultiselectable = computed(
    () => this.selectionMode() !== 'single',
  );

  /**
   * `items()` pruned to hierarchy-matching branches — see `filterTree`'s
   * own doc comment. Returns `items()` unchanged (same reference) when
   * `filterText` is blank/whitespace-only.
   */
  protected readonly filteredItems = computed(() =>
    filterTree(this.items(), this.filterText()),
  );

  /** True while a non-blank filter is narrowing `filteredItems()` — used by `isEffectivelyExpanded` to force every retained node open, and by `emptyStateMessage` to pick the right empty-state wording. */
  protected readonly isFilterActive = computed(
    () => this.filterText().trim().length > 0,
  );

  /**
   * Picks which empty-state message to show — mirrors Table's/TreeTable's
   * own `emptyStateMessage` exactly: `items()` itself empty always wins
   * with `emptyMessage()` regardless of an active-but-irrelevant filter;
   * otherwise an active filter that matched nothing gets
   * `noMatchesMessage()`.
   */
  protected readonly emptyStateMessage = computed(() =>
    this.isFilterActive() && this.items().length > 0
      ? this.noMatchesMessage()
      : this.emptyMessage(),
  );

  // Depth-first, skipping children of collapsed nodes — a pure data walk,
  // not a DOM query, so it isn't blocked by DynamoTreeItem's recursive
  // component boundaries the way viewChildren()/contentChildren() would be.
  // Walks `filteredItems()`, not raw `items()`, and treats every node as
  // expanded while a filter is active (see `isEffectivelyExpanded`).
  protected readonly visibleEntries = computed<DynamoTreeEntry[]>(() => {
    const result: DynamoTreeEntry[] = [];
    const expanded = new Set(this.expandedIds());
    const walk = (
      nodes: readonly DynamoTreeNode[],
      depth: number,
      parentId: string | undefined,
    ) => {
      nodes.forEach((node, i) => {
        result.push({
          node,
          depth,
          parentId,
          posinset: i + 1,
          setsize: nodes.length,
        });
        if (
          node.children?.length &&
          this.isEffectivelyExpanded(node.id, expanded)
        ) {
          walk(node.children, depth + 1, node.id);
        }
      });
    };
    walk(this.filteredItems(), 0, undefined);
    return result;
  });

  // The roving tab stop: an explicitly-set id if it's still visible and
  // enabled, otherwise the first enabled visible entry — so exactly one row
  // is always reachable via Tab, even before any interaction.
  protected readonly activeEntryId = computed(() => {
    const entries = this.visibleEntries();
    if (entries.length === 0) {
      return undefined;
    }
    const explicit = this.activeIdSignal();
    if (
      explicit !== undefined &&
      entries.some(
        (entry) => entry.node.id === explicit && !entry.node.disabled,
      )
    ) {
      return explicit;
    }
    const index = entries.findIndex((entry) => !entry.node.disabled);
    return index === -1 ? undefined : entries[index]?.node.id;
  });

  constructor() {
    super();

    this.treeState.expandedIds = () => this.expandedIds();
    this.treeState.isFilterActive = () => this.isFilterActive();
    this.treeState.activeId = () => this.activeEntryId();
    this.treeState.checkState = (node) =>
      computeNodeCheckState(node, this.selectedSet());
    this.treeState.selectionMode = () => this.selectionMode();
    this.treeState.isSelected = (node) => this.selectedSet().has(node.id);
    this.treeState.toggleExpanded = (node) => this.toggleExpanded(node);
    this.treeState.toggleChecked = (node) => this.toggleChecked(node);
    this.treeState.selectNode = (node) => this.toggleSelection(node);
    this.treeState.setActive = (id) => this.activeIdSignal.set(id);
    this.treeState.activate = (node) => {
      if (this.isBusy()) return;
      this.nodeActivate.emit(node);
    };
    // Bound per-row (co-located with each row's own click handler, which
    // template a11y lint requires) rather than on the root container — it
    // reads this.visibleEntries()/activeEntryId() reactively, so it works
    // identically no matter which row's DOM element the event originated
    // from.
    this.treeState.handleKeydown = (event) => this.onTreeKeydown(event);
  }

  private onTreeKeydown(event: KeyboardEvent): void {
    if (this.isBusy()) {
      return;
    }
    const entries = this.visibleEntries();
    if (entries.length === 0) {
      return;
    }
    const currentId = this.activeEntryId();
    const currentIndex =
      currentId === undefined
        ? -1
        : entries.findIndex((entry) => entry.node.id === currentId);

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActive(this.findEnabledEntryIndex(currentIndex, 1));
        return;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActive(this.findEnabledEntryIndex(currentIndex, -1));
        return;
      case 'Home':
        event.preventDefault();
        this.moveActive(this.findEnabledEntryIndex(-1, 1));
        return;
      case 'End':
        event.preventDefault();
        this.moveActive(this.findEnabledEntryIndex(0, -1));
        return;
      case 'ArrowRight': {
        if (currentIndex === -1) {
          return;
        }
        event.preventDefault();
        const entry = entries[currentIndex];
        if (!entry) {
          return;
        }
        const hasChildren = isTreeNodeExpandable(entry.node);
        const isExpanded = this.isEffectivelyExpanded(entry.node.id);
        if (hasChildren && !isExpanded) {
          this.toggleExpanded(entry.node);
        } else if (hasChildren && isExpanded) {
          const child = entries[currentIndex + 1];
          if (child?.parentId === entry.node.id) {
            this.moveActive(currentIndex + 1);
          }
        }
        return;
      }
      case 'ArrowLeft': {
        if (currentIndex === -1) {
          return;
        }
        event.preventDefault();
        const entry = entries[currentIndex];
        if (!entry) {
          return;
        }
        const hasChildren = isTreeNodeExpandable(entry.node);
        const isExpanded = this.isEffectivelyExpanded(entry.node.id);
        if (hasChildren && isExpanded) {
          this.toggleExpanded(entry.node);
        } else if (entry.parentId !== undefined) {
          const parentIndex = entries.findIndex(
            (candidate) => candidate.node.id === entry.parentId,
          );
          this.moveActive(parentIndex === -1 ? null : parentIndex);
        }
        return;
      }
      case 'Enter':
      case ' ': {
        if (currentIndex === -1) {
          return;
        }
        event.preventDefault();
        const entry = entries[currentIndex];
        if (!entry || entry.node.disabled) {
          return;
        }
        if (this.selectionMode() === 'checkbox') {
          this.toggleChecked(entry.node);
        } else {
          this.toggleSelection(entry.node);
        }
        this.nodeActivate.emit(entry.node);
        return;
      }
      default:
        this.handleTypeahead(event, entries, currentIndex);
        return;
    }
  }

  private handleTypeahead(
    event: KeyboardEvent,
    entries: DynamoTreeEntry[],
    currentIndex: number,
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
    const match = findTypeaheadMatch(
      entries.map((entry) => entry.node),
      currentIndex,
      query,
    );
    if (match === null) return;
    event.preventDefault();
    this.moveActive(match);
  }

  private moveActive(index: number | null): void {
    if (index === null) {
      return;
    }
    const entry = this.visibleEntries()[index];
    if (!entry) {
      return;
    }
    this.activeIdSignal.set(entry.node.id);
    this.focusRow(entry.node.id, index);
  }

  /**
   * Looks up a row by `data-node-id` via a live DOM scan instead of a
   * lifecycle-tied registry — see `tree-state.ts`'s own doc comment for why
   * (CDK's virtual-scroll view recycling can rebind a different node onto
   * an existing `DynamoTreeItem` instance without destroying/recreating
   * it, which a construction-time registration would miss).
   *
   * When the target isn't currently mounted, scrolls the CDK viewport to
   * it first, then polls for it to appear before focusing — a single
   * `afterNextRender` was tried first and found insufficient (confirmed via
   * live browser testing on `@dynamong/tree-table`'s identical fix: CDK's
   * own mount in response to `scrollToIndex` settles over several of its
   * own render passes, not just the next one), so this polls across up to
   * 20 animation frames instead.
   */
  private focusRow(id: string, index: number): void {
    const existing = this.findRowElement(id);
    if (existing) {
      existing.focus();
      return;
    }
    if (!this.virtualScroll()) return;
    this.virtualScrollRef()?.scrollToIndex(index);
    this.pollForRowAndFocus(id, 20);
  }

  private pollForRowAndFocus(id: string, framesLeft: number): void {
    if (framesLeft <= 0) return;
    requestAnimationFrame(() => {
      const row = this.findRowElement(id);
      if (row) {
        row.focus();
        return;
      }
      this.pollForRowAndFocus(id, framesLeft - 1);
    });
  }

  // Scans rather than building a `[data-node-id="${id}"]` selector string —
  // `CSS.escape` isn't implemented in every test/runtime environment; a
  // scan sidesteps needing it at all. The mounted row count is always
  // small (virtualized: only rows near the viewport; unvirtualized: the
  // full visible list either way).
  private findRowElement(id: string): HTMLElement | null {
    const rows =
      this.elementRef.nativeElement.querySelectorAll<HTMLElement>(
        '[data-node-id]',
      );
    for (const row of Array.from(rows)) {
      if (row.dataset['nodeId'] === id) return row;
    }
    return null;
  }

  /** Scans from `from`, stepping by `delta` (wrapping), for the next
   * non-disabled visible entry's index. Returns `null` if every entry is
   * disabled. Same wrap-and-skip-disabled idiom as Menu/Accordion. */
  private findEnabledEntryIndex(from: number, delta: number): number | null {
    const entries = this.visibleEntries();
    if (entries.length === 0) {
      return null;
    }
    let index = from;
    for (let step = 0; step < entries.length; step++) {
      index = (index + delta + entries.length) % entries.length;
      if (!entries[index]?.node.disabled) {
        return index;
      }
    }
    return null;
  }

  /**
   * "Is this node effectively expanded" — the ONE check `visibleEntries()`'s
   * walk and the `ArrowRight`/`ArrowLeft` handlers agree on, instead of two
   * independent raw reads of `expandedIds()` (a third, `tree-item.ts`'s own
   * `isExpanded` computed — the one that actually renders the recursive
   * children group — consults `DynamoTreeState.isFilterActive` directly,
   * since it can't call back into this component). While a filter is
   * active, every node retained by `filteredItems()` renders expanded
   * regardless of `expandedIds` — never written to by filtering itself.
   * `expanded`, when passed, is a precomputed `Set` for the O(1) lookup
   * `visibleEntries()`'s hot walk loop wants; the Arrow handlers (once per
   * keystroke, not once per node) omit it and fall back to
   * `expandedIds().includes(id)`.
   */
  private isEffectivelyExpanded(
    id: string,
    expanded?: ReadonlySet<string>,
  ): boolean {
    if (this.isFilterActive()) return true;
    return expanded ? expanded.has(id) : this.expandedIds().includes(id);
  }

  /** Wired to `<dg-input-text>`'s `(valueChange)` — mirrors Table's/TreeTable's own `onFilterTextChange`, minus the page-reset (Tree has no pagination). */
  protected onFilterTextChange(value: string): void {
    if (this.isBusy()) return;
    this.filterText.set(value);
  }

  private toggleExpanded(node: DynamoTreeNode): void {
    if (this.isBusy() || node.loading) {
      return;
    }
    const current = this.expandedIds();
    const willExpand = !current.includes(node.id);
    this.expandedIds.set(
      willExpand
        ? [...current, node.id]
        : current.filter((existing) => existing !== node.id),
    );
    if (
      willExpand &&
      isTreeNodeExpandable(node) &&
      (node.children?.length ?? 0) === 0
    ) {
      this.nodeExpand.emit(node);
    }
  }

  private toggleChecked(node: DynamoTreeNode): void {
    if (this.isBusy() || node.disabled) {
      return;
    }
    const willCheck = shouldCascadeCheck(node, this.selectedSet());
    const ids = collectCascadeIds(node);
    const current = new Set(this.selected());
    for (const id of ids) {
      if (willCheck) {
        current.add(id);
      } else {
        current.delete(id);
      }
    }
    this.selected.set([...current]);
    this.itemSelect.emit(node);
  }

  /**
   * `'single'`/`'multiple'`-mode selection — plain, non-cascading membership
   * in `selected`. `'single'` always replaces (clicking the already-selected
   * node leaves it selected, never toggles off); `'multiple'` toggles
   * membership on a bare click, no modifier key required (a deliberate
   * divergence from PrimeNG's own `metaKeySelection: true` default — no
   * sibling component in this codebase has a modifier-key-click convention
   * to be consistent with).
   */
  private toggleSelection(node: DynamoTreeNode): void {
    if (this.isBusy() || node.disabled) {
      return;
    }
    const mode = this.selectionMode();
    if (mode === 'single') {
      this.selected.set([node.id]);
    } else if (mode === 'multiple') {
      const current = this.selected();
      this.selected.set(
        current.includes(node.id)
          ? current.filter((id) => id !== node.id)
          : [...current, node.id],
      );
    }
    this.itemSelect.emit(node);
  }
}
