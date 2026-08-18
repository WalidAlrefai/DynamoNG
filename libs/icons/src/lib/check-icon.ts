import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoIconBase } from './icon-base';

@Component({
  selector: 'dg-icon-check',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './check-icon.html',
})
export class DynamoCheckIcon extends DynamoIconBase {}
