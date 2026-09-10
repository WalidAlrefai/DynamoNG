import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  iftaLabelRootStyles,
  iftaLabelTextStyles,
} from './float-label.styles';
import type { DynamoFloatLabelPart } from './float-label.types';

/**
 * "In-Form-That-Always" label: the label is pinned to the top-inside of the
 * field and stays visible at all times (no float animation). The wrapped
 * control gets extra top padding so its value clears the label. Meant for
 * dense forms where a permanent visible label is preferable to a floating
 * one. Association is implicit — the projected control lives inside the
 * `<label>`.
 */
@Component({
  selector: 'dg-ifta-label',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ifta-label.html',
})
export class DynamoIftaLabel extends DynamoBaseComponent<DynamoFloatLabelPart> {
  readonly label = input.required<string>();

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(iftaLabelRootStyles, this.styleClass()),
  );

  protected readonly labelClasses = iftaLabelTextStyles;
}
