import {
  DestroyRef,
  Directive,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConnectedPosition, OverlayConfig } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { DynamoBaseComponent } from '@dynamong/core/base';
import {
  DynamoOverlayService,
  type DynamoOverlayHandle,
} from '@dynamong/core/overlay';

/**
 * Shared CDK-Overlay open/close/position/backdrop lifecycle for a
 * trigger-button + floating-listbox widget. Lifted from `DynamoMenu`'s
 * `attachOverlay`/`detachOverlay`/`destroyOverlay` (the mechanics are
 * precedent; the ARIA roles are not — concrete subclasses use
 * combobox/listbox/option roles, not Menu's menu/menuitem roles).
 *
 * Concrete subclasses (`DynamoSelect`, `DynamoMultiSelect`) supply the
 * trigger element, panel template, and position list, and are responsible
 * for their own `effect()` that calls `attachOverlay()`/`detachOverlay()`
 * as `isOpen()` changes, plus `destroyRef.onDestroy(() => this.destroyOverlay())`
 * — an `effect()` needs the concrete component's own injection context, so
 * it can't be cleanly hoisted into this abstract base's constructor.
 *
 * `@Directive()` with no selector, mirroring `DynamoBaseComponent` itself —
 * required so Angular's template type checker resolves `styleClass`/`pt`/
 * `unstyled` (declared on `DynamoBaseComponent`, one level further up) as
 * known inputs on `DynamoSelect`/`DynamoMultiSelect` when they're used from
 * a DIFFERENT library's template (e.g. `DynamoPagination` reusing
 * `<dg-select>`). Without a decorator here, ngtsc's cross-package template
 * checking loses the inherited-input chain past this undecorated
 * intermediate class (NG8002 "not a known property"), even though
 * same-project usage and runtime binding both happen to work either way.
 */
@Directive()
export abstract class DynamoListboxBase<
  TPart extends string = 'root',
> extends DynamoBaseComponent<TPart> {
  protected readonly isOpen = signal(false);
  protected readonly activeIndex = signal(-1);

  protected readonly overlayService = inject(DynamoOverlayService);
  protected readonly viewContainerRef = inject(ViewContainerRef);
  protected readonly destroyRef = inject(DestroyRef);

  private overlayHandle: DynamoOverlayHandle | null = null;
  private portal: TemplatePortal | null = null;
  private resizeObserver: ResizeObserver | null = null;

  protected abstract triggerElRef(): ElementRef<HTMLElement>;
  protected abstract panelTemplateRef(): TemplateRef<unknown>;
  protected abstract overlayPositions(): ConnectedPosition[];

  /**
   * Override to true to keep the overlay panel's width matched to the
   * trigger's width, live-synced via `ResizeObserver` as the trigger
   * resizes. Defaults to false — `DynamoSelect`/`DynamoMultiSelect` keep
   * their fixed min-width, content-sized panel regardless of the trigger's
   * width (see `selectPanelWrapperStyles`' own comment). `DynamoAutocomplete`
   * overrides this to true, since its trigger is a directly-typed-into text
   * field where a width-matched panel is the expected behavior.
   */
  protected matchOverlayWidthToTrigger(): boolean {
    return false;
  }

  protected attachOverlay(): void {
    if (!this.overlayHandle) {
      const config: Partial<OverlayConfig> = {
        hasBackdrop: true,
        backdropClass: 'cdk-overlay-transparent-backdrop',
      };
      if (this.matchOverlayWidthToTrigger()) {
        config.width =
          this.triggerElRef().nativeElement.getBoundingClientRect().width;
      }

      const handle = this.overlayService.createConnectedOverlay(
        this.triggerElRef().nativeElement,
        this.overlayPositions(),
        config,
      );
      handle.overlayRef
        .backdropClick()
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => this.close());
      this.overlayHandle = handle;

      // Not implemented in jsdom — guarded rather than assumed, same
      // defensiveness as other real-browser-only APIs used in this codebase
      // (e.g. setPointerCapture in Carousel/Slider). The initial width above
      // is still set either way; only live resize-tracking is skipped.
      if (
        this.matchOverlayWidthToTrigger() &&
        typeof ResizeObserver !== 'undefined'
      ) {
        this.resizeObserver = new ResizeObserver((entries) => {
          const width = entries[0]?.contentRect.width;
          if (width !== undefined) {
            this.overlayHandle?.overlayRef.updateSize({ width });
          }
        });
        this.resizeObserver.observe(this.triggerElRef().nativeElement);
      }
    }

    if (!this.portal) {
      this.portal = new TemplatePortal(
        this.panelTemplateRef(),
        this.viewContainerRef,
      );
    }

    if (!this.overlayHandle.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.attach(this.portal);
    }
  }

  protected detachOverlay(): void {
    if (this.overlayHandle?.overlayRef.hasAttached()) {
      this.overlayHandle.overlayRef.detach();
    }
  }

  protected destroyOverlay(): void {
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.portal = null;
  }

  /** Closes the panel (and performs any subclass-specific side effect, e.g. marking a CVA touched) — called on Escape, backdrop click, and option selection. */
  protected abstract close(): void;
}
