import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { DynamoSeverity } from '@dynamong/core/api';
import { DynamoToastService } from './toast.service';
import {
  toastCardStyles,
  toastCloseButtonStyles,
  toastContainerStyles,
  toastIconStyles,
  toastMessageStyles,
  toastTitleStyles,
} from './toast.styles';
import type { DynamoToastPosition } from './toast.types';

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

  protected cardClasses(severity: DynamoSeverity) {
    return toastCardStyles({ severity });
  }

  protected iconClasses(severity: DynamoSeverity) {
    return toastIconStyles({ severity });
  }

  protected dismiss(id: string): void {
    this.toastService.dismiss(id);
  }
}
