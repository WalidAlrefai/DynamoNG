import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { skeletonStyles, toCssSize } from './skeleton.styles';
import type { DynamoSkeletonPart, DynamoSkeletonVariant } from './skeleton.types';

@Component({
  selector: 'dg-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './skeleton.html',
})
export class DynamoSkeleton extends DynamoBaseComponent<DynamoSkeletonPart> {
  readonly variant = input<DynamoSkeletonVariant>('text');
  readonly width = input<string | number | undefined>(undefined);
  readonly height = input<string | number | undefined>(undefined);

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(skeletonStyles({ variant: this.variant() }), this.styleClass()),
  );
  protected readonly widthCss = computed(() => toCssSize(this.width()));
  protected readonly heightCss = computed(() => toCssSize(this.height()));
}
