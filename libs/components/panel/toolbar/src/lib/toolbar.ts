import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import { cn } from '@dynamong/utils/class-merge';
import {
  toolbarCenterStyles,
  toolbarEndStyles,
  toolbarRootStyles,
  toolbarStartStyles,
} from './toolbar.styles';
import type { DynamoToolbarPart } from './toolbar.types';

@Component({
  selector: 'dg-toolbar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './toolbar.html',
})
export class DynamoToolbar extends DynamoBaseComponent<DynamoToolbarPart> {
  readonly ariaLabel = input<string | undefined>(undefined);

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(toolbarRootStyles, this.styleClass()),
  );
  protected readonly startClasses = toolbarStartStyles;
  protected readonly centerClasses = toolbarCenterStyles;
  protected readonly endClasses = toolbarEndStyles;
}
