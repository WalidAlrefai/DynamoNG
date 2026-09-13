import { ChangeDetectionStrategy, Component, computed } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { avatarGroupRootStyles } from './avatar.styles';
import type { DynamoAvatarGroupPart } from './avatar.types';

/**
 * A layout helper for a stack of overlapping `<dg-avatar>`s — mirrors
 * PrimeNG's own near-empty `AvatarGroup` (just a content-projecting
 * wrapper; the overlap is CSS, not JS). No inputs beyond the inherited
 * `styleClass`/`unstyled`.
 */
@Component({
  selector: 'dg-avatar-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar-group.html',
})
export class DynamoAvatarGroup extends DynamoBaseComponent<DynamoAvatarGroupPart> {
  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(avatarGroupRootStyles, this.styleClass()),
  );
}
