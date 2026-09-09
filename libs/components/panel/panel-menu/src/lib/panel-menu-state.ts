import { ElementRef, Injectable } from '@angular/core';
import type { DynamoPanelMenuItem } from './panel-menu.types';

/**
 * Internal, DI-scoped coordination point between the recursive
 * `DynamoPanelMenuNode` components and their `DynamoPanelMenu` root.
 * Provided fresh per `<dg-panel-menu>` instance (`providers:
 * [DynamoPanelMenuState]` on `DynamoPanelMenu`) and injected by every
 * `DynamoPanelMenuNode` at any recursion depth — Angular's hierarchical
 * injector resolves it from the nearest ancestor `DynamoPanelMenu`
 * regardless of how many `DynamoPanelMenuNode` levels sit in between, since
 * a component's own `providers` are visible to its entire embedded view,
 * including recursively-nested descendants of its own type. Mirrors
 * `@dynamong/tree`'s own `DynamoTreeState` exactly, adapted from id-keyed to
 * path-keyed (see panel-menu.types.ts) with the checkbox/selection
 * machinery dropped (items trigger actions, they're never selected).
 *
 * `DynamoPanelMenu` overwrites every function field in its constructor to
 * close over its own signals; the defaults below only exist so the class is
 * constructible before that wiring runs. Not exported from `index.ts` — an
 * implementation detail of this one library, not a public `@dynamong/core`
 * service.
 */
@Injectable()
export class DynamoPanelMenuState {
  rootId: () => string = () => '';
  expandedPaths: () => readonly string[] = () => [];
  activePath: () => string | undefined = () => undefined;

  handleKeydown: (event: KeyboardEvent) => void = () => undefined;
  toggleExpanded: (path: string) => void = () => undefined;
  setActive: (path: string) => void = () => undefined;
  /** Fires on a leaf row's click/Enter/Space commit — never called for a branch (branches just toggle). */
  commit: (item: DynamoPanelMenuItem) => void = () => undefined;

  private readonly rows = new Map<string, ElementRef<HTMLElement>>();

  registerRow(path: string, ref: ElementRef<HTMLElement>): void {
    this.rows.set(path, ref);
  }

  unregisterRow(path: string): void {
    this.rows.delete(path);
  }

  focusRow(path: string): void {
    this.rows.get(path)?.nativeElement.focus();
  }
}
