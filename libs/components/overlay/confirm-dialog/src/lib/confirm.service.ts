import { ComponentRef, Injectable, Injector, inject } from '@angular/core';
import type { OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { DynamoOverlayService } from '@dynamong/core/overlay';
import {
  confirmBackdropClass,
  confirmBackdropHiddenClass,
  confirmBackdropVisibleClass,
} from './confirm.styles';
import type { DynamoConfirmEntry, DynamoConfirmOptions } from './confirm.types';
import { DynamoConfirmContainer } from './confirm-container';

interface QueuedConfirm {
  entry: DynamoConfirmEntry;
  resolve: (value: boolean) => void;
}

interface ActiveConfirm extends QueuedConfirm {
  overlayRef: OverlayRef;
  componentRef: ComponentRef<DynamoConfirmContainer>;
  subs: Subscription;
  // True once settle() has started closing this one — guards against a
  // second confirm()/cancel() (or backdrop click/Escape firing again) from
  // re-entering settle() during the exit-animation delay below, before
  // dispose() has actually run and cleared `this.active`.
  settling: boolean;
}

@Injectable({ providedIn: 'root' })
export class DynamoConfirmService {
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly injector = inject(Injector);

  // Must stay in sync with `duration-200` in confirmPanelStyles.
  private static readonly CLOSE_DURATION_MS = 200;

  private readonly queue: QueuedConfirm[] = [];
  private active: ActiveConfirm | null = null;

  /**
   * Shows a confirm prompt. Resolves `true` if the user confirms, `false` if
   * they cancel, click the backdrop, or press Escape. Only one prompt is ever
   * visible at a time — calling `open()` while one is already showing queues
   * the new request until the current one settles.
   */
  open(options: DynamoConfirmOptions): Promise<boolean> {
    const entry: DynamoConfirmEntry = {
      message: options.message,
      title: options.title,
      confirmLabel: options.confirmLabel ?? 'Confirm',
      cancelLabel: options.cancelLabel ?? 'Cancel',
      severity: options.severity ?? 'primary',
      closeOnBackdropClick: options.closeOnBackdropClick ?? true,
      closeOnEscape: options.closeOnEscape ?? true,
      showCancel: options.showCancel ?? true,
      defaultFocus: options.defaultFocus ?? 'none',
    };

    return new Promise<boolean>((resolve) => {
      this.queue.push({ entry, resolve });
      if (!this.active) {
        this.presentNext();
      }
    });
  }

  /** Confirms the currently-showing prompt, as if its confirm button were clicked. */
  confirm(): void {
    this.settle(true);
  }

  /** Cancels the currently-showing prompt, as if its cancel button were clicked. */
  cancel(): void {
    this.settle(false);
  }

  private presentNext(): void {
    const next = this.queue.shift();
    if (!next) {
      return;
    }

    const overlayRef = this.overlayService.createGlobalOverlay(
      (strategy) => strategy.centerHorizontally().centerVertically(),
      { hasBackdrop: true, backdropClass: confirmBackdropClass },
    );
    const componentRef = overlayRef.attach(
      new ComponentPortal(DynamoConfirmContainer, null, this.injector),
    );
    componentRef.setInput('request', next.entry);
    // Same zoneless-CD workaround as `DynamoToastService`: a portal-mounted
    // component sits outside the app's own view tree, so nothing else ticks
    // its change detector for the `request` input to render synchronously.
    componentRef.changeDetectorRef.detectChanges();

    // CDK renders the backdrop element outside any template (see
    // confirmBackdropClass's own comment), so its fade-in has to be
    // toggled imperatively rather than template-bound. Double rAF to match
    // the panel's own entrance timing in confirm-container.ts.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        overlayRef.backdropElement?.classList.replace(
          confirmBackdropHiddenClass,
          confirmBackdropVisibleClass,
        );
      });
    });

    const subs = new Subscription();
    subs.add(
      overlayRef.backdropClick().subscribe(() => {
        if (next.entry.closeOnBackdropClick) {
          this.cancel();
        }
      }),
    );
    subs.add(
      overlayRef.keydownEvents().subscribe((event) => {
        if (event.key === 'Escape' && next.entry.closeOnEscape) {
          this.cancel();
        }
      }),
    );

    this.active = { ...next, overlayRef, componentRef, subs, settling: false };
  }

  private settle(result: boolean): void {
    const active = this.active;
    if (!active || active.settling) {
      return;
    }
    active.settling = true;

    active.subs.unsubscribe();
    active.componentRef.instance.beginClose();
    active.overlayRef.backdropElement?.classList.replace(
      confirmBackdropVisibleClass,
      confirmBackdropHiddenClass,
    );
    active.componentRef.changeDetectorRef.detectChanges();

    active.resolve(result);

    // Deferred so the panel's exit transition plays before the overlay is
    // actually disposed. `this.active` deliberately stays set (as
    // `settling: true`) until then, not nulled immediately — so a new
    // open() during this window queues behind it instead of presenting a
    // second panel that would overlap the one still fading out, keeping
    // the queue strictly sequential. Disposing fires
    // `DynamoConfirmContainer.ngOnDestroy()`, which restores focus.
    setTimeout(() => {
      active.overlayRef.dispose();
      this.active = null;
      this.presentNext();
    }, DynamoConfirmService.CLOSE_DURATION_MS);
  }
}
