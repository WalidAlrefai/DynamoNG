import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  afterNextRender,
  computed,
  contentChild,
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
import { RouterLink } from '@angular/router';
import { TemplatePortal } from '@angular/cdk/portal';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { DynamoBadge } from '@dynamong/badge';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import { cn } from '@dynamong/utils/class-merge';
import { buildMegaPanelPositions } from './mega-menu.positioning';
import {
  megaMenuBarStyles,
  megaMenuChevronStyles,
  megaMenuCollapseTriggerStyles,
  megaMenuColumnHeaderStyles,
  megaMenuColumnStyles,
  megaMenuDrawerItemLeadingClasses,
  megaMenuDrawerItemStyles,
  megaMenuDrawerItemTrailingClasses,
  megaMenuDrawerPanelStyles,
  megaMenuEndStyles,
  megaMenuItemIconClasses,
  megaMenuItemStyles,
  megaMenuLinkContentStyles,
  megaMenuLinkIconClasses,
  megaMenuLinkRowStyles,
  megaMenuLinkSeparatorStyles,
  megaMenuLinkStyles,
  megaMenuLinkTrailingClasses,
  megaMenuPanelStyles,
  megaMenuRootStyles,
  megaMenuShortcutClasses,
  megaMenuStartStyles,
} from './mega-menu.styles';
import {
  isMegaMenuLinkSeparator,
  type DynamoMegaMenuItem,
  type DynamoMegaMenuLink,
  type DynamoMegaMenuOrientation,
  type DynamoMegaMenuPart,
} from './mega-menu.types';

/** One entry in the flattened, panel-wide list the virtual-focus cursor moves over. */
interface FlatLink {
  columnIndex: number;
  rowIndex: number;
  link: DynamoMegaMenuLink;
}

/**
 * A horizontal (or vertical) bar whose items open a single multi-column
 * "mega panel" of links. Simpler than `@dynamong/menubar` — one panel level
 * per bar item, no nested flyouts. Independently duplicated from Menubar's
 * roving-tabindex bar + single CDK overlay pattern (the overlay-menu family
 * never composes one component from another).
 *
 * Focus model mirrors Menubar: real DOM focus stays on the open bar item
 * (roving tabindex across the bar), and a virtual-focus cursor moves over
 * the panel's links via `aria-activedescendant`. Since `aria-activedescendant`
 * is invalid on a plain `menuitem`, the open bar item is temporarily
 * `role="combobox"` — the same axe-core workaround Menubar/Tiered Menu use.
 *
 * `start` / `end` slots are plain `ng-content`, projected into a wrapper
 * *outside* the `role="menubar"` element so arbitrary content there doesn't
 * trip axe's `aria-required-children`.
 */
@Component({
  selector: 'dg-mega-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './mega-menu.html',
  imports: [
    DynamoPassThroughDirective,
    DynamoBadge,
    NgTemplateOutlet,
    RouterLink,
  ],
})
export class DynamoMegaMenu extends DynamoBaseComponent<DynamoMegaMenuPart> {
  readonly items = input.required<DynamoMegaMenuItem[]>();
  readonly orientation = input<DynamoMegaMenuOrientation>('horizontal');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the `role="menubar"` bar element. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container in horizontal orientation. Vertical
   *  orientation is unaffected — its width is intrinsic (a fixed sidebar-
   *  like column). Defaults `true`. */
  readonly fluid = input(true);
  /** px width threshold below which the bar collapses into a hamburger trigger opening a drawer with the full item list. `null` (default) disables the feature entirely — zero behavior change for every existing consumer. */
  readonly collapseBreakpoint = input<number | null>(null);
  /** Two-way bindable: which bar item's mega panel is open, or `null`. */
  readonly openIndex = model<number | null>(null);
  readonly linkSelect = output<DynamoMegaMenuLink>();

  private readonly rootEl =
    viewChild.required<ElementRef<HTMLElement>>('rootEl');
  private readonly barItemEls =
    viewChildren<ElementRef<HTMLElement>>('barItemEl');
  private readonly collapseTriggerEl =
    viewChild<ElementRef<HTMLElement>>('collapseTriggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly drawerTemplate =
    viewChild.required<TemplateRef<unknown>>('drawerTemplate');
  /** Optional per-bar-item custom rendering — falls back to plain `{{ item.label }}` text when unset. */
  protected readonly itemTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoMegaMenuItem }>>(
      'itemTemplate',
    );
  /** Optional per-panel-link custom rendering — falls back to plain `{{ link.label }}` text when unset. Independent from `itemTemplate` since bar items and panel links are distinct types rendered in different DOM locations. */
  protected readonly linkTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoMegaMenuLink }>>(
      'linkTemplate',
    );
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly megaMenuId = this.idGenerator.next('dg-mega-menu');

  /** Roving-tabindex position across the bar — always exactly one item. */
  protected readonly focusedIndex = signal(0);
  /** Virtual-focus position within the open panel's flattened link list; -1 = none. */
  protected readonly activeLinkIndex = signal(-1);
  /** Derived from `collapseBreakpoint()` vs. the root element's own measured width — see the constructor's `afterNextRender`. */
  protected readonly collapsed = signal(false);
  /** Whether the collapsed hamburger's own drawer (a vertical list of the FULL `items()`, anchored to the hamburger) is open. Real focus stays on the hamburger throughout — the drawer's own rows are virtual-focus-only via `activeDrawerIndex`/`aria-activedescendant`, generalizing the same bar-item/panel-link relationship one level up. */
  protected readonly drawerOpen = signal(false);
  /** Virtual-focus position within the open drawer's own `items()` list; -1 = none. Independent of `activeLinkIndex`, which is for links *within* a column once a panel is open. */
  protected readonly activeDrawerIndex = signal(-1);
  private resizeObserver?: ResizeObserver;

  private panelHandle: (DynamoOverlayHandle & { forIndex: number }) | null =
    null;
  private drawerHandle: DynamoOverlayHandle | null = null;

  protected readonly openColumns = computed(() => {
    const idx = this.openIndex();
    if (idx === null) return [];
    return this.items()[idx]?.columns ?? [];
  });

  // Separators AND visible:false links are excluded here entirely (not
  // merely skipped during navigation, the way `disabled` links are) — a
  // separator never receives virtual focus or an `aria-activedescendant`
  // id, and neither does a hidden link, so neither must ever appear in this
  // list at all. The template still renders separators in their own
  // position within `column.items` directly, not from this flattened list;
  // a visible:false link renders nothing at all (see mega-menu.html).
  private readonly flatLinks = computed<FlatLink[]>(() => {
    const flat: FlatLink[] = [];
    this.openColumns().forEach((column, columnIndex) => {
      column.items.forEach((entry, rowIndex) => {
        if (isMegaMenuLinkSeparator(entry) || entry.visible === false) return;
        flat.push({ columnIndex, rowIndex, link: entry });
      });
    });
    return flat;
  });

  protected readonly activeDescendantId = computed(() => {
    if (this.openIndex() === null) return null;
    const active = this.flatLinks()[this.activeLinkIndex()];
    if (!active) return null;
    return this.linkId(active.columnIndex, active.rowIndex);
  });

  protected readonly activeDrawerDescendantId = computed(() => {
    if (!this.drawerOpen()) return null;
    const index = this.activeDrawerIndex();
    if (index < 0) return null;
    return this.drawerItemId(index);
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          megaMenuRootStyles({
            orientation: this.orientation(),
            fluid: this.fluid(),
          }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly barClasses = computed(() =>
    cn(
      megaMenuBarStyles({ orientation: this.orientation() }),
      this.ptFor('bar').class,
    ),
  );
  protected readonly startClasses = computed(() =>
    cn(megaMenuStartStyles, this.ptFor('start').class),
  );
  protected readonly endClasses = computed(() =>
    cn(megaMenuEndStyles, this.ptFor('end').class),
  );
  protected readonly panelClasses = computed(() =>
    cn(megaMenuPanelStyles, this.ptFor('panel').class),
  );
  protected readonly columnClasses = computed(() =>
    cn(megaMenuColumnStyles, this.ptFor('column').class),
  );
  protected readonly columnHeaderClasses = computed(() =>
    cn(megaMenuColumnHeaderStyles, this.ptFor('columnHeader').class),
  );
  protected readonly itemIconClasses = megaMenuItemIconClasses;
  protected readonly linkContentClasses = megaMenuLinkContentStyles;
  protected readonly linkIconClasses = megaMenuLinkIconClasses;
  protected readonly linkSeparatorClasses = megaMenuLinkSeparatorStyles;
  protected readonly linkRowClasses = megaMenuLinkRowStyles;
  protected readonly linkTrailingClasses = megaMenuLinkTrailingClasses;
  protected readonly shortcutClasses = megaMenuShortcutClasses;
  protected readonly isLinkSeparator = isMegaMenuLinkSeparator;
  protected readonly collapseTriggerClasses = computed(() =>
    cn(
      megaMenuCollapseTriggerStyles({ open: this.drawerOpen() }),
      this.ptFor('collapseTrigger').class,
    ),
  );
  protected readonly drawerPanelClasses = computed(() =>
    cn(megaMenuDrawerPanelStyles, this.ptFor('drawer').class),
  );
  protected readonly drawerItemLeadingClasses =
    megaMenuDrawerItemLeadingClasses;
  protected readonly drawerItemTrailingClasses =
    megaMenuDrawerItemTrailingClasses;

  constructor() {
    super();

    // Attach / detach / re-anchor the single mega panel off `openIndex()` —
    // an external `[(openIndex)]` write is honoured too. Like Menubar, a
    // sibling switch fully disposes and recreates the overlay (the anchor
    // element differs), rather than re-showing it.
    effect(() => {
      const idx = this.openIndex();
      if (idx === null) {
        this.destroyPanel();
        return;
      }
      if (this.panelHandle && this.panelHandle.forIndex !== idx) {
        this.destroyPanel();
      }
      if (!this.panelHandle) {
        this.attachPanel(idx);
      }
      // Seed the virtual-focus cursor to the first enabled link.
      this.activeLinkIndex.set(this.firstEnabledLink());
    });

    // Attach/detach the collapsed drawer's own overlay off `drawerOpen()` —
    // independent of the mega-panel effect above, since the two can be open
    // simultaneously (opening a branch item's panel from within the drawer
    // doesn't close the drawer, so the user can go back and pick another
    // top-level item).
    effect(() => {
      if (this.drawerOpen()) {
        if (!this.drawerHandle) this.attachDrawer();
        this.activeDrawerIndex.set(this.firstEnabledDrawerItem());
      } else {
        this.destroyDrawer();
      }
    });

    // Measures the root element's own width against `collapseBreakpoint()`
    // to drive `collapsed` — same `afterNextRender`-guarded precedent as
    // `listbox-base.component.ts`/`scroll-panel.ts` (viewChild.required()
    // only resolves once the view is initialized). Created whenever
    // `ResizeObserver` exists in the environment (not gated on
    // `collapseBreakpoint()` at setup time) so a consumer setting
    // `collapseBreakpoint` after initial render still gets correct behavior
    // on the next resize — `null` is instead checked inside the callback,
    // where `collapsed` is explicitly reset to `false` for that case.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      this.resizeObserver = new ResizeObserver((entries) => {
        const width = entries[0]?.contentRect.width;
        if (width === undefined) return;
        const breakpoint = this.collapseBreakpoint();
        this.collapsed.set(breakpoint !== null && width < breakpoint);
      });
      this.resizeObserver.observe(this.rootEl().nativeElement);
    });

    this.destroyRef.onDestroy(() => {
      this.destroyPanel();
      this.destroyDrawer();
      this.resizeObserver?.disconnect();
    });
  }

  protected linkId(columnIndex: number, rowIndex: number): string {
    return `${this.megaMenuId}-link-${columnIndex}-${rowIndex}`;
  }

  protected drawerItemId(index: number): string {
    return `${this.megaMenuId}-drawer-item-${index}`;
  }

  protected barItemClasses(index: number, item: DynamoMegaMenuItem): string {
    return cn(
      megaMenuItemStyles({
        open: this.openIndex() === index,
        disabled: !!item.disabled,
      }),
      this.ptFor('item').class,
    );
  }

  protected drawerItemClasses(index: number, item: DynamoMegaMenuItem): string {
    return cn(
      megaMenuDrawerItemStyles({
        active: this.activeDrawerIndex() === index,
        disabled: !!item.disabled,
      }),
      this.ptFor('drawerItem').class,
    );
  }

  protected chevronClasses(index: number): string {
    return megaMenuChevronStyles({ open: this.openIndex() === index });
  }

  protected linkClasses(link: DynamoMegaMenuLink, flatIndex: number): string {
    return cn(
      megaMenuLinkStyles({
        active: flatIndex === this.activeLinkIndex(),
        disabled: !!link.disabled,
      }),
      this.ptFor('link').class,
    );
  }

  /** Flat index of a link, for the `active`/`aria-activedescendant` wiring in the template. */
  protected flatIndexOf(columnIndex: number, rowIndex: number): number {
    return this.flatLinks().findIndex(
      (entry) =>
        entry.columnIndex === columnIndex && entry.rowIndex === rowIndex,
    );
  }

  protected onBarItemHover(index: number): void {
    if (this.openIndex() === null || this.openIndex() === index) return;
    this.switchTo(index);
  }

  protected onBarItemClick(index: number): void {
    const item = this.items()[index];
    if (!item || item.disabled) return;
    this.focusedIndex.set(index);
    this.barItemEls()[index]?.nativeElement.focus();
    if (item.columns?.length) {
      this.openIndex.set(this.openIndex() === index ? null : index);
    } else {
      this.commitLeaf(item);
    }
  }

  protected onLinkHover(flatIndex: number): void {
    this.activeLinkIndex.set(flatIndex);
  }

  protected onLinkClick(link: DynamoMegaMenuLink): void {
    if (link.disabled) return;
    this.commitLink(link);
  }

  protected onBarKeydown(event: KeyboardEvent): void {
    const barEls = this.barItemEls();
    const currentIndex = barEls.findIndex(
      (ref) => ref.nativeElement === event.target,
    );
    if (currentIndex === -1) return;

    if (this.openIndex() === null) {
      this.onClosedKeydown(event, currentIndex);
    } else {
      this.onOpenKeydown(event, this.openIndex() as number);
    }
  }

  private onClosedKeydown(event: KeyboardEvent, currentIndex: number): void {
    const vertical = this.orientation() === 'vertical';
    const nextKey = vertical ? 'ArrowDown' : 'ArrowRight';
    const prevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
    const openKey = vertical ? 'ArrowRight' : 'ArrowDown';

    if (event.key === nextKey) {
      event.preventDefault();
      this.focusBarIndex(this.findEnabledBarIndex(currentIndex, 1));
      return;
    }
    if (event.key === prevKey) {
      event.preventDefault();
      this.focusBarIndex(this.findEnabledBarIndex(currentIndex, -1));
      return;
    }

    switch (event.key) {
      case 'Home':
        event.preventDefault();
        this.focusBarIndex(this.findEnabledBarIndex(-1, 1));
        break;
      case 'End':
        event.preventDefault();
        this.focusBarIndex(this.findEnabledBarIndex(0, -1));
        break;
      case openKey:
      case 'Enter':
      case ' ': {
        const item = this.items()[currentIndex];
        if (!item || item.disabled) return;
        event.preventDefault();
        if (item.columns?.length) {
          this.focusedIndex.set(currentIndex);
          this.openIndex.set(currentIndex);
        } else if (event.key === 'Enter' || event.key === ' ') {
          this.commitLeaf(item);
        }
        break;
      }
      default:
        return;
    }
  }

  // Orientation-aware so the bar-roving axis never changes meaning across
  // the open/closed boundary: horizontal keeps Left/Right as sibling-switch
  // (unchanged from before this fix) with Down/Up newly bound to
  // panel-internal nav; vertical mirrors that exactly, keeping Up/Down as
  // sibling-switch (what they already meant one keystroke earlier, while
  // closed — see onClosedKeydown) with Left/Right taking panel-internal nav.
  // `collapsed()` forces the same vertical treatment regardless of
  // `orientation()` — the collapsed drawer is always a vertical list, so
  // Up/Down always switches between drawer items while a panel opened from
  // within it is active, matching the drawer's own roving axis exactly like
  // vertical mode matches the bar's.
  private onOpenKeydown(event: KeyboardEvent, idx: number): void {
    const vertical = this.collapsed() || this.orientation() === 'vertical';
    const switchNextKey = vertical ? 'ArrowDown' : 'ArrowRight';
    const switchPrevKey = vertical ? 'ArrowUp' : 'ArrowLeft';
    const navNextKey = vertical ? 'ArrowRight' : 'ArrowDown';
    const navPrevKey = vertical ? 'ArrowLeft' : 'ArrowUp';

    switch (event.key) {
      case navNextKey:
        event.preventDefault();
        this.moveActiveLink(1);
        break;
      case navPrevKey:
        event.preventDefault();
        this.moveActiveLink(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.activeLinkIndex.set(this.firstEnabledLink());
        break;
      case 'End':
        event.preventDefault();
        this.activeLinkIndex.set(this.lastEnabledLink());
        break;
      case switchNextKey:
        event.preventDefault();
        this.siblingSwitch(idx, 1);
        break;
      case switchPrevKey:
        event.preventDefault();
        this.siblingSwitch(idx, -1);
        break;
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const active = this.flatLinks()[this.activeLinkIndex()];
        if (active && !active.link.disabled) this.commitLink(active.link);
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.close();
        this.barItemEls()[idx]?.nativeElement.focus();
        break;
      case 'Tab':
        this.close();
        break;
      default:
        return;
    }
  }

  private moveActiveLink(delta: number): void {
    const links = this.flatLinks();
    let index = this.activeLinkIndex();
    for (let step = 0; step < links.length; step++) {
      index += delta;
      if (index < 0 || index >= links.length) return;
      if (!links[index]?.link.disabled) {
        this.activeLinkIndex.set(index);
        return;
      }
    }
  }

  private firstEnabledLink(): number {
    return this.flatLinks().findIndex((entry) => !entry.link.disabled);
  }

  private lastEnabledLink(): number {
    const links = this.flatLinks();
    for (let i = links.length - 1; i >= 0; i--) {
      if (!links[i]?.link.disabled) return i;
    }
    return -1;
  }

  private focusBarIndex(index: number | null): void {
    if (index === null) return;
    this.focusedIndex.set(index);
    this.barItemEls()[index]?.nativeElement.focus();
  }

  private siblingSwitch(fromIndex: number, delta: number): void {
    const next = this.findEnabledBarIndex(fromIndex, delta);
    if (next === null || next === fromIndex) return;
    this.switchTo(next);
  }

  private switchTo(index: number): void {
    const item = this.items()[index];
    if (!item || item.disabled) return;
    this.focusedIndex.set(index);
    this.barItemEls()[index]?.nativeElement.focus();
    // When collapsed, keep the drawer's own virtual-focus cursor in sync so
    // aria-activedescendant (on the hamburger) points at the row whose panel
    // just switched — same reasoning as the real-focus `.focus()` call above.
    if (this.collapsed()) {
      this.activeDrawerIndex.set(index);
    }
    this.openIndex.set(item.columns?.length ? index : null);
  }

  /** Wrapping scan for the next enabled, visible bar item — copy of Menubar's own `findEnabledBarIndex`. */
  private findEnabledBarIndex(from: number, delta: number): number | null {
    const itemsArr = this.items();
    if (itemsArr.length === 0) return null;
    let index = from;
    for (let step = 0; step < itemsArr.length; step++) {
      index = (index + delta + itemsArr.length) % itemsArr.length;
      const item = itemsArr[index];
      if (item && !item.disabled && item.visible !== false) return index;
    }
    return null;
  }

  private commitLeaf(item: DynamoMegaMenuItem): void {
    if (item.disabled) return;
    item.command?.();
    this.close();
  }

  private commitLink(link: DynamoMegaMenuLink): void {
    if (link.disabled) return;
    this.linkSelect.emit(link);
    link.command?.();
    const idx = this.openIndex();
    this.close();
    if (idx !== null) this.barItemEls()[idx]?.nativeElement.focus();
  }

  private close(): void {
    this.openIndex.set(null);
  }

  private attachPanel(idx: number): void {
    // While collapsed, drawer rows are virtual-focus-only (no real DOM
    // element tracked in `barItemEls()`, see the drawer's own template) — a
    // panel opened from within the drawer anchors to the hamburger instead,
    // the same way the drawer's own overlay already does.
    const anchorEl = this.collapsed()
      ? this.collapseTriggerEl()?.nativeElement
      : this.barItemEls()[idx]?.nativeElement;
    if (!anchorEl) return;
    const handle = this.overlayService.createConnectedOverlay(
      anchorEl,
      buildMegaPanelPositions(this.orientation()),
      { hasBackdrop: true, backdropClass: 'cdk-overlay-transparent-backdrop' },
    );
    handle.overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.close());
    handle.overlayRef.attach(
      new TemplatePortal(this.panelTemplate(), this.viewContainerRef),
    );
    this.panelHandle = { ...handle, forIndex: idx };
  }

  private destroyPanel(): void {
    this.panelHandle?.overlayRef.dispose();
    this.panelHandle = null;
  }

  protected onCollapseTriggerClick(): void {
    this.drawerOpen.update((open) => !open);
    // Click doesn't always focus a button (Safari) — same reasoning as the
    // regular bar item's own onBarItemClick.
    this.collapseTriggerEl()?.nativeElement.focus();
  }

  protected onCollapseTriggerKeydown(event: KeyboardEvent): void {
    if (!this.drawerOpen()) {
      switch (event.key) {
        case 'ArrowDown':
        case 'Enter':
        case ' ':
          event.preventDefault();
          this.drawerOpen.set(true);
          this.collapseTriggerEl()?.nativeElement.focus();
          break;
      }
      return;
    }
    // A panel opened from within the drawer takes over keyboard handling —
    // `onOpenKeydown` is already collapsed-aware (forces vertical-style
    // sibling-switch/panel-nav axes, see its own doc comment) and already
    // correctly no-ops the real-focus calls it makes while collapsed, since
    // focus never actually leaves the hamburger.
    if (this.openIndex() !== null) {
      this.onOpenKeydown(event, this.openIndex() as number);
      return;
    }
    this.onDrawerKeydown(event);
  }

  protected onDrawerItemHover(index: number): void {
    this.activeDrawerIndex.set(index);
  }

  protected onDrawerItemClick(index: number): void {
    const item = this.items()[index];
    if (!item || item.disabled) return;
    this.activeDrawerIndex.set(index);
    if (item.columns?.length) {
      this.openIndex.set(this.openIndex() === index ? null : index);
    } else {
      this.commitDrawerLeaf(item);
    }
  }

  // Navigates the drawer's own top-level `items()` list — architecturally
  // "the bar, but vertical and inside an overlay, with virtual instead of
  // real focus" (see `drawerOpen`'s own doc comment). Once a panel opens
  // from within it, control shifts to `onOpenKeydown` instead (see
  // `onCollapseTriggerKeydown`), which already generalizes to this same
  // list via `collapsed()`'s `vertical` treatment.
  private onDrawerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActiveDrawerItem(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveActiveDrawerItem(-1);
        break;
      case 'Home':
        event.preventDefault();
        this.activeDrawerIndex.set(this.firstEnabledDrawerItem());
        break;
      case 'End':
        event.preventDefault();
        this.activeDrawerIndex.set(this.lastEnabledDrawerItem());
        break;
      case 'ArrowRight': {
        event.preventDefault();
        const item = this.items()[this.activeDrawerIndex()];
        if (item && !item.disabled && item.columns?.length) {
          this.openIndex.set(this.activeDrawerIndex());
        }
        break;
      }
      case 'Enter':
      case ' ': {
        event.preventDefault();
        const item = this.items()[this.activeDrawerIndex()];
        if (!item || item.disabled) break;
        if (item.columns?.length) {
          this.openIndex.set(this.activeDrawerIndex());
        } else {
          this.commitDrawerLeaf(item);
        }
        break;
      }
      case 'Escape':
        event.preventDefault();
        this.closeDrawer();
        break;
      case 'Tab':
        this.closeDrawer();
        break;
      default:
        return;
    }
  }

  /** Non-wrapping scan, same shape as `moveActiveLink` — the drawer is a dropdown-style list, not a roving-tabindex bar, so it clamps at the ends rather than wrapping. */
  private moveActiveDrawerItem(delta: number): void {
    const itemsArr = this.items();
    let index = this.activeDrawerIndex();
    for (let step = 0; step < itemsArr.length; step++) {
      index += delta;
      if (index < 0 || index >= itemsArr.length) return;
      const item = itemsArr[index];
      if (item && !item.disabled && item.visible !== false) {
        this.activeDrawerIndex.set(index);
        return;
      }
    }
  }

  private firstEnabledDrawerItem(): number {
    return this.items().findIndex(
      (item) => !item.disabled && item.visible !== false,
    );
  }

  private lastEnabledDrawerItem(): number {
    const itemsArr = this.items();
    for (let i = itemsArr.length - 1; i >= 0; i--) {
      const item = itemsArr[i];
      if (item && !item.disabled && item.visible !== false) return i;
    }
    return -1;
  }

  private commitDrawerLeaf(item: DynamoMegaMenuItem): void {
    if (item.disabled) return;
    item.command?.();
    this.closeDrawer();
  }

  private closeDrawer(): void {
    this.drawerOpen.set(false);
    this.close(); // also closes any panel opened from within the drawer
    this.collapseTriggerEl()?.nativeElement.focus();
  }

  private attachDrawer(): void {
    const anchorEl = this.collapseTriggerEl()?.nativeElement;
    if (!anchorEl) return;
    // Always drops straight down from the hamburger (flipping up on
    // collision) regardless of `orientation()` — the hamburger is a single
    // bar-level trigger, not a "vertical sidebar panel," so the horizontal
    // position set is the right shape here even when the bar's own
    // orientation is vertical.
    const handle = this.overlayService.createConnectedOverlay(
      anchorEl,
      buildMegaPanelPositions('horizontal'),
      { hasBackdrop: true, backdropClass: 'cdk-overlay-transparent-backdrop' },
    );
    handle.overlayRef
      .backdropClick()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.closeDrawer());
    handle.overlayRef.attach(
      new TemplatePortal(this.drawerTemplate(), this.viewContainerRef),
    );
    this.drawerHandle = handle;
  }

  private destroyDrawer(): void {
    this.drawerHandle?.overlayRef.dispose();
    this.drawerHandle = null;
  }
}
