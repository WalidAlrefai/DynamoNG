import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  computed,
  contentChild,
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
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import type { ConnectedPosition } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBadge } from '@dynamong/badge';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';
import type { DynamoPassThroughAttrs } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { DynamoMenuItem } from './menu-item';
import {
  menuChevronStyles,
  menuItemIconClasses,
  menuItemLeadingClasses,
  menuItemStyles,
  menuItemTrailingClasses,
  menuPanelStyles,
  menuSeparatorStyles,
  menuShortcutClasses,
  menuTriggerStyles,
} from './menu.styles';
import type {
  DynamoMenuItemSelectEvent,
  DynamoMenuPart,
  DynamoMenuPosition,
} from './menu.types';

const POSITION_MAP: Record<DynamoMenuPosition, ConnectedPosition> = {
  'bottom-start': {
    originX: 'start',
    originY: 'bottom',
    overlayX: 'start',
    overlayY: 'top',
    offsetY: 4,
  },
  'bottom-end': {
    originX: 'end',
    originY: 'bottom',
    overlayX: 'end',
    overlayY: 'top',
    offsetY: 4,
  },
  'top-start': {
    originX: 'start',
    originY: 'top',
    overlayX: 'start',
    overlayY: 'bottom',
    offsetY: -4,
  },
  'top-end': {
    originX: 'end',
    originY: 'top',
    overlayX: 'end',
    overlayY: 'bottom',
    offsetY: -4,
  },
};

const ALL_POSITIONS: DynamoMenuPosition[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
];

// Preferred corner first, the other three as CDK collision fallbacks.
function buildPositions(preferred: DynamoMenuPosition): ConnectedPosition[] {
  return [
    POSITION_MAP[preferred],
    ...ALL_POSITIONS.filter((candidate) => candidate !== preferred).map(
      (candidate) => POSITION_MAP[candidate],
    ),
  ];
}

@Component({
  selector: 'dg-menu',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoPassThroughDirective,
    DynamoBadge,
    NgTemplateOutlet,
    RouterLink,
  ],
  templateUrl: './menu.html',
})
export class DynamoMenu extends DynamoBaseComponent<DynamoMenuPart> {
  /** Trigger button text, e.g. `<dg-menu label="Actions">`. */
  readonly label = input.required<string>();
  readonly position = input<DynamoMenuPosition>('bottom-start');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the trigger button. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `false` — unlike every
   *  other reviewed trigger, this one never had a pre-existing full-width
   *  default to preserve (it's genuinely intrinsically sized today). */
  readonly fluid = input(false);
  /** Two-way bindable: `<dg-menu [(open)]="isOpen">`. */
  readonly open = model(false);
  /** Fires with a plain snapshot of the clicked item — not the `DynamoMenuItem` component instance. */
  readonly itemSelect = output<DynamoMenuItemSelectEvent>();

  protected readonly items = contentChildren(DynamoMenuItem);
  /** Optional projected template, falling back to plain text when
   *  omitted — mirrors `@dynamong/select`'s own `contentChild(TemplateRef)`
   *  idiom, same as Menubar's/TieredMenu's own `itemTemplate`. Replaces
   *  only a row's plain label text; icon/shortcut/badge still render
   *  around it unconditionally. */
  protected readonly itemTemplate =
    contentChild<TemplateRef<{ $implicit: DynamoMenuItem }>>('itemTemplate');
  private readonly itemButtons =
    viewChildren<ElementRef<HTMLElement>>('menuItemButton');
  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLElement>>('triggerEl');
  private readonly menuTemplate =
    viewChild.required<TemplateRef<unknown>>('menuTemplate');
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly menuId = this.idGenerator.next('dg-menu');
  protected readonly triggerId = `${this.menuId}-trigger`;

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  // Which item to focus once the panel attaches — set by the action that
  // opened the menu (click defaults to 'first'; ArrowUp on the trigger
  // requests 'last'), consumed once by the effect below.
  private readonly pendingFocus = signal<'first' | 'last' | null>(null);

  // No separate root wrapper element exists — the single top-level element
  // IS the trigger button, so `root` and `trigger` both merge onto it. Both
  // parts' non-class attrs are combined here (trigger's own win on a key
  // collision); each part's own `class` is merged separately below into
  // `triggerClasses`, matching this codebase's standing "pt directive never
  // handles class" convention. Same shape as TieredMenu's own trigger.
  protected readonly triggerPt = computed<DynamoPassThroughAttrs>(() => ({
    ...this.ptFor('root'),
    ...this.ptFor('trigger'),
  }));
  protected readonly triggerClasses = computed(() =>
    this.unstyled()
      ? cn(
          this.styleClass(),
          this.ptFor('root').class,
          this.ptFor('trigger').class,
        )
      : cn(
          menuTriggerStyles({ fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
          this.ptFor('trigger').class,
        ),
  );
  protected readonly chevronClasses = computed(() =>
    menuChevronStyles({ open: this.open() }),
  );
  protected readonly panelClasses = computed(() =>
    cn(menuPanelStyles, this.ptFor('panel').class),
  );
  protected readonly itemIconClasses = menuItemIconClasses;
  protected readonly itemLeadingClasses = menuItemLeadingClasses;
  protected readonly itemTrailingClasses = menuItemTrailingClasses;
  protected readonly shortcutClasses = menuShortcutClasses;
  protected readonly separatorClasses = menuSeparatorStyles;

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
      const index =
        target === 'first'
          ? this.findEnabledIndex(-1, 1)
          : this.findEnabledIndex(0, -1);
      this.pendingFocus.set(null);
      if (index !== null) {
        buttons[index]?.nativeElement.focus();
      }
    });

    this.destroyRef.onDestroy(() => this.destroyOverlay());
  }

  protected itemClasses(item: DynamoMenuItem) {
    return cn(
      menuItemStyles({ disabled: item.disabled() }),
      this.ptFor('item').class,
    );
  }

  protected toggle(): void {
    if (this.open()) {
      this.close();
    } else {
      this.pendingFocus.set('first');
      this.open.set(true);
    }
  }

  protected close(): void {
    this.open.set(false);
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.pendingFocus.set('first');
        this.open.set(true);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.pendingFocus.set('last');
        this.open.set(true);
        break;
      default:
        return;
    }
  }

  protected onMenuKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      this.triggerEl().nativeElement.focus();
      return;
    }
    if (event.key === 'Tab') {
      // Closes the open panel but doesn't trap focus — Tab moves on naturally.
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
    // Separators are never wired to (click) in the template, but guard
    // anyway — defense in depth, matches the existing disabled() guard.
    if (item.disabled() || item.separator()) {
      return;
    }
    // `exactOptionalPropertyTypes` forbids assigning `icon: undefined`
    // outright — the key is only included when actually set.
    const icon = item.icon();
    this.itemSelect.emit({
      value: item.value(),
      label: item.label(),
      disabled: item.disabled(),
      ...(icon !== undefined && { icon }),
    });
    this.close();
    this.triggerEl().nativeElement.focus();
  }

  private attachOverlay(): void {
    if (!this.overlayHandle) {
      const handle = this.overlayService.createConnectedOverlay(
        this.triggerEl().nativeElement,
        buildPositions(this.position()),
        {
          hasBackdrop: true,
          backdropClass: 'cdk-overlay-transparent-backdrop',
        },
      );
      handle.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.close();
          this.triggerEl().nativeElement.focus();
        });
      this.overlayHandle = handle;
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.menuTemplate(),
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

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled, non-separator, visible item index. Returns `null` if every item is disabled/a separator/invisible.
   *
   * `items()` and the `itemButtons()` viewChildren array are positionally
   * aligned one-to-one (same `@for` loop populates both) — an invisible
   * item must stay in the DOM via `[hidden]`, never `@if`-omitted, or this
   * index would no longer correspond to the right entry in `itemButtons()`.
   * Same reasoning as Menubar's own bar-level `visible` handling. */
  private findEnabledIndex(from: number, delta: number): number | null {
    const itemsArr = this.items();
    if (itemsArr.length === 0) {
      return null;
    }
    let index = from;
    for (let step = 0; step < itemsArr.length; step++) {
      index = (index + delta + itemsArr.length) % itemsArr.length;
      const item = itemsArr[index];
      if (!item?.disabled() && !item?.separator() && item?.visible()) {
        return index;
      }
    }
    return null;
  }
}
