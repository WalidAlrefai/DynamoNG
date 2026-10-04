import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  type OnChanges,
  type SimpleChanges,
  type TemplateRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoPassThroughDirective } from '@dynamong/core/base';
import type {
  DynamoPassThrough,
  DynamoPassThroughAttrs,
} from '@dynamong/core/api';
import { DynamoSpinner } from '@dynamong/spinner';
import { cn } from '@dynamong/utils/class-merge';
import { isTreeNodeExpandable } from './tree-node';
import { DynamoTreeState } from './tree-state';
import {
  treeChevronButtonStyles,
  treeChevronPlaceholderStyles,
  treeChevronStyles,
  treeGroupInnerStyles,
  treeGroupStyles,
  treeIndentRem,
  treeLabelStyles,
  treeRowStyles,
} from './tree.styles';
import type {
  DynamoTreeNode,
  DynamoTreeNodeContext,
  DynamoTreePart,
} from './tree.types';

// Recursive: renders itself again, one level deeper, for each expanded
// child. Unlike DynamoAccordionPanel (a DOM-less content marker),
// DynamoTreeItem owns real DOM at every level — a genuinely recursive
// structure can't be flattened into one parent-owned template the way
// Accordion's flat panel list is. Not exported from index.ts: it's a
// purely internal rendering primitive driven entirely by data (the `node`
// input), never something a consumer places in their own template.
@Component({
  selector: 'dg-tree-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoCheckbox,
    DynamoSpinner,
    DynamoTreeItem,
    DynamoPassThroughDirective,
    NgTemplateOutlet,
  ],
  templateUrl: './tree-item.html',
})
export class DynamoTreeItem implements OnChanges {
  readonly node = input.required<DynamoTreeNode>();
  readonly depth = input(0);
  readonly posinset = input(1);
  readonly setsize = input(1);
  /** Gates the trailing recursive children group — `true` (default) for the
   *  normal recursive render path; `false` only for the flat virtualized
   *  path (`tree.html`'s own `visibleEntries()`-driven `<dg-virtual-scroll>`
   *  call site), where each entry is already its own top-level flat row and
   *  rendering a nested group here would duplicate it. */
  readonly renderChildren = input(true);
  /** Forwarded down from `DynamoTree`'s own `pt()` — this component doesn't
   *  extend `DynamoBaseComponent` (it's an internal rendering primitive, not
   *  itself a `pt`-targetable whole), so it re-declares the same `pt` input
   *  shape purely to pass it along to its own template bindings and to its
   *  recursive child `<dg-tree-item>`. */
  readonly pt = input<DynamoPassThrough<DynamoTreePart> | undefined>(undefined);
  /** Forwarded down from `DynamoTree`'s own `nodeTemplate()`. */
  readonly nodeTemplate = input<TemplateRef<DynamoTreeNodeContext> | undefined>(
    undefined,
  );

  protected readonly state = inject(DynamoTreeState);

  protected ptFor(part: DynamoTreePart): DynamoPassThroughAttrs {
    return this.pt()?.[part] ?? {};
  }

  private readonly checkboxHost =
    viewChild<ElementRef<HTMLElement>>('checkboxHost');
  private readonly viewReady = signal(false);

  protected readonly isExpandable = computed(() =>
    isTreeNodeExpandable(this.node()),
  );
  // While a filter is active, every retained node renders expanded
  // regardless of `expandedIds` — `filterTree` already pruned the tree
  // down to matches and their ancestor chain, so there's nothing left to
  // hide — without ever writing to the `expandedIds` model itself. This
  // is the one place that actually decides whether the recursive children
  // group renders, so unlike `DynamoTree`'s own keyboard-nav-only checks,
  // it must independently consult `isFilterActive` too.
  protected readonly isExpanded = computed(
    () =>
      this.state.isFilterActive() ||
      this.state.expandedIds().includes(this.node().id),
  );
  protected readonly isActive = computed(
    () => this.state.activeId() === this.node().id,
  );
  protected readonly isSelected = computed(() =>
    this.state.isSelected(this.node()),
  );
  /** `'false'` always in `'checkbox'` mode (selection there is conveyed by `aria-checked`, not `aria-selected`) — reflects `isSelected()` in `'single'`/`'multiple'` mode. */
  protected readonly ariaSelectedAttr = computed(() =>
    this.state.selectionMode() === 'checkbox'
      ? 'false'
      : this.isSelected()
        ? 'true'
        : 'false',
  );
  protected readonly checkState = computed(() =>
    this.state.checkState(this.node()),
  );
  protected readonly isChecked = computed(
    () => this.checkState() === 'checked',
  );
  protected readonly isIndeterminate = computed(
    () => this.checkState() === 'indeterminate',
  );
  // DynamoCheckbox's own styling only colors the box (which the
  // indeterminate dash's `bg-current` depends on to be visible at all) when
  // `checked` is true — an indeterminate-but-unchecked box renders an
  // invisible dash on an unstyled box. Bind `checked` to "not fully
  // unchecked" so the indeterminate case still gets the filled/colored box.
  protected readonly checkboxChecked = computed(
    () => this.checkState() !== 'unchecked',
  );
  protected readonly ariaCheckedAttr = computed(() => {
    switch (this.checkState()) {
      case 'checked':
        return 'true';
      case 'indeterminate':
        return 'mixed';
      default:
        return 'false';
    }
  });

  protected readonly rowClasses = computed(() =>
    cn(
      treeRowStyles({
        active: this.isActive(),
        selected:
          this.state.selectionMode() !== 'checkbox' && this.isSelected(),
        disabled: this.node().disabled ?? false,
      }),
      this.ptFor('row').class,
    ),
  );
  protected readonly chevronClasses = computed(() =>
    cn(
      treeChevronStyles({ expanded: this.isExpanded() }),
      this.ptFor('chevron').class,
    ),
  );
  protected readonly groupClasses = computed(() =>
    cn(
      treeGroupStyles({ expanded: this.isExpanded() }),
      this.ptFor('group').class,
    ),
  );
  protected readonly indentRem = computed(() => treeIndentRem(this.depth()));

  protected readonly chevronButtonClasses = computed(() =>
    cn(treeChevronButtonStyles, this.ptFor('chevronButton').class),
  );
  protected readonly chevronPlaceholderClasses = treeChevronPlaceholderStyles;
  protected readonly groupInnerClasses = treeGroupInnerStyles;
  protected readonly labelClasses = computed(() =>
    cn(treeLabelStyles, this.ptFor('label').class),
  );

  /** Accessible name for the chevron button — e.g. "Expand Documents" — used
   *  since the chevron is now a real `<button>` (see its own markup comment)
   *  rather than an AT-invisible `<span>` carrying a click handler. */
  protected chevronLabel(): string {
    const verb = this.isExpanded() ? 'Collapse ' : 'Expand ';
    return verb + this.node().label;
  }

  protected readonly nodeContext = computed<DynamoTreeNodeContext>(() => ({
    $implicit: this.node(),
    node: this.node(),
    depth: this.depth(),
    expanded: this.isExpanded(),
  }));

  constructor() {
    afterNextRender(() => {
      this.syncCheckboxInput();
      this.viewReady.set(true);
    });
  }

  /**
   * Re-syncs the checkbox `<input>`'s `tabindex`/`aria-label` whenever
   * `node()` changes post-initial-render — needed because CDK's virtual-
   * scroll recycling (see `tree-state.ts`'s own doc comment) can rebind a
   * *different* node's data onto this *same* component instance, which a
   * one-shot constructor/`afterNextRender` fix would miss entirely for
   * every node after the first ever bound to a given recycled slot.
   */
  ngOnChanges(changes: SimpleChanges): void {
    if (this.viewReady() && changes['node']) {
      this.syncCheckboxInput();
    }
  }

  // DynamoCheckbox's native <input> has no tabindex or label of its own to
  // set (its pt/passthrough system isn't wired to the input), so two things
  // need fixing directly: (1) it's independently Tab-focusable by default,
  // which would break the tree's roving-tabindex scheme (exactly one row
  // reachable via Tab at a time) — mouse clicks and the tree's own keyboard
  // handling don't depend on the input's native focusability; (2) no
  // projected label content is passed to <dg-checkbox> here (the node's
  // label is rendered as a separate sibling span for layout reasons), so
  // the input has no accessible name of its own.
  private syncCheckboxInput(): void {
    const input = this.checkboxHost()?.nativeElement.querySelector('input');
    input?.setAttribute('tabindex', '-1');
    input?.setAttribute('aria-label', this.node().label);
  }

  protected onRowFocus(): void {
    this.state.setActive(this.node().id);
  }

  protected onRowClick(): void {
    if (this.node().disabled) {
      return;
    }
    this.state.setActive(this.node().id);
    if (this.state.selectionMode() !== 'checkbox') {
      this.state.selectNode(this.node());
    }
    this.state.activate(this.node());
  }

  protected onChevronClick(event: Event): void {
    event.stopPropagation();
    if (!this.isExpandable() || this.node().loading) {
      return;
    }
    this.state.toggleExpanded(this.node());
  }

  protected onCheckboxContainerClick(event: Event): void {
    event.stopPropagation();
  }

  protected onCheckedChange(): void {
    if (this.node().disabled) {
      return;
    }
    this.state.toggleChecked(this.node());
  }
}
