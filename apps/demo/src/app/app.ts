import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoAccordion, DynamoAccordionPanel } from '@dynamong/accordion';
import { DynamoBadge } from '@dynamong/badge';
import { DynamoButton } from '@dynamong/button';
import { DynamoCard } from '@dynamong/card';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoDialog } from '@dynamong/dialog';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoMenu, DynamoMenuItem } from '@dynamong/menu';
import { DynamoRadio } from '@dynamong/radio';
import { DynamoSelect } from '@dynamong/select';
import type { DynamoSelectOption } from '@dynamong/select';
import { DynamoSwitch } from '@dynamong/switch';
import { DynamoTab, DynamoTabs } from '@dynamong/tabs';
import { DynamoTextarea } from '@dynamong/textarea';
import { DynamoToastService } from '@dynamong/toast';
import { DynamoTooltip } from '@dynamong/tooltip';
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
    DynamoAccordion,
    DynamoAccordionPanel,
    DynamoBadge,
    DynamoButton,
    DynamoCard,
    DynamoCheckbox,
    DynamoDialog,
    DynamoInputText,
    DynamoMenu,
    DynamoMenuItem,
    DynamoRadio,
    DynamoSelect,
    DynamoSwitch,
    DynamoTab,
    DynamoTabs,
    DynamoTextarea,
    DynamoTooltip,
    FormsModule,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly toast = inject(DynamoToastService);

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
  protected readonly activeTab = signal<string | undefined>('profile');
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
