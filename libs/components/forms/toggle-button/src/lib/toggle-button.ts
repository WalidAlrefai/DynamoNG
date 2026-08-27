import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import type { DynamoSeverity } from '@dynamong/core/api';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { toggleButtonBorderStyles } from './toggle-button.styles';
import type {
  DynamoToggleButtonPart,
  DynamoToggleButtonSize,
} from './toggle-button.types';

@Component({
  selector: 'dg-toggle-button',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoButton],
  templateUrl: './toggle-button.html',
})
export class DynamoToggleButton extends DynamoBaseComponent<DynamoToggleButtonPart> {
  /** Two-way bindable: `<dg-toggle-button [(pressed)]="value">`. */
  readonly pressed = model(false);
  readonly disabled = input(false);
  readonly size = input<DynamoToggleButtonSize>('md');
  /** Severity applied while pressed (solid fill). Unpressed always renders neutral, regardless of this input. */
  readonly severity = input<DynamoSeverity>('primary');
  /** Accessible name — required when there's no visible text content (e.g. an icon-only toggle). */
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly innerStyleClass = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(toggleButtonBorderStyles(this.pressed()), this.styleClass()),
  );

  protected togglePressed(): void {
    if (this.disabled()) return;
    this.pressed.update((p) => !p);
  }
}
