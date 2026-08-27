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
  viewChild,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { NG_VALUE_ACCESSOR, type ControlValueAccessor } from '@angular/forms';
import {
  DynamoListboxBase,
  buildListboxPositions,
  selectChevronStyles,
  selectPanelWrapperStyles,
  selectTriggerButtonStyles,
  selectTriggerStyles,
} from '@dynamong/select';
import type { DynamoTreeNode } from '@dynamong/tree';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import {
  treeSelectExpandButtonStyles,
  treeSelectExpandIconStyles,
  treeSelectExpandSpacerStyles,
  treeSelectRowStyles,
} from './tree-select.styles';
import type { DynamoTreeSelectPart } from './tree-select.types';

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

@Component({
  selector: 'dg-tree-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable: which branch node ids are currently expanded. */
  readonly expandedIds = model<string[]>([]);
  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model<TValue | null>(null);

  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');

  protected readonly panelId = this.idGenerator.next('dg-tree-select-panel');

  private onChangeFn: (value: TValue | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  protected readonly visibleEntries = computed(() =>
    flattenVisibleNodes(this.nodes(), this.expandedIds()),
  );
  protected readonly selectedNode = computed(() =>
    findNodeByValue(this.nodes(), this.value()),
  );
  protected readonly selectedLabel = computed(
    () => this.selectedNode()?.label ?? this.placeholder(),
  );
  protected readonly activeEntryId = computed(() => {
    const index = this.activeIndex();
    return index >= 0 ? this.entryId(index) : null;
  });

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          selectTriggerStyles({
            size: this.size(),
            invalid: this.invalid(),
            disabled: this.disabled(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly triggerButtonClasses = selectTriggerButtonStyles;
  protected readonly chevronClasses = computed(() =>
    selectChevronStyles({ open: this.isOpen() }),
  );
  protected readonly panelWrapperClasses = selectPanelWrapperStyles;
  protected readonly expandButtonClasses = treeSelectExpandButtonStyles;
  protected readonly expandSpacerClasses = treeSelectExpandSpacerStyles;

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

  writeValue(value: TValue | null): void {
    this.value.set(value);
  }

  registerOnChange(fn: (value: TValue | null) => void): void {
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
    return this.expandedIds().includes(id);
  }

  protected isSelected(node: DynamoTreeNode<TValue>): boolean {
    return nodeValue(node) === this.value();
  }

  protected rowClasses(entry: DynamoTreeSelectEntry<TValue>, index: number): string {
    return treeSelectRowStyles({
      active: index === this.activeIndex(),
      selected: this.isSelected(entry.node),
      disabled: !!entry.node.disabled,
    });
  }

  protected expandIconClasses(id: string): string {
    return treeSelectExpandIconStyles({ expanded: this.isExpanded(id) });
  }

  protected toggle(): void {
    if (this.disabled()) {
      return;
    }
    if (this.isOpen()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.disabled()) {
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
  }

  protected close(): void {
    this.isOpen.set(false);
    this.onTouchedFn();
  }

  protected toggleExpanded(id: string, event: Event): void {
    event.stopPropagation();
    this.expandedIds.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
  }

  protected selectNode(node: DynamoTreeNode<TValue>): void {
    if (node.disabled) {
      return;
    }
    const next = nodeValue(node);
    this.value.set(next);
    this.onChangeFn(next);
    this.close();
    this.triggerEl().nativeElement.focus();
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
        break;
      case 'End':
        event.preventDefault();
        this.activeIndex.set(
          findEnabledEntryIndex(entries, entries.length, -1) ?? -1,
        );
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
          if (next >= 0) this.activeIndex.set(next);
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
          if (parentIndex >= 0) this.activeIndex.set(parentIndex);
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
    }
  }

  private moveActive(delta: number): void {
    const next = findEnabledEntryIndex(
      this.visibleEntries(),
      this.activeIndex(),
      delta,
    );
    if (next !== null) this.activeIndex.set(next);
  }
}
