import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  viewChild,
} from '@angular/core';
import type { ConfigurableFocusTrap } from '@angular/cdk/a11y';
import { DynamoButton } from '@dynamong/button';
import { DynamoFocusTrapService, DynamoIdGenerator } from '@dynamong/core/a11y';
import { isBrowser } from '@dynamong/utils/dom';
import { confirmPanelStyles } from './confirm.styles';
import type { DynamoConfirmEntry } from './confirm.types';
import { DynamoConfirmService } from './confirm.service';

// Deliberately does not extend `DynamoBaseComponent` — it's mounted only via
// `DynamoConfirmService`'s own overlay/portal, never placed in a consumer's
// template, so a `styleClass`/`pt`/`unstyled` surface makes no sense here
// (same reasoning as `DynamoToastContainer`).
@Component({
  selector: 'dg-confirm-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton],
  templateUrl: './confirm-container.html',
})
export class DynamoConfirmContainer implements OnDestroy {
  readonly request = input.required<DynamoConfirmEntry>();

  private readonly confirmService = inject(DynamoConfirmService);
  private readonly focusTrapService = inject(DynamoFocusTrapService);
  private readonly idGenerator = inject(DynamoIdGenerator);
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  protected readonly titleId = this.idGenerator.next('dg-confirm-title');
  protected readonly messageId = this.idGenerator.next('dg-confirm-message');
  protected readonly panelClasses = confirmPanelStyles;

  private focusTrap: ConfigurableFocusTrap | null = null;
  private readonly previouslyFocusedElement = isBrowser()
    ? (document.activeElement as HTMLElement | null)
    : null;

  constructor() {
    effect(() => {
      const panel = this.panelRef()?.nativeElement;
      if (panel && !this.focusTrap) {
        this.focusTrap = this.focusTrapService.create(panel);
        // Deferred a macrotask: at this exact point the panel element
        // itself exists, but `dg-button`'s projected label content (and,
        // for the cancel button, its whole `@if (request().showCancel)`
        // block) haven't necessarily finished rendering yet — this effect
        // can run before Angular has recursed into child-component views.
        // A `setTimeout(0)` runs after the current synchronous render pass
        // (including `DynamoConfirmService`'s own explicit
        // `detectChanges()`) has fully committed, same technique the specs'
        // own `flushFocusTrap()` helper relies on.
        setTimeout(() => this.focusInitialElement(panel));
      }
    });
  }

  // Matches by rendered label text rather than DOM position — robust
  // regardless of how the cancel button's `@if (request().showCancel)`
  // block orders relative to the always-rendered confirm button.
  private focusInitialElement(panel: HTMLElement): void {
    const focusTarget = this.request().defaultFocus;
    const label =
      focusTarget === 'confirm'
        ? this.request().confirmLabel
        : focusTarget === 'cancel'
          ? this.request().cancelLabel
          : null;
    const target =
      label == null
        ? undefined
        : Array.from(panel.querySelectorAll('button')).find(
            (button) => button.textContent?.trim() === label,
          );
    (target ?? panel).focus();
  }

  ngOnDestroy(): void {
    this.focusTrap?.destroy();
    this.previouslyFocusedElement?.focus();
  }

  protected onConfirm(): void {
    this.confirmService.confirm();
  }

  protected onCancel(): void {
    this.confirmService.cancel();
  }
}
