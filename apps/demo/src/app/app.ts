import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoButton } from '@dynamong/button';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoDialog } from '@dynamong/dialog';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoRadio } from '@dynamong/radio';
import { DynamoSelect } from '@dynamong/select';
import type { DynamoSelectOption } from '@dynamong/select';
import { DynamoSwitch } from '@dynamong/switch';
import { DynamoTextarea } from '@dynamong/textarea';
import type { DynamoSeverity } from '@dynamong/core/api';

const SEVERITIES: DynamoSeverity[] = [
  'primary',
  'secondary',
  'success',
  'info',
  'warning',
  'danger',
];
const VARIANTS = ['solid', 'outline', 'text'] as const;

const COUNTRY_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
  { label: 'Australia', value: 'au', disabled: true },
];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoCheckbox,
    DynamoDialog,
    DynamoInputText,
    DynamoRadio,
    DynamoSelect,
    DynamoSwitch,
    DynamoTextarea,
    FormsModule,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly severities = SEVERITIES;
  protected readonly variants = VARIANTS;
  protected readonly countryOptions = COUNTRY_OPTIONS;

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly subscribe = signal(false);
  protected readonly country = signal<string | null>(null);
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
  protected readonly notifications = signal(true);
  protected readonly bio = signal('');
  protected readonly submitting = signal(false);
  protected readonly confirmationOpen = signal(false);

  protected submit(): void {
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.confirmationOpen.set(true);
    }, 400);
  }
}
