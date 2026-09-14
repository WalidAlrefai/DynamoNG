import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { dividerLabelStyles, dividerLineStyles } from './divider.styles';
import type {
  DynamoDividerAlign,
  DynamoDividerLineStyle,
  DynamoDividerOrientation,
  DynamoDividerPart,
} from './divider.types';

@Component({
  selector: 'dg-divider',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './divider.html',
})
export class DynamoDivider extends DynamoBaseComponent<DynamoDividerPart> {
  readonly orientation = input<DynamoDividerOrientation>('horizontal');
  readonly type = input<DynamoDividerLineStyle>('solid');
  readonly align = input<DynamoDividerAlign>('center');

  // A mismatched align/orientation pairing (e.g. align="top" while
  // horizontal) falls back to 'center' rather than silently doing nothing.
  private readonly effectiveAlign = computed(() => {
    const align = this.align();
    if (this.orientation() === 'horizontal') {
      return align === 'left' || align === 'right' ? align : 'center';
    }
    return align === 'top' || align === 'bottom' ? align : 'center';
  });

  protected readonly rootClasses = computed(() =>
    this.orientation() === 'vertical'
      ? 'flex flex-col items-center self-stretch'
      : 'flex items-center',
  );

  protected readonly beforeGrows = computed(
    () => this.effectiveAlign() !== 'left' && this.effectiveAlign() !== 'top',
  );
  protected readonly afterGrows = computed(
    () =>
      this.effectiveAlign() !== 'right' && this.effectiveAlign() !== 'bottom',
  );

  protected readonly beforeLineClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          dividerLineStyles({
            orientation: this.orientation(),
            lineStyle: this.type(),
            grow: this.beforeGrows(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly afterLineClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          dividerLineStyles({
            orientation: this.orientation(),
            lineStyle: this.type(),
            grow: this.afterGrows(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly labelClasses = computed(() =>
    dividerLabelStyles({ orientation: this.orientation() }),
  );
}
