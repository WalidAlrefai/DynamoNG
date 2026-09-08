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
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoOverlayService, type DynamoOverlayHandle } from '@dynamong/core/overlay';
import { cn } from '@dynamong/utils/class-merge';
import { buildFlyoutPositions } from './tiered-menu.positioning';
import {
  tieredMenuCaretStyles,
  tieredMenuChevronStyles,
  tieredMenuItemStyles,
  tieredMenuPanelStyles,
  tieredMenuTriggerStyles,
} from './tiered-menu.styles';
import type {
  DynamoTieredMenuItem,
  DynamoTieredMenuPart,
  DynamoTieredMenuPosition,
} from './tiered-menu.types';

interface DynamoTieredMenuLevel {
  items: DynamoTieredMenuItem[];
  activeIndex: number;
  /** The row DOM element (in the *previous* level) this level's flyout is anchored to. `null` only for level 0, which anchors to the trigger instead. */
  anchorEl: HTMLElement | null;
}

// Independently duplicated from @dynamong/menu's own menu.ts (identical
// shape) — same "each overlay-family component keeps its own copy" precedent
// this codebase already established (Menu/Popover/SplitButton each have
// their own bottom/top-corner map; Context Menu/Cascade Select each have
// their own side-corner map).
const ROOT_POSITION_MAP: Record<DynamoTieredMenuPosition, ConnectedPosition> = {
  'bottom-start': { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 4 },
  'bottom-end': { originX: 'end', originY: 'bottom', overlayX: 'end', overlayY: 'top', offsetY: 4 },
  'top-start': { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -4 },
  'top-end': { originX: 'end', originY: 'top', overlayX: 'end', overlayY: 'bottom', offsetY: -4 },
};
const ALL_ROOT_POSITIONS: DynamoTieredMenuPosition[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
];
function buildRootPositions(preferred: DynamoTieredMenuPosition): ConnectedPosition[] {
  return [
    ROOT_POSITION_MAP[preferred],
    ...ALL_ROOT_POSITIONS.filter((candidate) => candidate !== preferred).map(
      (candidate) => ROOT_POSITION_MAP[candidate],
    ),
  ];
}

// Mirrors Cascade Select's findEnabledNodeIndex shape (linear scan, skip
// disabled, no wrap) — deliberately NOT Menu's flat findEnabledIndex, which
// wraps; multi-level nav doesn't wrap within a level, matching how real
// nested/submenu systems (and Cascade Select) behave.
function findEnabledItemIndex(
  items: DynamoTieredMenuItem[],
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
 * A nested multi-level action menu — submenus flyout to the side on
 * hover/click, with full keyboard navigation across levels.
 *
 * Architecture: the root level's trigger/overlay/backdrop/open-close shape is
 * independently duplicated from `@dynamong/menu` (own `attachOverlay`/
 * `detachOverlay`/`destroyOverlay`, own bottom/top position map); the
 * multi-level flyout-stack mechanic is independently duplicated from
 * `@dynamong/cascade-select` (a `levels` signal stack, a parallel plain-array
 * of CDK overlay handles synced to it by a constructor `effect()`, only the
 * root gets `hasBackdrop: true`). Neither is a real dependency — this
 * codebase's overlay-menu family never composes one overlay component from
 * another (confirmed via Context Menu, which only reuses `@dynamong/menu`'s
 * item *type*, not the component) — so this stays `tier:0`.
 *
 * Focus model: rows are virtual-focus-only. Real DOM focus stays on the
 * trigger the entire time (never moves into any portaled panel); the active
 * row across whichever level currently owns navigation is instead tracked via
 * `aria-activedescendant`, exactly like Cascade Select — Menu's own
 * real-DOM-focus-per-item approach doesn't generalize to several
 * simultaneously-open portaled panels at different levels.
 */
@Component({
  selector: 'dg-tiered-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tiered-menu.html',
})
export class DynamoTieredMenu extends DynamoBaseComponent<DynamoTieredMenuPart> {
  readonly items = input.required<DynamoTieredMenuItem[]>();
  /** Trigger button text, e.g. `<dg-tiered-menu label="File">`. */
  readonly label = input.required<string>();
  readonly position = input<DynamoTieredMenuPosition>('bottom-start');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable: `<dg-tiered-menu [(open)]="isOpen">`. */
  readonly open = model(false);
  readonly itemSelect = output<DynamoTieredMenuItem>();

  private readonly triggerEl = viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate = viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly menuId = this.idGenerator.next('dg-tiered-menu');
  protected readonly triggerId = `${this.menuId}-trigger`;

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;

  /** Every currently-open level: `levels()[0]` is the root panel (this component's own root overlay), `levels()[1..N]` are flyouts. */
  protected readonly levels = signal<DynamoTieredMenuLevel[]>([]);
  /** Which level currently owns Up/Down/Enter/Escape. */
  protected readonly activeLevelIndex = signal(0);
  /** `flyoutHandles[k]` backs `levels()[k + 1]` — a plain stack, push/pop only. */
  private readonly flyoutHandles: (DynamoOverlayHandle & { anchorEl: HTMLElement })[] = [];

  // `aria-activedescendant` is only an allowed attribute on a handful of
  // ARIA roles (menu/menubar/combobox/listbox/tree/grid/...) — a plain
  // (implicit-role) button isn't one of them. Cascade Select's own trigger
  // faces the identical "virtual focus lives on a separate portaled panel"
  // shape and solves it the same way: an explicit `role="combobox"` on the
  // trigger (see tiered-menu.html) purely to make aria-activedescendant
  // valid there, even though "combobox" isn't a perfect semantic fit for an
  // action menu — the same pragmatic trade-off, not an oversight.
  protected readonly activeDescendantId = computed(() => {
    if (!this.open()) return null;
    const levelIndex = this.activeLevelIndex();
    const level = this.levels()[levelIndex];
    if (!level || level.activeIndex < 0) return null;
    return this.rowId(levelIndex, level.activeIndex);
  });

  protected readonly triggerClasses = computed(() =>
    this.unstyled() ? this.styleClass() : cn(tieredMenuTriggerStyles(), this.styleClass()),
  );
  protected readonly chevronClasses = computed(() => tieredMenuChevronStyles({ open: this.open() }));
  protected readonly panelClasses = tieredMenuPanelStyles;
  protected readonly caretClasses = tieredMenuCaretStyles;

  constructor() {
    super();

    // Seeds/clears `levels` reactively off `open()` itself — not just from
    // this component's own `openMenu()` method — so `open` being flipped
    // true any other way (a consumer's own `[(open)]="isOpen"` two-way
    // binding, or `setInputs`/programmatic `.set(true)` in a test) still
    // populates the root level correctly. `openMenu()`/`toggle()` only need
    // to flip the `open` model; this effect does the rest.
    effect(() => {
      if (this.open()) {
        const rootItems = this.items();
        const activeIndex = findEnabledItemIndex(rootItems, -1, 1) ?? -1;
        this.levels.set([{ items: rootItems, activeIndex, anchorEl: null }]);
        this.activeLevelIndex.set(0);
      } else {
        this.levels.set([]);
        this.activeLevelIndex.set(0);
      }
    });

    effect(() => {
      if (this.open()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });

    // Resyncs `flyoutHandles` (levels 1..N) to `levels()` after every change —
    // a full resync rather than a surgical diff, same reasoning as Cascade
    // Select's identical effect: O(depth) per run is trivially cheap, and
    // obviously correct where a diff would need its own tests to trust.
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
          hasBackdrop: false, // only the root panel gets the backdrop that closes everything
        });
        handle.overlayRef.attach(
          new TemplatePortal(this.panelTemplate(), this.viewContainerRef, { levelIndex }),
        );
        this.flyoutHandles.push({ ...handle, anchorEl: anchor });
      }
    });

    this.destroyRef.onDestroy(() => {
      this.destroyOverlay();
      while (this.flyoutHandles.length > 0) {
        this.flyoutHandles.pop()?.overlayRef.dispose();
      }
    });
  }

  protected panelIdForLevel(levelIndex: number): string {
    return `${this.menuId}-level-${levelIndex}`;
  }

  protected rowId(levelIndex: number, index: number): string {
    return `${this.panelIdForLevel(levelIndex)}-row-${index}`;
  }

  protected itemClasses(item: DynamoTieredMenuItem, levelIndex: number, index: number) {
    const level = this.levels()[levelIndex];
    return tieredMenuItemStyles({
      active: level?.activeIndex === index,
      disabled: !!item.disabled,
    });
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.openMenu();
    }
  }

  // Just flips the model — the constructor effect above seeds `levels`
  // reactively off `open()` itself.
  private openMenu(): void {
    this.open.set(true);
  }

  protected close(): void {
    this.open.set(false);
  }

  private commitItem(item: DynamoTieredMenuItem): void {
    if (item.disabled) return;
    this.itemSelect.emit(item);
    item.command?.();
    this.close();
    // Real focus never left the trigger (see class doc comment), but stay
    // defensive about it rather than assume — same posture as Cascade
    // Select's own selectNode()/Escape handling.
    this.triggerEl().nativeElement.focus();
  }

  protected onItemHover(levelIndex: number, index: number): void {
    this.activeLevelIndex.set(levelIndex);
    this.drillInto(levelIndex, index);
  }

  protected onItemClick(levelIndex: number, index: number): void {
    const level = this.levels()[levelIndex];
    const item = level?.items[index];
    if (!item || item.disabled) return;
    if (item.children?.length) {
      this.onItemHover(levelIndex, index);
    } else {
      this.commitItem(item);
    }
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (!this.open()) {
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowUp':
        case 'Enter':
        case ' ':
          event.preventDefault();
          this.openMenu();
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
        const item = level.items[level.activeIndex];
        if (!item || item.disabled || !item.children?.length) break;
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
        const item = level.items[level.activeIndex];
        if (!item) break;
        if (item.children?.length) {
          this.drillInto(levelIndex, level.activeIndex);
          this.activeLevelIndex.set(levelIndex + 1);
        } else {
          this.commitItem(item);
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
    const doc = this.triggerEl().nativeElement.ownerDocument;
    return doc.getElementById(this.rowId(levelIndex, index));
  }

  private attachOverlay(): void {
    if (!this.overlayHandle) {
      const handle = this.overlayService.createConnectedOverlay(
        this.triggerEl().nativeElement,
        buildRootPositions(this.position()),
        { hasBackdrop: true, backdropClass: 'cdk-overlay-transparent-backdrop' },
      );
      handle.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.close());
      this.overlayHandle = handle;
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(this.panelTemplate(), this.viewContainerRef);
    }

    if (!this.overlayHandle.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.attach(this.portal);
    }
  }

  private detachOverlay(): void {
    if (this.overlayHandle?.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.detach();
    }
  }

  private destroyOverlay(): void {
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.portal = null;
  }
}
