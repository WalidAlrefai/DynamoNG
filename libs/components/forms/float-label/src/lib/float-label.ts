import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  floatLabelRootStyles,
  floatLabelTextStyles,
} from './float-label.styles';
import type {
  DynamoFloatLabelPart,
  DynamoFloatLabelVariant,
} from './float-label.types';

/**
 * Wraps a single form control (`<dg-input-text>`, `<dg-textarea>`, a bare
 * `<input>`, …) with a label that floats above the field when it is focused
 * or holds a value. Association is implicit — the projected control lives
 * *inside* the `<label>` element — so no `for`/`id` wiring is needed.
 *
 * The projected control must carry a `placeholder` attribute (a single space
 * is fine) so the filled state can be detected via `:placeholder-shown`, the
 * same requirement PrimeNG's FloatLabel documents. The float itself is pure
 * CSS (see `float-label.styles.ts`); this component holds no state.
 */
@Component({
  selector: 'dg-float-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './float-label.html',
})
export class DynamoFloatLabel extends DynamoBaseComponent<DynamoFloatLabelPart> {
  readonly label = input.required<string>();
  readonly variant = input<DynamoFloatLabelVariant>('over');

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(floatLabelRootStyles, this.styleClass()),
  );

  protected readonly labelClasses = computed(() =>
    floatLabelTextStyles({ variant: this.variant() }),
  );
}
