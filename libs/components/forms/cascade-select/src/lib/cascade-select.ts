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
  signal,
  viewChild,
} from '@angular/core';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
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
import type { DynamoOverlayHandle } from '@dynamong/core/overlay';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { buildCascadePositions } from './cascade-select.positioning';
import {
  cascadeSelectCaretStyles,
  cascadeSelectRowStyles,
} from './cascade-select.styles';
import type { DynamoCascadeSelectPart } from './cascade-select.types';

interface DynamoCascadeLevel<TValue> {
  nodes: DynamoTreeNode<TValue>[];
  activeIndex: number;
  /** The row DOM element (in the *previous* level) this level's flyout is anchored to. `null` only for level 0, which anchors to the trigger instead. */
  anchorEl: HTMLElement | null;
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

function containsValue<TValue>(node: DynamoTreeNode<TValue>, value: TValue): boolean {
  if (nodeValue(node) === value) return true;
  return node.children?.some((child) => containsValue(child, value)) ?? false;
}

// Mirrors TreeSelect's `findEnabledEntryIndex` shape (linear scan, skip
// disabled, no wrap) — reimplemented locally since each level's `nodes` is
// already a flat array here (no depth/parentId bookkeeping needed).
function findEnabledNodeIndex<TValue>(
  nodes: DynamoTreeNode<TValue>[],
  current: number,
  delta: number,
): number | null {
  let index = current + delta;
  while (index >= 0 && index < nodes.length) {
    if (!nodes[index]?.disabled) {
      return index;
    }
    index += delta;
  }
  return null;
}

@Component({
  selector: 'dg-cascade-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cascade-select.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => DynamoCascadeSelect),
      multi: true,
    },
  ],
})
export class DynamoCascadeSelect<TValue = string>
  extends DynamoListboxBase<DynamoCascadeSelectPart>
  implements ControlValueAccessor
{
  readonly nodes = input.required<DynamoTreeNode<TValue>[]>();
  readonly placeholder = input('Select...');
  readonly size = input<DynamoSize>('md');
  readonly invalid = input(false);
  /** Two-way bindable; also driven by Angular forms via `setDisabledState`. */
  readonly disabled = model(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable; also driven by Angular forms via `writeValue`. */
  readonly value = model<TValue | null>(null);

  private readonly triggerEl = viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panelTemplate');

  protected readonly panelId = this.idGenerator.next('dg-cascade-select-panel');

  private onChangeFn: (value: TValue | null) => void = () => {
    /* replaced by registerOnChange once bound to a FormControl/ngModel */
  };
  private onTouchedFn: () => void = () => {
    /* replaced by registerOnTouched once bound to a FormControl/ngModel */
  };

  /** Every currently-open level: `levels()[0]` is the root panel (base-managed overlay), `levels()[1..N]` are flyouts this component manages itself. */
  protected readonly levels = signal<DynamoCascadeLevel<TValue>[]>([]);
  /** Which level currently owns Up/Down/Enter/Escape. */
  protected readonly activeLevelIndex = signal(0);
  /** `flyoutHandles[k]` backs `levels()[k + 1]` — a plain stack, push/pop only, so index bookkeeping never needs a placeholder for the base-managed root level. */
  private readonly flyoutHandles: (DynamoOverlayHandle & { anchorEl: HTMLElement })[] = [];

  protected readonly selectedNode = computed(() => findNodeByValue(this.nodes(), this.value()));
  protected readonly selectedLabel = computed(
    () => this.selectedNode()?.label ?? this.placeholder(),
  );
  protected readonly activeDescendantId = computed(() => {
    if (!this.isOpen()) return null;
    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level || level.activeIndex < 0) return null;
    return this.rowId(levelIndex, level.activeIndex);
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
  protected readonly caretClasses = cascadeSelectCaretStyles;

  constructor() {
    super();
    effect(() => {
      if (this.isOpen()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });
    this.destroyRef.onDestroy(() => {
      this.destroyOverlay();
      while (this.flyoutHandles.length > 0) {
        this.flyoutHandles.pop()?.overlayRef.dispose();
      }
    });

    // Resyncs `flyoutHandles` (levels 1..N) to `levels()` after every
    // change — a full resync rather than a surgical diff, since it's O(depth)
    // per run (trivially cheap for a UI list) and is obviously correct where
    // a diff would need its own separate tests to trust.
    effect(() => {
      const current = this.levels();
      const neededFlyoutCount = Math.max(0, current.length - 1);

      while (this.flyoutHandles.length > neededFlyoutCount) {
        this.flyoutHandles.pop()?.overlayRef.dispose();
      }

      for (let k = this.flyoutHandles.length; k < neededFlyoutCount; k++) {
        const levelIndex = k + 1;
        // `levels()[levelIndex].anchorEl` is the row DOM element (in the
        // *previous* level) that this level's flyout is anchored to — set
        // by `drillInto` when the level was pushed. Not `levels()[levelIndex
        // - 1].anchorEl`, which is that PREVIOUS level's own anchor (always
        // null for the root) — an easy off-by-one to get backwards here.
        const anchor = current[levelIndex]?.anchorEl;
        if (!anchor) break; // shouldn't happen — stay defensive rather than throw
        const handle = this.overlayService.createConnectedOverlay(
          anchor,
          buildCascadePositions(),
          { hasBackdrop: false }, // only the root panel gets the backdrop that closes everything
        );
        handle.overlayRef.attach(
          new TemplatePortal(this.panelTemplate(), this.viewContainerRef, { levelIndex }),
        );
        this.flyoutHandles.push({ ...handle, anchorEl: anchor });
      }
    });
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

  protected panelIdForLevel(levelIndex: number): string {
    return `${this.panelId}-level-${levelIndex}`;
  }

  protected rowId(levelIndex: number, index: number): string {
    return `${this.panelIdForLevel(levelIndex)}-row-${index}`;
  }

  protected isSelected(node: DynamoTreeNode<TValue>): boolean {
    return nodeValue(node) === this.value();
  }

  protected rowClasses(node: DynamoTreeNode<TValue>, levelIndex: number, index: number): string {
    const level = this.levels()[levelIndex];
    return cascadeSelectRowStyles({
      active: level?.activeIndex === index,
      selected: this.isSelected(node),
      disabled: !!node.disabled,
    });
  }

  protected toggle(): void {
    if (this.disabled()) return;
    if (this.isOpen()) {
      this.close();
    } else {
      this.openPanel();
    }
  }

  protected openPanel(): void {
    if (this.disabled()) return;
    this.isOpen.set(true);
    this.levels.set(this.buildInitialLevels());
    this.activeLevelIndex.set(0);
  }

  close(): void {
    this.isOpen.set(false);
    this.levels.set([]);
    this.activeLevelIndex.set(0);
    this.onTouchedFn();
  }

  protected selectNode(node: DynamoTreeNode<TValue>): void {
    if (node.disabled) return;
    const next = nodeValue(node);
    this.value.set(next);
    this.onChangeFn(next);
    this.close();
    this.triggerEl().nativeElement.focus();
  }

  protected onRowHover(levelIndex: number, index: number): void {
    this.activeLevelIndex.set(levelIndex);
    this.drillInto(levelIndex, index);
  }

  protected onRowActivate(levelIndex: number, index: number): void {
    const level = this.levels()[levelIndex];
    const node = level?.nodes[index];
    if (!node || node.disabled) return;
    if (node.children?.length) {
      this.onRowHover(levelIndex, index);
    } else {
      this.selectNode(node);
    }
  }

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

    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level) return;

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
        this.moveActiveOnly(levelIndex, findEnabledNodeIndex(level.nodes, -1, 1) ?? -1);
        break;
      case 'End':
        event.preventDefault();
        this.moveActiveOnly(
          levelIndex,
          findEnabledNodeIndex(level.nodes, level.nodes.length, -1) ?? -1,
        );
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const node = level.nodes[level.activeIndex];
        if (!node || node.disabled || !node.children?.length) break;
        this.drillInto(levelIndex, level.activeIndex);
        this.activeLevelIndex.set(levelIndex + 1);
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (levelIndex === 0) break;
        this.levels.update((current) => current.slice(0, levelIndex));
        this.activeLevelIndex.set(levelIndex - 1);
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const node = level.nodes[level.activeIndex];
        if (!node) break;
        if (node.children?.length) {
          this.drillInto(levelIndex, level.activeIndex);
          this.activeLevelIndex.set(levelIndex + 1);
        } else {
          this.selectNode(node);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        this.triggerEl().nativeElement.focus();
        break;
    }
  }

  private moveActive(delta: number): void {
    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level) return;
    const next = findEnabledNodeIndex(level.nodes, level.activeIndex, delta);
    if (next !== null) this.moveActiveOnly(levelIndex, next);
  }

  // Moves the active row within a level, truncating any deeper levels first
  // (moving off a drilled row must close its flyout) — but does NOT open a
  // new flyout for the newly active row. Used by Up/Down/Home/End.
  private moveActiveOnly(levelIndex: number, index: number): void {
    this.levels.update((current) => {
      const next = current.slice(0, levelIndex + 1);
      const level = next[levelIndex];
      if (!level) return current;
      next[levelIndex] = { ...level, activeIndex: index };
      return next;
    });
  }

  // Sets the active row within a level AND opens its child flyout if it has
  // children, truncating any deeper levels first. Used by hover, ArrowRight,
  // and Enter/Space on a branch row.
  private drillInto(levelIndex: number, index: number): void {
    const anchor = this.getRowElement(levelIndex, index);
    this.levels.update((current) => {
      const next = current.slice(0, levelIndex + 1);
      const level = next[levelIndex];
      if (!level) return current;
      next[levelIndex] = { ...level, activeIndex: index };
      const node = level.nodes[index];
      if (node && !node.disabled && node.children?.length) {
        const childNodes = node.children;
        // Seed the new level's active row to its first enabled item (not
        // -1) — otherwise a subsequent ArrowRight/Enter at this level has no
        // active row to act on, since keyboard nav (unlike a fresh
        // openPanel()) has no other point where this gets seeded.
        const seededActive = findEnabledNodeIndex(childNodes, -1, 1) ?? -1;
        next.push({ nodes: childNodes, activeIndex: seededActive, anchorEl: anchor });
      }
      return next;
    });
  }

  private getRowElement(levelIndex: number, index: number): HTMLElement | null {
    const doc = this.triggerEl().nativeElement.ownerDocument;
    return doc.getElementById(this.rowId(levelIndex, index));
  }

  // Seeds the root level's active row to the top-level ancestor of the
  // current value (so keyboard nav starts at the right root branch) — does
  // NOT pre-drill into child/grandchild flyouts on reopen. Doing that would
  // need each intermediate level's row DOM element to already exist, which
  // isn't true until the previous level has actually rendered — a real
  // render-order dependency, not just an easy lookup. Cut as a nice-to-have,
  // same call this session made for FileUpload/InputNumber/Rating/TreeSelect/
  // Listbox: reopening always starts at the root, with the right branch
  // pre-highlighted, rather than a fully pre-drilled path.
  private buildInitialLevels(): DynamoCascadeLevel<TValue>[] {
    const rootNodes = this.nodes();
    const value = this.value();
    let activeIndex = value == null ? -1 : rootNodes.findIndex((node) => containsValue(node, value));
    if (activeIndex < 0) {
      activeIndex = findEnabledNodeIndex(rootNodes, -1, 1) ?? -1;
    }
    return [{ nodes: rootNodes, activeIndex, anchorEl: null }];
  }
}
