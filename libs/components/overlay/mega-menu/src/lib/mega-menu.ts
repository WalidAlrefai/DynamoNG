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
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import { cn } from '@dynamong/utils/class-merge';
import { buildMegaPanelPositions } from './mega-menu.positioning';
import {
  megaMenuBarStyles,
  megaMenuChevronStyles,
  megaMenuColumnHeaderStyles,
  megaMenuColumnStyles,
  megaMenuEndStyles,
  megaMenuItemStyles,
  megaMenuLinkStyles,
  megaMenuPanelStyles,
  megaMenuRootStyles,
  megaMenuStartStyles,
} from './mega-menu.styles';
import type {
  DynamoMegaMenuItem,
  DynamoMegaMenuLink,
  DynamoMegaMenuOrientation,
  DynamoMegaMenuPart,
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
})
export class DynamoMegaMenu extends DynamoBaseComponent<DynamoMegaMenuPart> {
  readonly items = input.required<DynamoMegaMenuItem[]>();
  readonly orientation = input<DynamoMegaMenuOrientation>('horizontal');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable: which bar item's mega panel is open, or `null`. */
  readonly openIndex = model<number | null>(null);
  readonly linkSelect = output<DynamoMegaMenuLink>();

  private readonly barItemEls = viewChildren<ElementRef<HTMLElement>>('barItemEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly megaMenuId = this.idGenerator.next('dg-mega-menu');

  /** Roving-tabindex position across the bar — always exactly one item. */
  protected readonly focusedIndex = signal(0);
  /** Virtual-focus position within the open panel's flattened link list; -1 = none. */
  protected readonly activeLinkIndex = signal(-1);

  private panelHandle: (DynamoOverlayHandle & { forIndex: number }) | null = null;

  protected readonly openColumns = computed(() => {
    const idx = this.openIndex();
    if (idx === null) return [];
    return this.items()[idx]?.columns ?? [];
  });

  private readonly flatLinks = computed<FlatLink[]>(() => {
    const flat: FlatLink[] = [];
    this.openColumns().forEach((column, columnIndex) => {
      column.items.forEach((link, rowIndex) => {
        flat.push({ columnIndex, rowIndex, link });
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

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          megaMenuRootStyles({ orientation: this.orientation() }),
          this.styleClass(),
        ),
  );
  protected readonly barClasses = computed(() =>
    megaMenuBarStyles({ orientation: this.orientation() }),
  );
  protected readonly startClasses = megaMenuStartStyles;
  protected readonly endClasses = megaMenuEndStyles;
  protected readonly panelClasses = megaMenuPanelStyles;
  protected readonly columnClasses = megaMenuColumnStyles;
  protected readonly columnHeaderClasses = megaMenuColumnHeaderStyles;

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

    this.destroyRef.onDestroy(() => this.destroyPanel());
  }

  protected linkId(columnIndex: number, rowIndex: number): string {
    return `${this.megaMenuId}-link-${columnIndex}-${rowIndex}`;
  }

  protected barItemClasses(index: number, item: DynamoMegaMenuItem): string {
    return megaMenuItemStyles({
      open: this.openIndex() === index,
      disabled: !!item.disabled,
    });
  }

  protected chevronClasses(index: number): string {
    return megaMenuChevronStyles({ open: this.openIndex() === index });
  }

  protected linkClasses(link: DynamoMegaMenuLink, flatIndex: number): string {
    return megaMenuLinkStyles({
      active: flatIndex === this.activeLinkIndex(),
      disabled: !!link.disabled,
    });
  }

  /** Flat index of a link, for the `active`/`aria-activedescendant` wiring in the template. */
  protected flatIndexOf(columnIndex: number, rowIndex: number): number {
    return this.flatLinks().findIndex(
      (entry) => entry.columnIndex === columnIndex && entry.rowIndex === rowIndex,
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

  private onOpenKeydown(event: KeyboardEvent, idx: number): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveActiveLink(1);
        break;
      case 'ArrowUp':
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
      case 'ArrowRight':
        event.preventDefault();
        this.siblingSwitch(idx, 1);
        break;
      case 'ArrowLeft':
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
    this.openIndex.set(item.columns?.length ? index : null);
  }

  /** Wrapping scan for the next enabled bar item — copy of Menubar's own `findEnabledBarIndex`. */
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
    const anchorEl = this.barItemEls()[idx]?.nativeElement;
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
}
