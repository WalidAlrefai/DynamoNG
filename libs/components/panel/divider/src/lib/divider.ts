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

  protected readonly lineClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          dividerLineStyles({ orientation: this.orientation() }),
          this.styleClass(),
        ),
  );
  protected readonly labelClasses = dividerLabelStyles;
}
