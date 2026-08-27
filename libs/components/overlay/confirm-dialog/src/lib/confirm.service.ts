import { ComponentRef, Injectable, Injector, inject } from '@angular/core';
import type { OverlayRef } from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { Subscription } from 'rxjs';
import { DynamoOverlayService } from '@dynamong/core/overlay';
import { confirmBackdropClass } from './confirm.styles';
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
}

@Injectable({ providedIn: 'root' })
export class DynamoConfirmService {
  private readonly overlayService = inject(DynamoOverlayService);
  private readonly injector = inject(Injector);

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

    this.active = { ...next, overlayRef, componentRef, subs };
  }

  private settle(result: boolean): void {
    const active = this.active;
    if (!active) {
      return;
    }

    active.subs.unsubscribe();
    // Destroys the portal's `ComponentRef`, firing
    // `DynamoConfirmContainer.ngOnDestroy()`, which restores focus.
    active.overlayRef.dispose();
    this.active = null;
    active.resolve(result);
    this.presentNext();
  }
}
