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
import { DynamoPanelMenuNode } from './panel-menu-node';
import { DynamoPanelMenuState } from './panel-menu-state';
import { panelMenuRootStyles } from './panel-menu.styles';
import type { DynamoPanelMenuItem, DynamoPanelMenuPart } from './panel-menu.types';

interface DynamoPanelMenuEntry {
  item: DynamoPanelMenuItem;
  path: string;
  depth: number;
  parentPath: string | undefined;
}

/**
 * A vertical, always-visible nested action menu that expands and collapses
 * in place — no CDK overlay, unlike Menu/Tiered Menu/Menubar's popup-based
 * dropdowns.
 *
 * Architecture: independently duplicated from two existing precedents,
 * neither composed as a real dependency (matching this codebase's
 * established "each family keeps its own copy" convention — confirmed via
 * Tiered Menu/Menubar's own doc comments, which explain the same posture):
 * - The recursive per-node rendering, DI-scoped state coordinator
 *   (`DynamoPanelMenuState`, mirroring `@dynamong/tree`'s own
 *   `DynamoTreeState`), flattened visible-entries walk, and keyboard model
 *   (ArrowUp/Down through the visible list with wrapping, ArrowRight
 *   expands-then-descends, ArrowLeft collapses-then-ascends) are copied
 *   from `@dynamong/tree`, adapted from id-keyed to path-keyed (this item
 *   type carries no `id` field, matching Tiered Menu/Menubar's own item
 *   shape — see panel-menu.types.ts) and with the checkbox/selection
 *   machinery dropped (items trigger actions, they're never selected).
 * - The expand/collapse animation (0fr/1fr grid-rows) is copied from
 *   Tree's own `treeGroupStyles`, itself copied from Accordion's.
 *
 * Unlike Tree's ArrowUp/Down+Enter/Space custom handling, Enter/Space here
 * is NOT handled in `onMenuKeydown` — rows are real `<button>`s, so the
 * browser already turns Enter/Space into a `click` event; handling it again
 * in the keydown handler would double-fire (double-toggle a branch,
 * double-invoke a leaf's `command()`).
 *
 * ARIA: deliberately avoids both `role="tree"`/`"treeitem"` (Tree's own
 * pattern — implies *selectable* nodes, which these aren't — the same
 * "action not a value" distinction Tiered Menu/Menubar already draw against
 * `DynamoTreeNode`) and `role="menu"`/`"menuitem"` (the overlay-menu
 * family's pattern — implies a *popup* context with Escape-closes/
 * return-focus semantics, which doesn't exist for an always-visible panel).
 * Instead: plain `<button aria-expanded aria-controls>` per branch row —
 * the same shape as an Accordion header — and `role="group"` for each
 * children wrapper (harmless/valid, borrowed from Tree for the same
 * "nested list of items" shape).
 */
@Component({
  selector: 'dg-panel-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPanelMenuNode],
  providers: [DynamoPanelMenuState],
  templateUrl: './panel-menu.html',
})
export class DynamoPanelMenu extends DynamoBaseComponent<DynamoPanelMenuPart> {
  readonly items = input.required<DynamoPanelMenuItem[]>();
  /** Two-way bindable: which node paths (dash-joined child-index chains, e.g. "0-2-1") are currently expanded. */
  readonly expandedPaths = model<string[]>([]);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly itemSelect = output<DynamoPanelMenuItem>();

  private readonly activePathSignal = signal<string | undefined>(undefined);
  private readonly menuState = inject(DynamoPanelMenuState);

  protected readonly menuId = this.idGenerator.next('dg-panel-menu');

  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(panelMenuRootStyles, this.styleClass()),
  );

  // Depth-first, skipping children of collapsed items — a pure data walk,
  // not a DOM query, so it isn't blocked by DynamoPanelMenuNode's recursive
  // component boundaries the way viewChildren() would be. Same technique as
  // Tree's own visibleEntries.
  protected readonly visibleEntries = computed<DynamoPanelMenuEntry[]>(() => {
    const result: DynamoPanelMenuEntry[] = [];
    const expanded = new Set(this.expandedPaths());
    const walk = (items: DynamoPanelMenuItem[], depth: number, parentPath: string | undefined) => {
      items.forEach((item, index) => {
        const path = parentPath === undefined ? `${index}` : `${parentPath}-${index}`;
        result.push({ item, path, depth, parentPath });
        if (item.children?.length && expanded.has(path)) {
          walk(item.children, depth + 1, path);
        }
      });
    };
    walk(this.items(), 0, undefined);
    return result;
  });

  // The roving tab stop: an explicitly-set path if it's still visible and
  // enabled, otherwise the first enabled visible entry — so exactly one row
  // is always reachable via Tab, even before any interaction.
  protected readonly activeEntryPath = computed(() => {
    const entries = this.visibleEntries();
    if (entries.length === 0) return undefined;
    const explicit = this.activePathSignal();
    if (explicit !== undefined && entries.some((entry) => entry.path === explicit && !entry.item.disabled)) {
      return explicit;
    }
    const index = entries.findIndex((entry) => !entry.item.disabled);
    return index === -1 ? undefined : entries[index]?.path;
  });

  constructor() {
    super();

    this.menuState.rootId = () => this.menuId;
    this.menuState.expandedPaths = () => this.expandedPaths();
    this.menuState.activePath = () => this.activeEntryPath();
    this.menuState.toggleExpanded = (path) => this.toggleExpanded(path);
    this.menuState.setActive = (path) => this.activePathSignal.set(path);
    this.menuState.commit = (item) => this.commit(item);
    // Bound per-row (co-located with each row's own click handler, which
    // template a11y lint requires) rather than on the root container — it
    // reads this.visibleEntries()/activeEntryPath() reactively, so it works
    // identically no matter which row's DOM element the event originated
    // from. Same technique as Tree's own handleKeydown wiring.
    this.menuState.handleKeydown = (event) => this.onMenuKeydown(event);
  }

  private onMenuKeydown(event: KeyboardEvent): void {
    const entries = this.visibleEntries();
    if (entries.length === 0) return;
    const currentPath = this.activeEntryPath();
    const currentIndex =
      currentPath === undefined ? -1 : entries.findIndex((entry) => entry.path === currentPath);

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
        if (currentIndex === -1) return;
        event.preventDefault();
        const entry = entries[currentIndex];
        if (!entry) return;
        const hasChildren = (entry.item.children?.length ?? 0) > 0;
        const isExpanded = this.expandedPaths().includes(entry.path);
        if (hasChildren && !isExpanded) {
          this.toggleExpanded(entry.path);
        } else if (hasChildren && isExpanded) {
          const child = entries[currentIndex + 1];
          if (child?.parentPath === entry.path) {
            this.moveActive(currentIndex + 1);
          }
        }
        return;
      }
      case 'ArrowLeft': {
        if (currentIndex === -1) return;
        event.preventDefault();
        const entry = entries[currentIndex];
        if (!entry) return;
        const hasChildren = (entry.item.children?.length ?? 0) > 0;
        const isExpanded = this.expandedPaths().includes(entry.path);
        if (hasChildren && isExpanded) {
          this.toggleExpanded(entry.path);
        } else if (entry.parentPath !== undefined) {
          const parentIndex = entries.findIndex((candidate) => candidate.path === entry.parentPath);
          this.moveActive(parentIndex === -1 ? null : parentIndex);
        }
        return;
      }
      default:
        return;
    }
  }

  private moveActive(index: number | null): void {
    if (index === null) return;
    const entry = this.visibleEntries()[index];
    if (!entry) return;
    this.activePathSignal.set(entry.path);
    this.menuState.focusRow(entry.path);
  }

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled visible entry's index. Returns `null` if every entry is disabled. Same wrap-and-skip-disabled idiom as Tree/Menu/Accordion. */
  private findEnabledEntryIndex(from: number, delta: number): number | null {
    const entries = this.visibleEntries();
    if (entries.length === 0) return null;
    let index = from;
    for (let step = 0; step < entries.length; step++) {
      index = (index + delta + entries.length) % entries.length;
      if (!entries[index]?.item.disabled) return index;
    }
    return null;
  }

  private toggleExpanded(path: string): void {
    const current = this.expandedPaths();
    this.expandedPaths.set(
      current.includes(path) ? current.filter((existing) => existing !== path) : [...current, path],
    );
  }

  private commit(item: DynamoPanelMenuItem): void {
    if (item.disabled) return;
    this.itemSelect.emit(item);
    item.command?.();
  }
}
