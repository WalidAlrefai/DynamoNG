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
import { DynamoCheckbox } from '@dynamong/checkbox';
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
import type { DynamoTreeNode } from './tree.types';

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
  imports: [DynamoCheckbox, DynamoTreeItem],
  templateUrl: './tree-item.html',
})
export class DynamoTreeItem {
  readonly node = input.required<DynamoTreeNode>();
  readonly depth = input(0);
  readonly posinset = input(1);
  readonly setsize = input(1);

  protected readonly state = inject(DynamoTreeState);

  private readonly rowRef = viewChild.required<ElementRef<HTMLElement>>('row');
  private readonly checkboxHost =
    viewChild<ElementRef<HTMLElement>>('checkboxHost');

  protected readonly hasChildren = computed(
    () => (this.node().children?.length ?? 0) > 0,
  );
  protected readonly isExpanded = computed(() =>
    this.state.expandedIds().includes(this.node().id),
  );
  protected readonly isActive = computed(
    () => this.state.activeId() === this.node().id,
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
    treeRowStyles({
      active: this.isActive(),
      disabled: this.node().disabled ?? false,
    }),
  );
  protected readonly chevronClasses = computed(() =>
    treeChevronStyles({ expanded: this.isExpanded() }),
  );
  protected readonly groupClasses = computed(() =>
    treeGroupStyles({ expanded: this.isExpanded() }),
  );
  protected readonly indentRem = computed(() => treeIndentRem(this.depth()));

  protected readonly chevronButtonClasses = treeChevronButtonStyles;
  protected readonly chevronPlaceholderClasses = treeChevronPlaceholderStyles;
  protected readonly groupInnerClasses = treeGroupInnerStyles;
  protected readonly labelClasses = treeLabelStyles;

  constructor() {
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      this.state.registerRow(this.node().id, this.rowRef());

      // DynamoCheckbox's native <input> has no tabindex or label of its own
      // to set (its pt/passthrough system isn't wired to the input), so
      // two things need fixing directly: (1) it's independently
      // Tab-focusable by default, which would break the tree's
      // roving-tabindex scheme (exactly one row reachable via Tab at a
      // time) — mouse clicks and the tree's own keyboard handling don't
      // depend on the input's native focusability; (2) no projected label
      // content is passed to <dg-checkbox> here (the node's label is
      // rendered as a separate sibling span for layout reasons), so the
      // input has no accessible name of its own.
      const input = this.checkboxHost()?.nativeElement.querySelector('input');
      input?.setAttribute('tabindex', '-1');
      input?.setAttribute('aria-label', this.node().label);
    });

    destroyRef.onDestroy(() => this.state.unregisterRow(this.node().id));
  }

  protected onRowFocus(): void {
    this.state.setActive(this.node().id);
  }

  protected onRowClick(): void {
    if (this.node().disabled) {
      return;
    }
    this.state.setActive(this.node().id);
    this.state.activate(this.node());
  }

  protected onChevronClick(event: Event): void {
    event.stopPropagation();
    if (!this.hasChildren()) {
      return;
    }
    this.state.toggleExpanded(this.node().id);
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
