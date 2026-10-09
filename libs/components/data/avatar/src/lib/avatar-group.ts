import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  DynamoBaseComponent,
  DynamoPassThroughDirective,
} from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import { avatarGroupRootStyles } from './avatar.styles';
import type { DynamoAvatarGroupPart } from './avatar.types';

/**
 * A layout helper for a stack of overlapping `<dg-avatar>`s — a near-empty
 * wrapper (just content projection; the overlap is CSS, not JS). No inputs
 * beyond the inherited `styleClass`/`unstyled` plus `ariaDescribedby`.
 */
@Component({
  selector: 'dg-avatar-group',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoPassThroughDirective],
  templateUrl: './avatar-group.html',
})
export class DynamoAvatarGroup extends DynamoBaseComponent<DynamoAvatarGroupPart> {
  /** Forwarded as `aria-describedby` on the `role="group"` root. */
  readonly ariaDescribedby = input<string | undefined>(undefined);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? cn(this.styleClass(), this.ptFor('root').class)
      : cn(avatarGroupRootStyles, this.styleClass(), this.ptFor('root').class),
  );
}
