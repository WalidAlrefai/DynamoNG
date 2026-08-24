import { ElementRef, Injectable } from '@angular/core';
import type { DynamoTreeCheckState } from './tree-selection';
import type { DynamoTreeNode } from './tree.types';

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
 */
@Injectable()
export class DynamoTreeState {
  expandedIds: () => readonly string[] = () => [];
  activeId: () => string | undefined = () => undefined;
  checkState: (node: DynamoTreeNode) => DynamoTreeCheckState = () =>
    'unchecked';

  handleKeydown: (event: KeyboardEvent) => void = () => undefined;
  toggleExpanded: (id: string) => void = () => undefined;
  toggleChecked: (node: DynamoTreeNode) => void = () => undefined;
  setActive: (id: string) => void = () => undefined;
  activate: (node: DynamoTreeNode) => void = () => undefined;

  private readonly rows = new Map<string, ElementRef<HTMLElement>>();

  registerRow(id: string, ref: ElementRef<HTMLElement>): void {
    this.rows.set(id, ref);
  }

  unregisterRow(id: string): void {
    this.rows.delete(id);
  }

  focusRow(id: string): void {
    this.rows.get(id)?.nativeElement.focus();
  }
}
