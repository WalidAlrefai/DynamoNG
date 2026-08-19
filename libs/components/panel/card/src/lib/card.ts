import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import type { DynamoCardPart, DynamoCardVariant } from './card.types';
import {
  cardBodyStyles,
  cardFooterStyles,
  cardHeaderStyles,
  cardStyles,
  cardSubtitleStyles,
  cardTitleStyles,
} from './card.styles';

@Component({
  selector: 'dg-card',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './card.html',
})
export class DynamoCard extends DynamoBaseComponent<DynamoCardPart> {
  readonly header = input<string>('');
  readonly subheader = input<string>('');
  readonly variant = input<DynamoCardVariant>('elevated');

  protected readonly classes = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(cardStyles({ variant: this.variant() }), this.styleClass()),
  );

  protected readonly headerClasses = computed(() =>
    this.unstyled() ? '' : cardHeaderStyles,
  );
  protected readonly titleClasses = computed(() =>
    this.unstyled() ? '' : cardTitleStyles,
  );
  protected readonly subtitleClasses = computed(() =>
    this.unstyled() ? '' : cardSubtitleStyles,
  );
  protected readonly bodyClasses = computed(() =>
    this.unstyled() ? '' : cardBodyStyles,
  );
  protected readonly footerClasses = computed(() =>
    this.unstyled() ? '' : cardFooterStyles,
  );
}
