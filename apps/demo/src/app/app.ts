import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { DynamoAccordion, DynamoAccordionPanel } from '@dynamong/accordion';
import { DynamoAlert } from '@dynamong/alert';
import { DynamoAvatar } from '@dynamong/avatar';
import { DynamoBadge } from '@dynamong/badge';
import { DynamoButton } from '@dynamong/button';
import { DynamoCard } from '@dynamong/card';
import { DynamoCheckbox } from '@dynamong/checkbox';
import { DynamoChip } from '@dynamong/chip';
import { DynamoDatePicker } from '@dynamong/date-picker';
import { DynamoDialog } from '@dynamong/dialog';
import { DynamoDivider } from '@dynamong/divider';
import { DynamoDrawer } from '@dynamong/drawer';
import { DynamoInputText } from '@dynamong/input-text';
import { DynamoMenu, DynamoMenuItem } from '@dynamong/menu';
import { DynamoMultiSelect } from '@dynamong/multi-select';
import { DynamoPagination } from '@dynamong/pagination';
import { DynamoRadio } from '@dynamong/radio';
import { DynamoSelect } from '@dynamong/select';
import type { DynamoSelectOption } from '@dynamong/select';
import { DynamoSwitch } from '@dynamong/switch';
import { DynamoTab, DynamoTabs } from '@dynamong/tabs';
import { DynamoTable } from '@dynamong/table';
import type {
  DynamoTableCellContext,
  DynamoTableColumn,
} from '@dynamong/table';
import { DynamoTextarea } from '@dynamong/textarea';
import { DynamoToastService } from '@dynamong/toast';
import { DynamoTooltip } from '@dynamong/tooltip';
import { DynamoTree } from '@dynamong/tree';
import type { DynamoTreeNode } from '@dynamong/tree';
import { DynamoStep, DynamoStepper } from '@dynamong/stepper';
import { DynamoPopover, DynamoPopoverContent } from '@dynamong/popover';
import { DynamoSkeleton } from '@dynamong/skeleton';
import { DynamoTag } from '@dynamong/tag';
import { DynamoBreadcrumb } from '@dynamong/breadcrumb';
import type { DynamoBreadcrumbItem } from '@dynamong/breadcrumb';
import { DynamoCarousel, DynamoCarouselSlide } from '@dynamong/carousel';
import { DynamoSlider } from '@dynamong/slider';
import { DynamoSplitButton } from '@dynamong/split-button';
import { DynamoContextMenu } from '@dynamong/context-menu';
import { DynamoAutocomplete } from '@dynamong/autocomplete';
import type { DynamoSelectOption as DynamoAutocompleteOption } from '@dynamong/autocomplete';
import { DynamoColorPicker } from '@dynamong/color-picker';
import { DynamoFileUpload } from '@dynamong/file-upload';
import type { DynamoFileRejection } from '@dynamong/file-upload';
import { DynamoInputNumber } from '@dynamong/input-number';
import { DynamoProgress } from '@dynamong/progress';
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

const FRUIT_OPTIONS: DynamoAutocompleteOption<string>[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Apricot', value: 'apricot' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Grape (disabled)', value: 'grape', disabled: true },
  { label: 'Mango', value: 'mango' },
];

const COUNTRY_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
  { label: 'Australia', value: 'au', disabled: true },
];

const SKILL_OPTIONS: DynamoSelectOption<string>[] = [
  { label: 'Angular', value: 'angular' },
  { label: 'React', value: 'react' },
  { label: 'Vue', value: 'vue' },
  { label: 'Svelte', value: 'svelte' },
  { label: 'TypeScript', value: 'typescript' },
  { label: 'CSS', value: 'css', disabled: true },
];

interface Product {
  name: string;
  category: string;
  price: number;
}

const PRODUCT_CATEGORIES = ['Widgets', 'Gadgets', 'Gizmos', 'Doohickeys'];

// Deterministic, not random — keeps e2e/visual snapshots stable across
// runs. Large enough (247 rows @ 10/page = 25 pages) to demonstrate
// DynamoPagination's ellipsis truncation in the demo below.
const PRODUCTS: Product[] = Array.from({ length: 247 }, (_, index) => ({
  name: `Product ${index + 1}`,
  category: PRODUCT_CATEGORIES[index % PRODUCT_CATEGORIES.length] as string,
  price: 9.99 + (index % 20) * 5,
}));

interface Employee {
  name: string;
  role: string;
  status: 'active' | 'invited' | 'suspended';
  startDate: Date;
}

const EMPLOYEE_STATUS_SEVERITY: Record<Employee['status'], DynamoSeverity> = {
  active: 'success',
  invited: 'warning',
  suspended: 'danger',
};

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
    DynamoAvatar,
    DynamoBadge,
    DynamoButton,
    DynamoCard,
    DynamoCheckbox,
    DynamoChip,
    DynamoDatePicker,
    DynamoDialog,
    DynamoDivider,
    DynamoDrawer,
    DynamoInputText,
    DynamoMenu,
    DynamoMenuItem,
    DynamoMultiSelect,
    DynamoPagination,
    DynamoProgress,
    DynamoRadio,
    DynamoSelect,
    DynamoSwitch,
    DynamoTab,
    DynamoTable,
    DynamoTabs,
    DynamoTextarea,
    DynamoTooltip,
    DynamoTree,
    DynamoStepper,
    DynamoStep,
    DynamoPopover,
    DynamoPopoverContent,
    DynamoSkeleton,
    DynamoTag,
    DynamoBreadcrumb,
    DynamoCarousel,
    DynamoCarouselSlide,
    DynamoSlider,
    DynamoSplitButton,
    DynamoContextMenu,
    DynamoAutocomplete,
    DynamoColorPicker,
    DynamoFileUpload,
    DynamoInputNumber,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './app.html',
})
export class App {
  protected readonly toast = inject(DynamoToastService);

  protected readonly severities = SEVERITIES;
  protected readonly variants = VARIANTS;
  protected readonly countryOptions = COUNTRY_OPTIONS;
  protected readonly skillOptions = SKILL_OPTIONS;

  protected readonly name = signal('');
  protected readonly email = signal('');
  protected readonly subscribe = signal(false);
  protected readonly country = signal<string | null>(null);
  protected readonly skills = signal<string[]>(['angular', 'typescript']);
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
  protected readonly notifications = signal(true);
  protected readonly bio = signal('');
  protected readonly startDate = signal<Date | null>(null);
  protected readonly alertVisible = signal(true);
  protected readonly tags = signal(['Frontend', 'Backend', 'Design']);

  private readonly statusCellTemplate =
    viewChild.required<TemplateRef<DynamoTableCellContext<Employee>>>(
      'statusCell',
    );

  protected readonly employeeColumns = computed<DynamoTableColumn<Employee>[]>(
    () => [
      { field: 'name', header: 'Name', sortable: true },
      { field: 'role', header: 'Role', sortable: true },
      {
        field: 'status',
        header: 'Status',
        sortable: true,
        cell: (row) => row.status.charAt(0).toUpperCase() + row.status.slice(1),
        cellTemplate: this.statusCellTemplate(),
      },
      {
        field: 'startDate',
        header: 'Start Date',
        sortable: true,
        // Formats a Date for display while still sorting chronologically by
        // the raw field, not the formatted string — see table.sort.ts.
        cell: (row) =>
          new Intl.DateTimeFormat('en', { dateStyle: 'medium' }).format(
            row.startDate,
          ),
      },
    ],
  );
  protected readonly employees = EMPLOYEES;
  protected readonly employeePage = signal(1);
  protected readonly selectedEmployees = signal<Employee[]>([]);
  protected readonly employeeFilterText = signal('');

  protected employeeStatusSeverity(status: Employee['status']): DynamoSeverity {
    return EMPLOYEE_STATUS_SEVERITY[status];
  }

  protected readonly productColumns: DynamoTableColumn<Product>[] = [
    { field: 'name', header: 'Name' },
    { field: 'category', header: 'Category' },
    {
      field: 'price',
      header: 'Price',
      cell: (row) => `$${row.price.toFixed(2)}`,
    },
  ];
  protected readonly products = PRODUCTS;
  /**
   * `DynamoPagination` drives which slice of `products` this second
   * `dg-table` renders — Table's own `pageSize`/`page` inputs are left
   * unset here, so its built-in pager (already demoed on Employees above)
   * doesn't also render. Demonstrates the two components composing without
   * any change to Table itself — see the Pagination README entry.
   */
  protected readonly productPage = signal(1);
  protected readonly productPageSize = signal(10);
  protected readonly pagedProducts = computed(() => {
    const start = (this.productPage() - 1) * this.productPageSize();
    return this.products.slice(start, start + this.productPageSize());
  });
  protected readonly activeTab = signal<string | undefined>('profile');
  protected readonly submitting = signal(false);
  protected readonly confirmationOpen = signal(false);
  protected readonly drawerOpen = signal(false);
  protected readonly progressValue = signal(62);

  protected readonly treeItems = signal<DynamoTreeNode[]>([
    {
      id: 'src',
      label: 'src',
      children: [
        {
          id: 'components',
          label: 'components',
          children: [
            { id: 'button-ts', label: 'button.ts' },
            { id: 'button-spec', label: 'button.spec.ts' },
          ],
        },
        { id: 'main-ts', label: 'main.ts' },
      ],
    },
    {
      id: 'dist',
      label: 'dist',
      disabled: true,
      children: [{ id: 'bundle-js', label: 'bundle.js' }],
    },
    { id: 'readme-md', label: 'README.md' },
  ]);
  protected readonly treeExpanded = signal<string[]>(['src']);
  protected readonly treeSelected = signal<string[]>([]);

  protected readonly stepperValue = signal<string | undefined>('account');

  protected readonly popoverFilterName = signal('');
  protected readonly popoverApplied = signal<string | null>(null);

  protected readonly breadcrumbItems: DynamoBreadcrumbItem[] = [
    { label: 'Home', href: '/' },
    { label: 'Archived' },
    { label: 'Products', href: '/products' },
    { label: 'Keyboard' },
  ];

  protected readonly volume = signal(50);

  protected readonly fruitOptions = FRUIT_OPTIONS;
  protected readonly fruit = signal('');
  protected readonly lastFruitSelected = signal<string | null>(null);

  protected readonly brandColor = signal('#3b82f6');

  protected readonly attachments = signal<File[]>([]);
  protected readonly attachmentRejections = signal<DynamoFileRejection[]>([]);

  protected onAttachmentsRejected(rejections: DynamoFileRejection[]): void {
    this.attachmentRejections.set(rejections);
  }

  protected readonly quantity = new FormControl<number | null>(3);

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
