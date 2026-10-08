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
import { DynamoButton } from '@dynamong/button';
import type {
  DynamoButtonSeverity,
  DynamoButtonSize,
  DynamoButtonVariant,
} from '@dynamong/button';
import { DynamoMenuItem, type DynamoMenuItemSelectEvent } from '@dynamong/menu';
import { cn } from '@dynamong/utils/class-merge';
import {
  splitButtonItemLeadingClasses,
  splitButtonItemStyles,
  splitButtonItemTrailingClasses,
  splitButtonPanelStyles,
  splitButtonPrimaryStyles,
  splitButtonRootStyles,
  splitButtonSeparatorStyles,
  splitButtonShortcutClasses,
  splitButtonTriggerStyles,
} from './split-button.styles';
import type {
  DynamoSplitButtonPart,
  DynamoSplitButtonPosition,
} from './split-button.types';

const POSITION_MAP: Record<DynamoSplitButtonPosition, ConnectedPosition> = {
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

const ALL_POSITIONS: DynamoSplitButtonPosition[] = [
  'bottom-start',
  'bottom-end',
  'top-start',
  'top-end',
];

// Preferred corner first, the other three as CDK collision fallbacks.
function buildPositions(
  preferred: DynamoSplitButtonPosition,
): ConnectedPosition[] {
  return [
    POSITION_MAP[preferred],
    ...ALL_POSITIONS.filter((candidate) => candidate !== preferred).map(
      (candidate) => POSITION_MAP[candidate],
    ),
  ];
}

/**
 * The chevron trigger is a plain native `<button>`, not a nested
 * `<dg-button>` — `DynamoButton` has no generic attribute passthrough (every
 * forwarded attribute is a deliberately-added typed input, and it has none
 * for `aria-haspopup`/`aria-expanded`) and no way to imperatively `.focus()`
 * its inner native button from a parent. `DynamoMenu`'s own trigger has the
 * same needs and solves them the same way.
 */
@Component({
  selector: 'dg-split-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoPassThroughDirective,
    DynamoBadge,
    NgTemplateOutlet,
    RouterLink,
  ],
  templateUrl: './split-button.html',
})
export class DynamoSplitButton extends DynamoBaseComponent<DynamoSplitButtonPart> {
  readonly label = input.required<string>();
  readonly severity = input<DynamoButtonSeverity>('primary');
  readonly variant = input<DynamoButtonVariant>('solid');
  readonly size = input<DynamoButtonSize>('md');
  readonly disabled = input(false);
  /** Disables only the primary action button, leaving the dropdown toggle usable. */
  readonly buttonDisabled = input(false);
  /** Disables only the dropdown-toggle button, leaving the primary action usable. */
  readonly menuButtonDisabled = input(false);
  readonly position = input<DynamoSplitButtonPosition>('bottom-start');
  readonly ariaLabel = input<string | undefined>(undefined);
  /** Forwarded as `aria-describedby` on the dropdown-toggle button. */
  readonly ariaDescribedby = input<string | undefined>(undefined);
  /** Fills the width of its container. Defaults `false` — like
   *  `@dynamong/menu`'s own trigger, this one never had a pre-existing
   *  full-width default to preserve (it's genuinely intrinsically sized
   *  today). The primary action button grows to fill the extra space;
   *  the chevron trigger stays a fixed aspect-square either way. */
  readonly fluid = input(false);
  /** Two-way bindable: `<dg-split-button [(open)]="isOpen">`. */
  readonly open = model(false);
  readonly action = output<void>();
  /** Fires with a plain snapshot of the clicked item — not the `DynamoMenuItem` component instance. */
  readonly itemSelect = output<DynamoMenuItemSelectEvent>();

  protected readonly items = contentChildren(DynamoMenuItem);
  private readonly triggerEl =
    viewChild.required<ElementRef<HTMLButtonElement>>('triggerEl');
  private readonly panelTemplate =
    viewChild.required<TemplateRef<unknown>>('panelTemplate');
  private readonly itemButtons =
    viewChildren<ElementRef<HTMLElement>>('itemButton');

  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  // Which item to focus once the panel attaches — set by the action that
  // opened the panel (click defaults to 'first'; ArrowUp on the trigger
  // requests 'last'), consumed once by the effect below.
  private readonly pendingFocus = signal<'first' | 'last' | null>(null);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(
          splitButtonRootStyles({ fluid: this.fluid() }),
          this.styleClass(),
          this.ptFor('root').class,
        ),
  );
  protected readonly isPrimaryDisabled = computed(
    () => this.disabled() || this.buttonDisabled(),
  );
  protected readonly isMenuDisabled = computed(
    () => this.disabled() || this.menuButtonDisabled(),
  );
  protected readonly primaryClasses = computed(() =>
    cn(
      splitButtonPrimaryStyles({ fluid: this.fluid() }),
      this.ptFor('primary').class,
    ),
  );
  protected readonly triggerClasses = computed(() =>
    cn(
      splitButtonTriggerStyles({
        size: this.size(),
        severity: this.severity(),
        variant: this.variant(),
      }),
      this.ptFor('trigger').class,
    ),
  );
  protected readonly panelClasses = computed(() =>
    cn(splitButtonPanelStyles, this.ptFor('panel').class),
  );
  protected readonly itemLeadingClasses = splitButtonItemLeadingClasses;
  protected readonly itemTrailingClasses = splitButtonItemTrailingClasses;
  protected readonly shortcutClasses = splitButtonShortcutClasses;
  protected readonly separatorClasses = splitButtonSeparatorStyles;

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
      splitButtonItemStyles({ disabled: item.disabled() }),
      this.ptFor('item').class,
    );
  }

  protected onPrimaryClick(): void {
    if (this.isPrimaryDisabled()) {
      return;
    }
    this.action.emit();
  }

  protected toggle(): void {
    if (this.isMenuDisabled()) {
      return;
    }
    if (this.open()) {
      this.close();
    } else {
      this.pendingFocus.set('first');
      this.open.set(true);
    }
  }

  protected close(): void {
    this.open.set(false);
    this.triggerEl().nativeElement.focus();
  }

  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isMenuDisabled()) {
      return;
    }
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
        .subscribe(() => this.close());
      this.overlayHandle = handle;
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

  /** Scans from `from`, stepping by `delta` (wrapping), for the next non-disabled, non-separator, visible item index. Returns `null` if every item is disabled/a separator/invisible.
   *
   * `items()` and the `itemButtons()` viewChildren array are positionally
   * aligned one-to-one (same `@for` loop populates both) — an invisible
   * item must stay in the DOM via `[hidden]`, never `@if`-omitted, or this
   * index would no longer correspond to the right entry in `itemButtons()`.
   * Same reasoning as `@dynamong/menu`'s own `visible` handling. */
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
