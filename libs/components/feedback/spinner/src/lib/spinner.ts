import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import type { DynamoSpinnerPart } from './spinner.types';
import { spinnerStyles } from './spinner.styles';

@Component({
  selector: 'dg-spinner',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './spinner.html',
})
export class DynamoSpinner extends DynamoBaseComponent<DynamoSpinnerPart> {
  readonly size = input<DynamoSize>('md');

  /**
   * Accessible name for a standalone, announced loading indicator (renders
   * `role="status"` + `aria-label`). Leave unset when the spinner is embedded
   * inside something that already announces its own busy state (e.g. Button's
   * `aria-busy`) — it then renders `aria-hidden="true"` instead.
   */
  readonly label = input<string>();

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(spinnerStyles({ size: this.size() }), this.styleClass()),
  );
}
