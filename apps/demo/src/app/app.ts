import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DynamoAccordion, DynamoAccordionPanel } from '@dynamong/accordion';
import { DynamoAlert } from '@dynamong/alert';
import { DynamoBadge } from '@dynamong/badge';
import { DynamoButton } from '@dynamong/button';
import { DynamoCard } from '@dynamong/card';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoChip } from '@dynamong/chip';
import { DynamoDatePicker } from '@dynamong/date-picker';
import { DynamoDialog } from '@dynamong/dialog';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoMenu, DynamoMenuItem } from '@dynamong/menu';
import { DynamoRadio } from '@dynamong/radio';
import { DynamoSelect } from '@dynamong/select';
import type { DynamoSelectOption } from '@dynamong/select';
import { DynamoSwitch } from '@dynamong/switch';
import { DynamoTab, DynamoTabs } from '@dynamong/tabs';
import { DynamoTable } from '@dynamong/table';
import type { DynamoTableColumn } from '@dynamong/table';
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

interface Employee {
  name: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  startDate: Date;
}

const EMPLOYEE_COLUMNS: DynamoTableColumn<Employee>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'role', header: 'Role', sortable: true },
  {
    field: 'status',
    header: 'Status',
    sortable: true,
    cell: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1),
  },
  {
    field: 'startDate',
    header: 'Start Date',
    sortable: true,
    // Formats a Date for display while still sorting chronologically by the
    // raw field, not the formatted string — see table.sort.ts.
    cell: (row) =>
      new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
        row.startDate,
      ),
  },
];

const EMPLOYEES: Employee[] = [
  {
    name: 'Ava Thompson',
    role: 'Engineering Lead',
    status: 'active',
    startDate: new Date(2021, 2, 15),
  },
  {
    name: 'Noah Martinez',
    role: 'Product Designer',
    status: 'active',
    startDate: new Date(2022, 6, 1),
  },
  {
    name: 'Priya Shah',
    role: 'Backend Engineer',
    status: 'invited',
    startDate: new Date(2023, 9, 20),
  },
  {
    name: 'Leo Nguyen',
    role: 'QA Engineer',
    status: 'suspended',
    startDate: new Date(2020, 0, 10),
  },
];

@Component({
  selector: 'demo-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoAccordion,
    DynamoAccordionPanel,
    DynamoAlert,
    DynamoBadge,
    DynamoButton,
    DynamoCard,
    DynamoCheckbox,
    DynamoChip,
    DynamoDatePicker,
    DynamoDialog,
    DynamoInputText,
    DynamoMenu,
    DynamoMenuItem,
    DynamoRadio,
    DynamoSelect,
    DynamoSwitch,
    DynamoTab,
    DynamoTable,
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
  protected readonly startDate = signal<Date | null>(null);
  protected readonly alertVisible = signal(true);
  protected readonly tags = signal(['Frontend', 'Backend', 'Design']);
  protected readonly employeeColumns = EMPLOYEE_COLUMNS;
  protected readonly employees = EMPLOYEES;
  protected readonly activeTab = signal<string | undefined>('profile');
  protected readonly submitting = signal(false);
  protected readonly confirmationOpen = signal(false);

  protected removeTag(tag: string): void {
    this.tags.update((tags) => tags.filter((t) => t !== tag));
  }

  protected submit(): void {
    this.submitting.set(true);
    setTimeout(() => {
      this.submitting.set(false);
      this.confirmationOpen.set(true);
    }, 400);
  }
}
