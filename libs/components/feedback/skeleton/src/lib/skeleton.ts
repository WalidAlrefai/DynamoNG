import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { skeletonStyles, toCssSize } from './skeleton.styles';
import type {
  DynamoSkeletonAnimation,
  DynamoSkeletonPart,
  DynamoSkeletonVariant,
} from './skeleton.types';

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
  /** Opts out of the pulse animation for a static placeholder. */
  readonly animation = input<DynamoSkeletonAnimation>('pulse');
  /** Explicit CSS border-radius — overrides the variant's own default (`rounded-sm`/`rounded-full`/`rounded-md`) when set. */
  readonly borderRadius = input<string | undefined>(undefined);

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          skeletonStyles({
            variant: this.variant(),
            animation: this.animation(),
          }),
          this.styleClass(),
        ),
  );
  protected readonly widthCss = computed(() => toCssSize(this.width()));
  protected readonly heightCss = computed(() => toCssSize(this.height()));
}
