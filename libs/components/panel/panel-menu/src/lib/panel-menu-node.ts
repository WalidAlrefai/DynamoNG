import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';
import { DynamoPanelMenuState } from './panel-menu-state';
import {
  panelMenuChevronPlaceholderStyles,
  panelMenuChevronStyles,
  panelMenuGroupInnerStyles,
  panelMenuGroupStyles,
  panelMenuIndentRem,
  panelMenuLabelStyles,
  panelMenuRowStyles,
} from './panel-menu.styles';
import type { DynamoPanelMenuItem } from './panel-menu.types';

// Recursive: renders itself again, one level deeper, for each expanded
// child — same reasoning as @dynamong/tree's DynamoTreeItem (a genuinely
// recursive structure can't be flattened into one parent-owned template).
// Not exported from index.ts: a purely internal rendering primitive driven
// entirely by data (the `item` input), never something a consumer places
// in their own template.
//
// A branch row and a leaf row share one interaction: click (or Enter/Space,
// via the native <button>'s own click-on-activate behavior — no custom
// keydown handling for Enter/Space here, to avoid double-firing against the
// button's native behavior). A branch's click toggles its own expand state;
// a leaf's click commits. Unlike Tree (which layers row-click/chevron-click/
// checkbox-click as three independent affordances in one row), PanelMenu
// has no separate "select" concept, so the whole row does one thing.
@Component({
  selector: 'dg-panel-menu-node',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPanelMenuNode],
  templateUrl: './panel-menu-node.html',
})
export class DynamoPanelMenuNode {
  readonly item = input.required<DynamoPanelMenuItem>();
  /** Structural identity — the dash-joined chain of child indices from the root (e.g. "0-2-1"). */
  readonly path = input.required<string>();
  readonly depth = input(0);

  protected readonly state = inject(DynamoPanelMenuState);

  private readonly rowRef = viewChild.required<ElementRef<HTMLElement>>('row');

  protected readonly hasChildren = computed(() => (this.item().children?.length ?? 0) > 0);
  protected readonly isExpanded = computed(() => this.state.expandedPaths().includes(this.path()));
  protected readonly isActive = computed(() => this.state.activePath() === this.path());
  protected readonly groupId = computed(() => `${this.state.rootId()}-group-${this.path()}`);

  protected readonly rowClasses = computed(() =>
    panelMenuRowStyles({ active: this.isActive(), disabled: this.item().disabled ?? false }),
  );
  protected readonly chevronClasses = computed(() =>
    panelMenuChevronStyles({ expanded: this.isExpanded() }),
  );
  protected readonly groupClasses = computed(() => panelMenuGroupStyles({ expanded: this.isExpanded() }));
  protected readonly indentRem = computed(() => panelMenuIndentRem(this.depth()));

  protected readonly chevronPlaceholderClasses = panelMenuChevronPlaceholderStyles;
  protected readonly groupInnerClasses = panelMenuGroupInnerStyles;
  protected readonly labelClasses = panelMenuLabelStyles;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => this.state.registerRow(this.path(), this.rowRef()));
    destroyRef.onDestroy(() => this.state.unregisterRow(this.path()));
  }

  protected onRowFocus(): void {
    this.state.setActive(this.path());
  }

  protected onRowClick(): void {
    if (this.item().disabled) return;
    this.state.setActive(this.path());
    if (this.hasChildren()) {
      this.state.toggleExpanded(this.path());
    } else {
      this.state.commit(this.item());
    }
  }

  protected childPath(index: number): string {
    return `${this.path()}-${index}`;
  }
}
