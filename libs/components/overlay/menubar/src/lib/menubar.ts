import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoOverlayService, type DynamoOverlayHandle } from '@dynamong/core/overlay';
import { cn } from '@dynamong/utils/class-merge';
import { buildFlyoutPositions } from './menubar.positioning';
import {
  menubarBarStyles,
  menubarCaretStyles,
  menubarChevronStyles,
  menubarEndStyles,
  menubarItemStyles,
  menubarPanelStyles,
  menubarRootStyles,
  menubarRowStyles,
  menubarStartStyles,
} from './menubar.styles';
import type { DynamoMenubarItem, DynamoMenubarPart, DynamoMenubarPosition } from './menubar.types';

interface DynamoMenubarLevel {
  items: DynamoMenubarItem[];
  activeIndex: number;
  /** The row DOM element (in the *previous* level) this level's flyout is anchored to. Level 0 anchors to the open top-level bar item's own button element instead. */
  anchorEl: HTMLElement | null;
}

// Independently duplicated from Tiered Menu's own inline root-position map
// (identical shape) — this codebase's established "each overlay-family
// component keeps its own copy" precedent.
const ROOT_POSITION_MAP: Record<DynamoMenubarPosition, ConnectedPosition> = {
  'bottom-start': { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  'bottom-end': { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  'top-start': { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  'top-end': { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
};
const ALL_ROOT_POSITIONS: DynamoMenubarPosition[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
];
function buildRootPositions(preferred: DynamoMenubarPosition): ConnectedPosition[] {
  return [
    ROOT_POSITION_MAP[preferred],
    ...ALL_ROOT_POSITIONS.filter((candidate) => candidate !== preferred).map(
      (candidate) => ROOT_POSITION_MAP[candidate],
    ),
  ];
}

// Copy of Tiered Menu's module-level findEnabledItemIndex — linear scan,
// skip disabled, NO WRAP. Used for navigation *within* an open dropdown
// level (levels 1..N never wrap); the top-level bar itself uses a separate
// wrapping helper (`findEnabledBarIndex`, an instance method mirroring
// Tabs' own wrapping `findEnabledIndex`) since the bar behaves like a flat
// roving-tabindex row, not a nested level.
function findEnabledItemIndex(
  items: DynamoMenubarItem[],
  current: number,
  delta: number,
): number | null {
  let index = current + delta;
  while (index >= 0 && index < items.length) {
    if (!items[index]?.disabled) {
      return index;
    }
    index += delta;
  }
  return null;
}

/**
 * An always-visible, top-level horizontal navigation bar — dropdown
 * submenus with nested side-flyout submenus and full keyboard navigation.
 *
 * Architecture: this is the first component in the overlay-menu family to
 * merge two previously-separate precedents, neither composed as a real
 * dependency (this codebase's overlay-menu family never composes one
 * overlay component from another — confirmed via Context Menu, which only
 * reuses `@dynamong/menu`'s item *type*, not the component):
 * - The top-level bar is `@dynamong/tabs`' roving-tabindex row, independently
 *   duplicated: one keydown handler on the bar container resolves
 *   `currentIndex` via `event.target` lookup, `[tabindex]` follows
 *   `focusedIndex`, and ArrowLeft/Right/Home/End WRAP (`findEnabledBarIndex`,
 *   copied from Tabs' own `findEnabledIndex`).
 * - Each bar item's dropdown, and any nested flyouts beneath it, are
 *   `@dynamong/tiered-menu`'s multi-level flyout-stack mechanic, independently
 *   duplicated: a `levels` signal stack, a parallel plain-array of CDK
 *   overlay handles (`flyoutHandles`) synced to `levels()` by a constructor
 *   `effect()`, non-wrapping `findEnabledItemIndex` within a level.
 *
 * Unlike Tiered Menu (one fixed trigger, so its root overlay only ever
 * attaches/detaches), Menubar has N possible "roots" — one per bar item — so
 * its level-0 overlay (`rootHandle`) must fully dispose and recreate,
 * re-anchored to the new bar item, whenever `openIndex` switches between
 * siblings (see the second constructor effect).
 *
 * Focus model: real DOM focus lives on the bar items themselves (roving
 * tabindex, like Tabs) rather than one fixed trigger (unlike Tiered Menu).
 * While a bar item's dropdown is open, real focus stays on *that* item, and
 * virtual focus into the open dropdown/flyout stack is tracked via
 * `aria-activedescendant`, exactly like Tiered Menu — except bound
 * conditionally, per bar item, since any of the N items could be the one
 * currently holding it. `aria-activedescendant` is only a valid attribute on
 * a handful of ARIA roles (menu/menubar/combobox/listbox/tree/grid/...) — a
 * plain `menuitem` isn't one of them — so the one bar item that currently
 * owns an open dropdown temporarily becomes `role="combobox"` (menubar.html),
 * the same pragmatic axe-core workaround Tiered Menu already applies to its
 * single fixed trigger, just applied per-item here.
 *
 * Level-0 sibling-switch decision: at level 0 (a bar item's own dropdown,
 * before drilling into any nested flyout), ArrowRight drills in if the
 * active row is a branch, and otherwise (a leaf row, or nothing active)
 * falls through to switching to the next enabled bar item and opening its
 * dropdown (only if it itself has children — landing on a leaf sibling just
 * moves focus there). ArrowLeft at level 0 has no shallower level to back
 * out to, so it always switches to the previous enabled bar item. Both wrap
 * across the bar. This matches native desktop app menu bars (File → Right →
 * Edit). Escape is deliberately exempt — it always fully closes and
 * refocuses the *same* bar item, never a sibling, since Escape is the
 * unconditional "get me out" key. Hovering a sibling bar item while one
 * dropdown is open mirrors the same switch behavior.
 *
 * `start`/`end` slots: plain `ng-content` projection (a logo/brand image, a
 * search input, action buttons, ...) — no dedicated typed input, same
 * precedent as `@dynamong/toolbar`'s own `start`/`center`/`end` slots. They
 * sit in a wrapper *outside* the `role="menubar"` element (menubar.html)
 * rather than inside it: ARIA's menubar role only permits menuitem-family
 * children, so projected arbitrary content living directly inside it would
 * trip axe's `aria-required-children` rule.
 */
@Component({
  selector: 'dg-menubar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './menubar.html',
})
export class DynamoMenubar extends DynamoBaseComponent<DynamoMenubarPart> {
  readonly items = input.required<DynamoMenubarItem[]>();
  readonly position = input<DynamoMenubarPosition>('bottom-start');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable: `<dg-menubar [(openIndex)]="openIndex">` — which bar item's dropdown is currently open, or `null` if none. */
  readonly openIndex = model<number | null>(null);
  readonly itemSelect = output<DynamoMenubarItem>();

  private readonly barItemEls = viewChildren<ElementRef<HTMLElement>>('barItemEl');
  private readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly document = inject(DOCUMENT);

  protected readonly menubarId = this.idGenerator.next('dg-menubar');

  /** Roving-tabindex position across the bar — always exactly one item, open or closed. */
  protected readonly focusedIndex = signal(0);
  /** Every currently-open level: `levels()[0]` is the open bar item's own dropdown, `levels()[1..N]` are nested flyouts. */
  protected readonly levels = signal<DynamoMenubarLevel[]>([]);
  /** Which level currently owns Up/Down/Enter/Escape. */
  protected readonly activeLevelIndex = signal(0);
  /** `flyoutHandles[k]` backs `levels()[k + 1]` — a plain stack, push/pop only. */
  private readonly flyoutHandles: (DynamoOverlayHandle & { anchorEl: HTMLElement })[] = [];
  /** Backs `levels()[0]`. Tracks which bar item it's anchored to, so a sibling switch can detect the mismatch and re-anchor. */
  private rootHandle: (DynamoOverlayHandle & { forIndex: number }) | null = null;

  protected readonly activeDescendantId = computed(() => {
    if (this.openIndex() === null) return null;
    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level || level.activeIndex < 0) return null;
    return this.rowId(levelIndex, level.activeIndex);
  });

  // The `unstyled()`/`styleClass()` merge lives on the outer wrapper now
  // (same idiom as `@dynamong/toolbar`'s own `rootClasses`) — `barClasses`
  // itself is just the plain, un-overridable `role="menubar"` row.
  protected readonly rootClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(menubarRootStyles, this.styleClass()),
  );
  protected readonly barClasses = menubarBarStyles;
  protected readonly startClasses = menubarStartStyles;
  protected readonly endClasses = menubarEndStyles;
  protected readonly panelClasses = menubarPanelStyles;
  protected readonly caretClasses = menubarCaretStyles;

  constructor() {
    super();

    // Effect 1 — seeds/clears `levels` reactively off `openIndex()` itself
    // (not just from this component's own open-triggering methods) — same
    // reasoning as Tiered Menu's identical seed effect, so an external
    // `[(openIndex)]` two-way write still populates level 0 correctly.
    effect(() => {
      const idx = this.openIndex();
      if (idx === null) {
        this.levels.set([]);
        this.activeLevelIndex.set(0);
        return;
      }
      const children = this.items()[idx]?.children ?? [];
      const anchorEl = this.barItemEls()[idx]?.nativeElement ?? null;
      const activeIndex = findEnabledItemIndex(children, -1, 1) ?? -1;
      this.levels.set([{ items: children, activeIndex, anchorEl }]);
      this.activeLevelIndex.set(0);
    });

    // Effect 2 — attach/detach/re-anchor the level-0 (root) overlay off
    // `openIndex()`. Unlike Tiered Menu, whose single trigger never moves
    // (so it only ever attaches/detaches one overlay), Menubar has N
    // possible anchors — switching between sibling bar items must dispose
    // and recreate the overlay rather than just re-show it.
    effect(() => {
      const idx = this.openIndex();
      if (idx === null) {
        this.destroyRoot();
        return;
      }
      if (this.rootHandle && this.rootHandle.forIndex !== idx) {
        this.destroyRoot();
      }
      if (!this.rootHandle) {
        this.attachRoot(idx);
      }
    });

    // Effect 3 — resyncs `flyoutHandles` (levels 1..N) to `levels()` after
    // every change. Copied verbatim from Tiered Menu's identical effect: a
    // full resync rather than a surgical diff (O(depth) per run is trivially
    // cheap, and obviously correct where a diff would need its own tests).
    effect(() => {
      const current = this.levels();
      const neededFlyoutCount = Math.max(0, current.length - 1);

      while (this.flyoutHandles.length > neededFlyoutCount) {
        this.flyoutHandles.pop()?.overlayRef.dispose();
      }

      for (let k = this.flyoutHandles.length; k < neededFlyoutCount; k++) {
        const levelIndex = k + 1;
        const anchor = current[levelIndex]?.anchorEl;
        if (!anchor) break; // shouldn't happen — stay defensive rather than throw
        const handle = this.overlayService.createConnectedOverlay(anchor, buildFlyoutPositions(), {
          hasBackdrop: false, // only the level-0 dropdown gets the backdrop that closes everything
        });
        handle.overlayRef.attach(
          new TemplatePortal(this.panelTemplate(), this.viewContainerRef, { levelIndex }),
        );
        this.flyoutHandles.push({ ...handle, anchorEl: anchor });
      }
    });

    this.destroyRef.onDestroy(() => {
      this.destroyRoot();
      while (this.flyoutHandles.length > 0) {
        this.flyoutHandles.pop()?.overlayRef.dispose();
      }
    });
  }

  protected panelIdForLevel(levelIndex: number): string {
    return `${this.menubarId}-level-${levelIndex}`;
  }

  protected rowId(levelIndex: number, index: number): string {
    return `${this.panelIdForLevel(levelIndex)}-row-${index}`;
  }

  protected barItemClasses(index: number, item: DynamoMenubarItem) {
    return menubarItemStyles({ open: this.openIndex() === index, disabled: !!item.disabled });
  }

  protected chevronClasses(index: number) {
    return menubarChevronStyles({ open: this.openIndex() === index });
  }

  protected rowClasses(item: DynamoMenubarItem, levelIndex: number, index: number) {
    const level = this.levels()[levelIndex];
    return menubarRowStyles({ active: level?.activeIndex === index, disabled: !!item.disabled });
  }

  protected onBarItemHover(index: number): void {
    // Hover-switch only makes sense once a dropdown is already open — a
    // plain hover across a closed bar shouldn't open anything (that would
    // surprise mouse users expecting a click).
    if (this.openIndex() === null || this.openIndex() === index) return;
    this.switchTo(index);
  }

  protected onBarItemClick(index: number): void {
    const item = this.items()[index];
    if (!item || item.disabled) return;
    this.focusedIndex.set(index);
    // click doesn't always focus a button (Safari) — same reasoning as
    // Tabs' own onTabClick.
    this.barItemEls()[index]?.nativeElement.focus();
    if (item.children?.length) {
      this.openIndex.set(this.openIndex() === index ? null : index);
    } else {
      this.commitItem(item);
    }
  }

  protected onRowHover(levelIndex: number, index: number): void {
    this.activeLevelIndex.set(levelIndex);
    this.drillInto(levelIndex, index);
  }

  protected onRowClick(levelIndex: number, index: number): void {
    const level = this.levels()[levelIndex];
    const item = level?.items[index];
    if (!item || item.disabled) return;
    if (item.children?.length) {
      this.onRowHover(levelIndex, index);
    } else {
      this.commitItem(item);
    }
  }

  protected onMenubarKeydown(event: KeyboardEvent): void {
    const barEls = this.barItemEls();
    const currentIndex = barEls.findIndex((ref) => ref.nativeElement === event.target);
    if (currentIndex === -1) return;

    const idx = this.openIndex();

    if (idx === null) {
      this.onClosedBarKeydown(event, currentIndex, barEls);
      return;
    }

    this.onOpenDropdownKeydown(event, idx, barEls);
  }

  private onClosedBarKeydown(
    event: KeyboardEvent,
    currentIndex: number,
    barEls: readonly ElementRef<HTMLElement>[],
  ): void {
    switch (event.key) {
      case 'ArrowRight': {
        event.preventDefault();
        this.focusBarIndex(this.findEnabledBarIndex(currentIndex, 1), barEls);
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        this.focusBarIndex(this.findEnabledBarIndex(currentIndex, -1), barEls);
        break;
      }
      case 'Home': {
        event.preventDefault();
        this.focusBarIndex(this.findEnabledBarIndex(-1, 1), barEls);
        break;
      }
      case 'End': {
        event.preventDefault();
        this.focusBarIndex(this.findEnabledBarIndex(0, -1), barEls);
        break;
      }
      case 'ArrowDown': {
        const item = this.items()[currentIndex];
        if (!item || item.disabled || !item.children?.length) return; // nothing to open
        event.preventDefault();
        this.focusedIndex.set(currentIndex);
        this.openIndex.set(currentIndex);
        break;
      }
      case 'Enter':
      case ' ': {
        const item = this.items()[currentIndex];
        if (!item || item.disabled) return;
        event.preventDefault();
        if (item.children?.length) {
          this.focusedIndex.set(currentIndex);
          this.openIndex.set(currentIndex);
        } else {
          this.commitItem(item);
        }
        break;
      }
      default:
        return;
    }
  }

  private onOpenDropdownKeydown(
    event: KeyboardEvent,
    idx: number,
    barEls: readonly ElementRef<HTMLElement>[],
  ): void {
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
        this.moveActiveOnly(levelIndex, findEnabledItemIndex(level.items, -1, 1) ?? -1);
        break;
      case 'End':
        event.preventDefault();
        this.moveActiveOnly(
          levelIndex,
          findEnabledItemIndex(level.items, level.items.length, -1) ?? -1,
        );
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const row = level.items[level.activeIndex];
        if (row && !row.disabled && row.children?.length) {
          this.drillInto(levelIndex, level.activeIndex);
          this.activeLevelIndex.set(levelIndex + 1);
        } else if (levelIndex === 0) {
          // Nothing to drill into at the root dropdown — sideways instead
          // (see this class's doc comment for the full decision).
          this.siblingSwitch(idx, 1);
        }
        // Deeper levels: a leaf row with nothing to drill into is a no-op,
        // same as Tiered Menu — no sibling concept exists below level 0.
        break;
      }
      case 'ArrowLeft': {
        event.preventDefault();
        if (levelIndex > 0) {
          this.levels.update((current) => current.slice(0, levelIndex));
          this.activeLevelIndex.set(levelIndex - 1);
        } else {
          // Level 0 has no shallower level to back out to — always sideways.
          this.siblingSwitch(idx, -1);
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const row = level.items[level.activeIndex];
        if (!row) break;
        if (row.children?.length) {
          this.drillInto(levelIndex, level.activeIndex);
          this.activeLevelIndex.set(levelIndex + 1);
        } else {
          this.commitItem(row);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.closeAll();
        barEls[idx]?.nativeElement.focus(); // same item, never a sibling
        break;
      case 'Tab':
        // Closes the open dropdown but doesn't trap focus — Tab moves on naturally.
        this.closeAll();
        break;
      default:
        return;
    }
  }

  private focusBarIndex(index: number | null, barEls: readonly ElementRef<HTMLElement>[]): void {
    if (index === null) return;
    this.focusedIndex.set(index);
    barEls[index]?.nativeElement.focus();
  }

  private siblingSwitch(fromIndex: number, delta: number): void {
    const next = this.findEnabledBarIndex(fromIndex, delta);
    if (next === null || next === fromIndex) return; // only one enabled top-level item
    this.switchTo(next);
  }

  private switchTo(index: number): void {
    const item = this.items()[index];
    if (!item || item.disabled) return;
    this.focusedIndex.set(index);
    this.barItemEls()[index]?.nativeElement.focus();
    // A leaf sibling has no dropdown to open — just receives focus.
    this.openIndex.set(item.children?.length ? index : null);
  }

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled bar item index. Copy of Tabs' own `findEnabledIndex`, over `items()` instead of `contentChildren()`. */
  private findEnabledBarIndex(from: number, delta: number): number | null {
    const itemsArr = this.items();
    if (itemsArr.length === 0) return null;
    let index = from;
    for (let step = 0; step < itemsArr.length; step++) {
      index = (index + delta + itemsArr.length) % itemsArr.length;
      if (!itemsArr[index]?.disabled) return index;
    }
    return null;
  }

  private moveActive(delta: number): void {
    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level) return;
    const next = findEnabledItemIndex(level.items, level.activeIndex, delta);
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
      const item = level.items[index];
      if (item && !item.disabled && item.children?.length) {
        const childItems = item.children;
        const seededActive = findEnabledItemIndex(childItems, -1, 1) ?? -1;
        next.push({ items: childItems, activeIndex: seededActive, anchorEl: anchor });
      }
      return next;
    });
  }

  private getRowElement(levelIndex: number, index: number): HTMLElement | null {
    return this.document.getElementById(this.rowId(levelIndex, index));
  }

  private commitItem(item: DynamoMenubarItem): void {
    if (item.disabled) return;
    this.itemSelect.emit(item);
    item.command?.();
    this.closeAll();
    this.barItemEls()[this.focusedIndex()]?.nativeElement.focus();
  }

  private closeAll(): void {
    this.openIndex.set(null);
  }

  private attachRoot(idx: number): void {
    const anchorEl = this.barItemEls()[idx]?.nativeElement;
    if (!anchorEl) return;
    const handle = this.overlayService.createConnectedOverlay(
      anchorEl,
      buildRootPositions(this.position()),
      { hasBackdrop: true, backdropClass: 'cdk-overlay-transparent-backdrop' },
    );
    handle.overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeAll());
    handle.overlayRef.attach(
      new TemplatePortal(this.panelTemplate(), this.viewContainerRef, { levelIndex: 0 }),
    );
    this.rootHandle = { ...handle, forIndex: idx };
  }

  // Always fully disposes rather than detach-and-keep (contrast with Tiered
  // Menu, which can cheaply detach/reattach since its one trigger never
  // moves) — Menubar's anchor can differ on the next open (a different bar
  // item), so there's nothing worth keeping alive between opens.
  private destroyRoot(): void {
    this.rootHandle?.overlayRef.dispose();
    this.rootHandle = null;
  }
}
