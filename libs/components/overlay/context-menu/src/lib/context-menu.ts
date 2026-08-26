import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  contentChildren,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import {
  DynamoOverlayService,
  buildConnectedCornerPositions,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import { isBrowser } from '@dynamong/utils/dom';
import { DynamoMenuItem } from '@dynamong/menu';
import { cn } from '@dynamong/utils/class-merge';
import {
  contextMenuItemStyles,
  contextMenuPanelStyles,
  contextMenuTriggerStyles,
} from './context-menu.styles';
import type { DynamoContextMenuPart } from './context-menu.types';

interface Point {
  x: number;
  y: number;
}

/**
 * Positioned at the cursor via `DynamoOverlayService.createConnectedOverlay`
 * with a plain `{x, y}` point as the origin (CDK's flexibleConnectedTo()
 * origin type accepts one, not just an element) rather than the separate
 * `createGlobalOverlay` — this keeps the collision/flip-to-stay-onscreen
 * behavior every other overlay component here already gets for free.
 *
 * Unlike Menu/Popover/SplitButton, there's no single dedicated trigger
 * button to return focus to on close — the trigger is arbitrary projected
 * content (a card, a row, plain text) that may not be focusable at all,
 * matching how dismissing a native OS context menu doesn't force focus onto
 * whatever was right-clicked either. So focus is captured on open and
 * restored on close only if there was something to restore.
 *
 * No CDK backdrop (unlike Menu/Popover/SplitButton): a context menu's
 * trigger is a whole content region a user right-clicks repeatedly, often at
 * different points — a full-screen backdrop would intercept every one of
 * those follow-up right-clicks before they ever reached the trigger's own
 * `(contextmenu)` binding, breaking in-place repositioning. Dismissal is
 * instead handled by a plain `document` click/contextmenu listener that
 * closes whenever the event lands outside both the trigger and the panel.
 */
@Component({
  selector: 'dg-context-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './context-menu.html',
})
export class DynamoContextMenu extends DynamoBaseComponent<DynamoContextMenuPart> {
  readonly disabled = input(false);
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Two-way bindable: `<dg-context-menu [(open)]="isOpen">`. */
  readonly open = model(false);
  readonly itemSelect = output<string>();

  protected readonly items = contentChildren(DynamoMenuItem);
  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly itemButtons =
    viewChildren<ElementRef<HTMLElement>>('itemButton');

  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  private pendingOrigin: Point | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;
  // Always 'first' here — unlike Menu, there's no ArrowUp-opens-last
  // concept, since the only thing that opens this panel is the
  // (right-click-or-Menu-key-triggered) contextmenu event.
  private readonly pendingFocus = signal<'first' | null>(null);

  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(contextMenuTriggerStyles, this.styleClass()),
  );
  protected readonly panelClasses = contextMenuPanelStyles;

  constructor() {
    super();

    effect(() => {
      if (this.open()) {
        this.attachOverlay();
      } else {
        this.detachOverlay();
      }
    });

    // Runs whenever the requested focus target or the (async-attached) item
    // buttons change, so it correctly waits for the portal's embedded view
    // to exist rather than assuming attach() populated it synchronously.
    effect(() => {
      const target = this.pendingFocus();
      if (target === null || !this.open()) {
        return;
      }
      const buttons = this.itemButtons();
      if (buttons.length === 0) {
        return;
      }
      const index = this.findEnabledIndex(-1, 1);
      this.pendingFocus.set(null);
      if (index !== null) {
        buttons[index]?.nativeElement.focus();
      }
    });

    if (isBrowser()) {
      document.addEventListener('click', this.onOutsideDismiss);
      document.addEventListener('contextmenu', this.onOutsideDismiss);
    }
    this.destroyRef.onDestroy(() => {
      this.destroyOverlay();
      if (isBrowser()) {
        document.removeEventListener('click', this.onOutsideDismiss);
        document.removeEventListener('contextmenu', this.onOutsideDismiss);
      }
    });
  }

  // Closes on any click/contextmenu that lands outside the panel — matching
  // native Chrome context menus, a left-click anywhere (including back on
  // the trigger that opened it) dismisses the menu. A right-click on the
  // trigger is the one exception: it's left alone so onContextMenu's own
  // binding can reposition instead of this closing it out from under that
  // logic.
  private readonly onOutsideDismiss = (event: MouseEvent): void => {
    if (!this.open()) {
      return;
    }
    const target = event.target as Node;
    const panelEl = this.overlayHandle?.overlayRef.overlayElement;
    if (panelEl?.contains(target)) {
      return; // the panel manages its own clicks (item selection)
    }
    if (
      event.type === 'contextmenu' &&
      this.triggerEl().nativeElement.contains(target)
    ) {
      return;
    }
    this.close();
  };

  protected itemClasses(item: DynamoMenuItem) {
    return contextMenuItemStyles({ disabled: item.disabled() });
  }

  protected onContextMenu(event: MouseEvent): void {
    if (this.disabled()) {
      return;
    }
    event.preventDefault();
    this.pendingOrigin = { x: event.clientX, y: event.clientY };
    this.pendingFocus.set('first');
    if (this.open()) {
      // setOrigin() only stores the new point — it doesn't itself recompute
      // or move the pane; updatePosition() is what actually re-applies it.
      this.overlayHandle?.positionStrategy.setOrigin(this.pendingOrigin);
      this.overlayHandle?.overlayRef.updatePosition();
    } else {
      if (isBrowser()) {
        this.previouslyFocusedElement =
          document.activeElement as HTMLElement | null;
      }
      this.open.set(true);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.previouslyFocusedElement?.focus();
    this.previouslyFocusedElement = null;
  }

  protected onPanelKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    const buttons = this.itemButtons();
    let nextIndex: number | null;
    switch (event.key) {
      case 'ArrowDown': {
        const currentIndex = buttons.findIndex(
          (ref) => ref.nativeElement === event.target,
        );
        if (currentIndex === -1) return;
        nextIndex = this.findEnabledIndex(currentIndex, 1);
        break;
      }
      case 'ArrowUp': {
        const currentIndex = buttons.findIndex(
          (ref) => ref.nativeElement === event.target,
        );
        if (currentIndex === -1) return;
        nextIndex = this.findEnabledIndex(currentIndex, -1);
        break;
      }
      case 'Home':
        nextIndex = this.findEnabledIndex(-1, 1);
        break;
      case 'End':
        nextIndex = this.findEnabledIndex(0, -1);
        break;
      default:
        return;
    }
    event.preventDefault();
    if (nextIndex === null) return;
    buttons[nextIndex]?.nativeElement.focus();
  }

  protected onItemClick(item: DynamoMenuItem): void {
    if (item.disabled()) {
      return;
    }
    this.itemSelect.emit(item.value());
    this.close();
  }

  private attachOverlay(): void {
    const origin = this.pendingOrigin ?? { x: 0, y: 0 };

    if (!this.overlayHandle) {
      this.overlayHandle = this.overlayService.createConnectedOverlay(
        origin,
        buildConnectedCornerPositions('bottom-start'),
      );
    } else {
      this.overlayHandle.positionStrategy.setOrigin(origin);
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.panelTemplate(),
        this.viewContainerRef,
      );
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

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled item index. Returns `null` if every item is disabled. */
  private findEnabledIndex(from: number, delta: number): number | null {
    const itemsArr = this.items();
    if (itemsArr.length === 0) {
      return null;
    }
    let index = from;
    for (let step = 0; step < itemsArr.length; step++) {
      index = (index + delta + itemsArr.length) % itemsArr.length;
      if (!itemsArr[index]?.disabled()) {
        return index;
      }
    }
    return null;
  }
}
