import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  meterGroupLegendItemStyles,
  meterGroupLegendMarkerStyles,
  meterGroupLegendStyles,
  meterGroupLegendValueStyles,
  meterGroupRootStyles,
  meterGroupSegmentStyles,
  meterGroupTrackStyles,
} from './meter-group.styles';
import type {
  DynamoMeterGroupOrientation,
  DynamoMeterGroupPart,
  DynamoMeterGroupSize,
  DynamoMeterItem,
} from './meter-group.types';

/**
 * A multi-segment labelled meter bar with a legend — for showing a
 * breakdown (disk usage, budget split, quota). The single-value sibling is
 * `DynamoProgress`; the severity → colour map and the "continuous size via
 * an inline style" exception are shared with it.
 */
@Component({
  selector: 'dg-meter-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './meter-group.html',
})
export class DynamoMeterGroup extends DynamoBaseComponent<DynamoMeterGroupPart> {
  readonly value = input.required<DynamoMeterItem[]>();
  /** The total the full track represents. Segments size as `item.value / max`. */
  readonly max = input(100);
  readonly orientation = input<DynamoMeterGroupOrientation>('horizontal');
  readonly showLegend = input(true);
  readonly size = input<DynamoMeterGroupSize>('md');
  readonly ariaLabel = input<string | undefined>(undefined);

  /**
   * Percentage width of each segment, keyed by array index. Clamps every
   * value to `[0, max]` and, if the segments would sum past `max`, scales
   * them all down proportionally so the bar never overflows its track.
   */
  protected readonly percents = computed<number[]>(() => {
    const max = Math.max(this.max(), 1);
    const raw = this.value().map((item) => {
      const v = Number.isFinite(item.value) ? item.value : 0;
      return Math.min(Math.max(v, 0), max);
    });
    const sum = raw.reduce((total, v) => total + v, 0);
    const scale = sum > max ? max / sum : 1;
    return raw.map((v) => (v / max) * 100 * scale);
  });

  protected readonly summaryLabel = computed(() => {
    if (this.ariaLabel()) return this.ariaLabel() as string;
    const parts = this.value().map((item) => `${item.label} ${item.value}`);
    return `Meter: ${parts.join(', ')}`;
  });

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          meterGroupRootStyles({ orientation: this.orientation() }),
          this.styleClass(),
        ),
  );
  protected readonly trackClasses = computed(() =>
    meterGroupTrackStyles({
      orientation: this.orientation(),
      size: this.size(),
    }),
  );
  protected readonly legendClasses = meterGroupLegendStyles;
  protected readonly legendItemClasses = meterGroupLegendItemStyles;
  protected readonly legendValueClasses = meterGroupLegendValueStyles;

  protected segmentClasses(item: DynamoMeterItem): string {
    return meterGroupSegmentStyles({
      severity: item.color ? 'none' : item.severity ?? 'primary',
    });
  }

  protected markerClasses(item: DynamoMeterItem): string {
    return meterGroupLegendMarkerStyles({
      severity: item.color ? 'none' : item.severity ?? 'primary',
    });
  }

  protected percentFor(index: number): number {
    return this.percents()[index] ?? 0;
  }
}
