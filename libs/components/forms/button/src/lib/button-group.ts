import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { buttonGroupRootStyles } from './button.styles';
import type { DynamoButtonGroupPart } from './button.types';

/**
 * A layout helper that visually merges adjacent `<dg-button>`s into one
 * connected control — a near-empty wrapper (just content projection; the
 * merged-border effect is CSS, not JS), mirroring `DynamoAvatarGroup`'s shape.
 */
@Component({
  selector: 'dg-button-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './button-group.html',
})
export class DynamoButtonGroup extends DynamoBaseComponent<DynamoButtonGroupPart> {
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(buttonGroupRootStyles, this.styleClass()),
  );
}
