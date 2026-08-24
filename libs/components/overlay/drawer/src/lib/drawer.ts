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
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConfigurableFocusTrap } from '@angular/cdk/a11y';
import type { GlobalPositionStrategy, OverlayRef } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { DynamoFocusTrapService } from '@dynamong/core/a11y';
import { DynamoOverlayService } from '@dynamong/core/overlay';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { isBrowser } from '@dynamong/utils/dom';
import { drawerCloseButtonStyles, drawerPanelStyles } from './drawer.styles';
import type { DynamoDrawerPart, DynamoDrawerPosition } from './drawer.types';

type DrawerAnimationState = 'closed' | 'opening' | 'open' | 'closing';

@Component({
  selector: 'dg-drawer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './drawer.html',
})
export class DynamoDrawer extends DynamoBaseComponent<DynamoDrawerPart> {
  /** Two-way bindable: `<dg-drawer [(open)]="isOpen">`. */
  readonly open = model(false);
  readonly position = input<DynamoDrawerPosition>('right');
  readonly size = input<DynamoSize>('md');
  readonly closeOnBackdropClick = input(true);
  readonly closeOnEscape = input(true);
  readonly title = input<string | undefined>(undefined);
  /** Required when no `title` is set, so the drawer has an accessible name. */
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly titleId = this.idGenerator.next('dg-drawer-title');

  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  private readonly drawerTemplate =
    viewChild.required<TemplateRef<unknown>>('drawerTemplate');
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly focusTrapService = inject(DynamoFocusTrapService);

  private overlayRef: OverlayRef | null = null;
  private portal: TemplatePortal | null = null;
  private focusTrap: ConfigurableFocusTrap | null = null;
  private previouslyFocusedElement: HTMLElement | null = null;

  // Must stay in sync with `duration-200` in drawerPanelStyles — there's no
  // shared constant between the two, same as Switch's `duration-150`.
  private static readonly CLOSE_DURATION_MS = 200;
  private readonly animationState = signal<DrawerAnimationState>('closed');
  private closeTimeoutId: ReturnType<typeof setTimeout> | null = null;

  protected readonly panelClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          drawerPanelStyles({
            position: this.position(),
            size: this.size(),
            visible: this.animationState() === 'open',
          }),
          this.styleClass(),
        ),
  );
  protected readonly closeButtonClasses = drawerCloseButtonStyles;

  constructor() {
    super();

    effect(() => {
      if (this.open()) {
        this.beginOpen();
      } else {
        this.beginClose();
      }
    });

    effect(() => {
      const panel = this.panelRef()?.nativeElement;
      const state = this.animationState();

      if (state === 'open' && panel) {
        this.activateFocusTrap(panel);
      } else if (state === 'closed' || state === 'closing') {
        this.releaseFocusTrap();
      }
    });

    this.destroyRef.onDestroy(() => {
      this.clearCloseTimeout();
      this.destroyOverlay();
    });
  }

  close(): void {
    this.open.set(false);
  }

  protected onBackdropClick(): void {
    if (this.closeOnBackdropClick()) {
      this.close();
    }
  }

  protected onEscape(): void {
    if (this.closeOnEscape()) {
      this.close();
    }
  }

  private beginOpen(): void {
    this.clearCloseTimeout();
    if (
      this.animationState() === 'open' ||
      this.animationState() === 'opening'
    ) {
      return;
    }

    this.attachOverlay();
    this.animationState.set('opening');

    // Double rAF, not single: a single callback can still run before the
    // browser has committed a paint at the closed transform in some
    // browsers/timings, which would coalesce the two states and skip the
    // slide entirely. This is the same deferred-class-flip technique CDK's
    // own overlay backdrop uses for its fade-in.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (this.open()) {
          this.animationState.set('open');
        }
      });
    });
  }

  private beginClose(): void {
    if (
      this.animationState() === 'closed' ||
      this.animationState() === 'closing'
    ) {
      return;
    }

    this.animationState.set('closing');
    this.closeTimeoutId = setTimeout(() => {
      this.detachOverlay();
      this.animationState.set('closed');
      this.closeTimeoutId = null;
    }, DynamoDrawer.CLOSE_DURATION_MS);
  }

  private clearCloseTimeout(): void {
    if (this.closeTimeoutId !== null) {
      clearTimeout(this.closeTimeoutId);
      this.closeTimeoutId = null;
    }
  }

  private attachOverlay(): void {
    if (!this.overlayRef) {
      const ref = this.overlayService.createGlobalOverlay(
        (strategy) => this.configureGlobalPosition(strategy, this.position()),
        { hasBackdrop: true },
      );
      ref
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.onBackdropClick());
      this.overlayRef = ref;
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.drawerTemplate(),
        this.viewContainerRef,
      );
    }

    if (!this.overlayRef.hasAttached()) {
      this.overlayRef.attach(this.portal);
    }
  }

  private detachOverlay(): void {
    if (this.overlayRef?.hasAttached()) {
      this.overlayRef.detach();
    }
  }

  private destroyOverlay(): void {
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.portal = null;
  }

  private configureGlobalPosition(
    strategy: GlobalPositionStrategy,
    position: DynamoDrawerPosition,
  ): void {
    switch (position) {
      case 'left':
        strategy.left('0').top('0').bottom('0');
        break;
      case 'right':
        strategy.right('0').top('0').bottom('0');
        break;
      case 'top':
        strategy.top('0').left('0').right('0');
        break;
      case 'bottom':
        strategy.bottom('0').left('0').right('0');
        break;
    }
  }

  private activateFocusTrap(panel: HTMLElement): void {
    if (this.focusTrap) {
      return;
    }
    if (isBrowser()) {
      this.previouslyFocusedElement =
        document.activeElement as HTMLElement | null;
    }
    this.focusTrap = this.focusTrapService.create(panel);
    // The focus trap's own initial-focus routine resolves asynchronously; move
    // focus into the panel synchronously too so it's never left on whatever
    // triggered the drawer.
    panel.focus();
  }

  private releaseFocusTrap(): void {
    if (!this.focusTrap) {
      return;
    }
    this.focusTrap.destroy();
    this.focusTrap = null;
    this.previouslyFocusedElement?.focus();
    this.previouslyFocusedElement = null;
  }
}
