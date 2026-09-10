import type { ConfigurableFocusTrap } from '@angular/cdk/a11y';
import {
  Directive,
  ElementRef,
  effect,
  inject,
  input,
} from '@angular/core';
import { DynamoFocusTrapService } from '@dynamong/core/a11y';

/**
 * Traps Tab / Shift+Tab focus within the host element while enabled. A thin
 * wrapper over `DynamoFocusTrapService` (which wraps CDK's
 * `ConfigurableFocusTrapFactory`) — the same primitive Dialog / Drawer /
 * Popover already use, exposed as a directive for arbitrary regions.
 *
 * `<div dgFocusTrap>` traps unconditionally; `<div [dgFocusTrap]="isOpen()">`
 * activates and releases the trap as the bound value changes.
 */
@Directive({
  selector: '[dgFocusTrap]',
  standalone: true,
})
export class DynamoFocusTrap {
  /** Whether the trap is active. Defaults to `true` so the bare attribute works. */
  readonly enabled = input(true, { alias: 'dgFocusTrap' });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly focusTrapService = inject(DynamoFocusTrapService);
  private trap: ConfigurableFocusTrap | null = null;

  constructor() {
    effect((onCleanup) => {
      if (this.enabled()) {
        this.trap ??= this.focusTrapService.create(this.host.nativeElement);
      } else {
        this.release();
      }
      onCleanup(() => this.release());
    });
  }

  private release(): void {
    this.trap?.destroy();
    this.trap = null;
  }
}
