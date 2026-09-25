import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { DynamoSeverity } from '@dynamong/core/api';
import { DynamoToastService, type DynamoToastEntry } from './toast.service';
import {
  toastCardStyles,
  toastCloseButtonStyles,
  toastContainerStyles,
  toastIconStyles,
  toastMessageStyles,
  toastTitleStyles,
} from './toast.styles';
import type { DynamoToastPosition } from './toast.types';

function slideFor(
  position: DynamoToastPosition,
): 'right' | 'left' | 'top' | 'bottom' {
  if (position.endsWith('right')) return 'right';
  if (position.endsWith('left')) return 'left';
  return position.startsWith('top') ? 'top' : 'bottom';
}

// Mounted imperatively by `DynamoToastService` (one instance per position
// actually used, via `ComponentPortal`) — a consumer never writes
// `<dg-toast-container>` themselves, so this deliberately does not extend
// `DynamoBaseComponent` (no styleClass/pt/unstyled surface makes sense for
// an internal, service-mounted container).
@Component({
  selector: 'dg-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toast-container.html',
})
export class DynamoToastContainer {
  readonly position = input.required<DynamoToastPosition>();

  private readonly toastService = inject(DynamoToastService);

  protected readonly toasts = computed(() =>
    this.toastService
      .allToasts()
      .filter((toast) => toast.position === this.position()),
  );

  protected readonly containerClasses = toastContainerStyles;
  protected readonly titleClasses = toastTitleStyles;
  protected readonly messageClasses = toastMessageStyles;
  protected readonly closeButtonClasses = toastCloseButtonStyles;

  protected cardClasses(toast: DynamoToastEntry) {
    return toastCardStyles({
      severity: toast.severity,
      slide: slideFor(toast.position),
      phase: toast.phase,
    });
  }

  protected iconClasses(severity: DynamoSeverity) {
    return toastIconStyles({ severity });
  }

  protected dismiss(id: string): void {
    this.toastService.dismiss(id);
  }

  /** Pauses/resumes a toast's auto-dismiss countdown while it's hovered — a no-op for a sticky (`duration: 0`) toast. */
  protected pause(id: string): void {
    this.toastService.pause(id);
  }

  protected resume(id: string): void {
    this.toastService.resume(id);
  }
}
