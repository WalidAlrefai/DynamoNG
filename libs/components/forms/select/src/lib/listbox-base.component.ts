import {
  DestroyRef,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import type { ConnectedPosition } from '@angular/cdk/overlay';
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
 */
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

  protected abstract triggerElRef(): ElementRef<HTMLElement>;
  protected abstract panelTemplateRef(): TemplateRef<unknown>;
  protected abstract overlayPositions(): ConnectedPosition[];

  protected attachOverlay(): void {
    if (!this.overlayHandle) {
      const handle = this.overlayService.createConnectedOverlay(
        this.triggerElRef().nativeElement,
        this.overlayPositions(),
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
    this.overlayHandle?.overlayRef.dispose();
    this.overlayHandle = null;
    this.portal = null;
  }

  /** Closes the panel (and performs any subclass-specific side effect, e.g. marking a CVA touched) — called on Escape, backdrop click, and option selection. */
  protected abstract close(): void;
}
