import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import type {
  DynamoMeterGroupPart,
  DynamoMeterGroupSize,
} from './meter-group.types';
import { meterGroupStyles } from './meter-group.styles';

@Component({
  selector: 'dg-meter-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meter-group.html',
})
export class DynamoMeterGroup extends DynamoBaseComponent<DynamoMeterGroupPart> {
  readonly size = input<DynamoMeterGroupSize>('md');

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(meterGroupStyles({ size: this.size() }), this.styleClass()),
  );
}
