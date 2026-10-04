import { Injectable } from '@angular/core';
import type { DynamoTreeCheckState } from './tree-selection';
import type { DynamoTreeNode, DynamoTreeSelectionMode } from './tree.types';

/**
 * Internal, DI-scoped coordination point between the recursive
 * `DynamoTreeItem` components and their `DynamoTree` root. Provided fresh
 * per `<dg-tree>` instance (`providers: [DynamoTreeState]` on `DynamoTree`)
 * and injected by every `DynamoTreeItem` at any recursion depth — Angular's
 * hierarchical injector resolves it from the nearest ancestor `DynamoTree`
 * regardless of how many `DynamoTreeItem` levels sit in between, since a
 * component's own `providers` are visible to its entire embedded view,
 * including recursively-nested descendants of its own type.
 *
 * `DynamoTree` overwrites every function field in its constructor to close
 * over its own signals; the defaults below only exist so the class is
 * constructible before that wiring runs. Not exported from `index.ts` — an
 * implementation detail of this one library, not a public `@dynamong/core`
 * service.
 *
 * Deliberately has NO row-element registry (an earlier version did,
 * Map-keyed by node id, for `moveActive`'s roving-focus to call
 * `focusRow(id)` through). `virtualScroll`'s own `dg-tree-item` instances
 * are mounted via `dg-virtual-scroll`'s `NgTemplateOutlet`, which CDK can
 * *recycle* (rebind a different node's data onto an existing component
 * instance without destroying/recreating it) — a one-shot
 * construction-time registration would silently go stale the first time a
 * slot gets reused for a different node. `tree.ts`'s own `focusRow` instead
 * scans the live DOM by `data-node-id` on demand (same technique
 * `@dynamong/tree-table`'s equivalent fix already uses), which is immune to
 * recycling by construction since it never trusts a lifecycle-tied cache.
 */
@Injectable()
export class DynamoTreeState {
  expandedIds: () => readonly string[] = () => [];
  /** True while a non-blank filter is narrowing the tree — see `DynamoTreeItem`'s own `isExpanded` doc comment for why it consults this alongside `expandedIds`. */
  isFilterActive: () => boolean = () => false;
  activeId: () => string | undefined = () => undefined;
  checkState: (node: DynamoTreeNode) => DynamoTreeCheckState = () =>
    'unchecked';
  selectionMode: () => DynamoTreeSelectionMode = () => 'checkbox';
  isSelected: (node: DynamoTreeNode) => boolean = () => false;

  handleKeydown: (event: KeyboardEvent) => void = () => undefined;
  toggleExpanded: (node: DynamoTreeNode) => void = () => undefined;
  toggleChecked: (node: DynamoTreeNode) => void = () => undefined;
  selectNode: (node: DynamoTreeNode) => void = () => undefined;
  setActive: (id: string) => void = () => undefined;
  activate: (node: DynamoTreeNode) => void = () => undefined;
}
