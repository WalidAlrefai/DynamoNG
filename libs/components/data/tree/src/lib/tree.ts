import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoTreeItem } from './tree-item';
import {
  collectCascadeIds,
  computeNodeCheckState,
  shouldCascadeCheck,
} from './tree-selection';
import { DynamoTreeState } from './tree-state';
import { treeRootStyles } from './tree.styles';
import type { DynamoTreeNode, DynamoTreePart } from './tree.types';

interface DynamoTreeEntry {
  node: DynamoTreeNode;
  depth: number;
  parentId: string | undefined;
}

@Component({
  selector: 'dg-tree',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTreeItem],
  providers: [DynamoTreeState],
  templateUrl: './tree.html',
})
export class DynamoTree extends DynamoBaseComponent<DynamoTreePart> {
  readonly items = input.required<DynamoTreeNode[]>();
  /** Two-way bindable: which node ids are currently expanded. */
  readonly expandedIds = model<string[]>([]);
  /** Two-way bindable: every node id (leaf or branch) currently fully checked. */
  readonly selected = model<string[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Fires on Enter/Space or a row click — independent of checkbox toggling. */
  readonly nodeActivate = output<DynamoTreeNode>();

  private readonly activeIdSignal = signal<string | undefined>(undefined);
  private readonly treeState = inject(DynamoTreeState);

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(treeRootStyles, this.styleClass()),
  );

  private readonly selectedSet = computed(() => new Set(this.selected()));

  // Depth-first, skipping children of collapsed nodes — a pure data walk,
  // not a DOM query, so it isn't blocked by DynamoTreeItem's recursive
  // component boundaries the way viewChildren()/contentChildren() would be.
  protected readonly visibleEntries = computed<DynamoTreeEntry[]>(() => {
    const result: DynamoTreeEntry[] = [];
    const expanded = new Set(this.expandedIds());
    const walk = (
      nodes: DynamoTreeNode[],
      depth: number,
      parentId: string | undefined,
    ) => {
      for (const node of nodes) {
        result.push({ node, depth, parentId });
        if (node.children?.length && expanded.has(node.id)) {
          walk(node.children, depth + 1, node.id);
        }
      }
    };
    walk(this.items(), 0, undefined);
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
    this.treeState.activeId = () => this.activeEntryId();
    this.treeState.checkState = (node) =>
      computeNodeCheckState(node, this.selectedSet());
    this.treeState.toggleExpanded = (id) => this.toggleExpanded(id);
    this.treeState.toggleChecked = (node) => this.toggleChecked(node);
    this.treeState.setActive = (id) => this.activeIdSignal.set(id);
    this.treeState.activate = (node) => this.nodeActivate.emit(node);
    // Bound per-row (co-located with each row's own click handler, which
    // template a11y lint requires) rather than on the root container — it
    // reads this.visibleEntries()/activeEntryId() reactively, so it works
    // identically no matter which row's DOM element the event originated
    // from.
    this.treeState.handleKeydown = (event) => this.onTreeKeydown(event);
  }

  private onTreeKeydown(event: KeyboardEvent): void {
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
        const hasChildren = (entry.node.children?.length ?? 0) > 0;
        const isExpanded = this.expandedIds().includes(entry.node.id);
        if (hasChildren && !isExpanded) {
          this.toggleExpanded(entry.node.id);
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
        const hasChildren = (entry.node.children?.length ?? 0) > 0;
        const isExpanded = this.expandedIds().includes(entry.node.id);
        if (hasChildren && isExpanded) {
          this.toggleExpanded(entry.node.id);
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
        this.toggleChecked(entry.node);
        this.nodeActivate.emit(entry.node);
        return;
      }
      default:
        return;
    }
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
    this.treeState.focusRow(entry.node.id);
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

  private toggleExpanded(id: string): void {
    const current = this.expandedIds();
    this.expandedIds.set(
      current.includes(id)
        ? current.filter((existing) => existing !== id)
        : [...current, id],
    );
  }

  private toggleChecked(node: DynamoTreeNode): void {
    if (node.disabled) {
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
  }
}
