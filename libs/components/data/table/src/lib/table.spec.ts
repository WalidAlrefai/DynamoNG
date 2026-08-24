import {
  Component,
  TemplateRef,
  computed,
  input,
  model,
  viewChild,
} from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoTable } from './table';
import { DynamoTableHarness } from './table.harness';
import type { DynamoTableCellContext, DynamoTableColumn } from './table.types';

interface Person {
  name: string;
  age: number;
}

interface Item {
  id: number;
  name: string;
}

const SORTABLE_COLUMNS: DynamoTableColumn<Person>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'age', header: 'Age', sortable: true },
];

const MIXED_COLUMNS: DynamoTableColumn<Person>[] = [
  { field: 'name', header: 'Name', sortable: true },
  { field: 'age', header: 'Age' },
];

const PEOPLE: Person[] = [
  { name: 'Charlie', age: 25 },
  { name: 'Ada', age: 40 },
  { name: 'Bea', age: 30 },
];

const ITEM_COLUMNS: DynamoTableColumn<Item>[] = [
  { field: 'name', header: 'Name', sortable: true },
];

@Component({
  selector: 'dg-table-test-host',
  standalone: true,
  imports: [DynamoTable],
  template: `<dg-table
    [columns]="columns()"
    [data]="data()"
    [ariaLabel]="ariaLabel()"
    [pageSize]="pageSize()"
    [(page)]="page"
    [selectable]="selectable()"
    [(selected)]="selected"
    [trackBy]="trackBy()"
    [filterable]="filterable()"
    [filterPlaceholder]="filterPlaceholder()"
    [(filterText)]="filterText"
    [noMatchesMessage]="noMatchesMessage()"
  />`,
})
class TableTestHostComponent {
  readonly columns = input<DynamoTableColumn<Person>[]>(SORTABLE_COLUMNS);
  readonly data = input<readonly Person[]>(PEOPLE);
  readonly ariaLabel = input<string | undefined>(undefined);
  readonly pageSize = input<number | undefined>(undefined);
  readonly page = model(1);
  readonly selectable = input(false);
  readonly selected = model<Person[]>([]);
  readonly trackBy = input<
    ((row: Person, index: number) => unknown) | undefined
  >(undefined);
  readonly filterable = input(false);
  readonly filterPlaceholder = input('Search...');
  readonly filterText = model('');
  readonly noMatchesMessage = input('No matching rows');
}

@Component({
  selector: 'dg-table-cell-template-host',
  standalone: true,
  imports: [DynamoTable],
  template: `
    <ng-template #ageCell let-row let-i="index">
      <strong data-cell-marker>{{ row.age }}yo (idx {{ i }})</strong>
    </ng-template>
    <dg-table
      [columns]="columns()"
      [data]="data"
      [pageSize]="pageSize()"
      [(page)]="page"
    />
  `,
})
class TableCellTemplateHostComponent {
  private readonly ageCellTpl =
    viewChild.required<TemplateRef<DynamoTableCellContext<Person>>>('ageCell');
  readonly data: Person[] = PEOPLE;
  readonly pageSize = input<number | undefined>(undefined);
  readonly page = model(1);
  readonly columns = computed<DynamoTableColumn<Person>[]>(() => [
    { field: 'name', header: 'Name' },
    {
      field: 'age',
      header: 'Age',
      sortable: true,
      cell: (row) => `Age: ${row.age}`,
      cellTemplate: this.ageCellTpl(),
    },
  ]);
}

@Component({
  selector: 'dg-table-item-host',
  standalone: true,
  imports: [DynamoTable],
  template: `<dg-table
    [columns]="columns()"
    [data]="data()"
    [selectable]="true"
    [(selected)]="selected"
    [trackBy]="trackBy()"
  />`,
})
class TableItemHostComponent {
  readonly columns = input<DynamoTableColumn<Item>[]>(ITEM_COLUMNS);
  readonly data = input<readonly Item[]>([
    { id: 1, name: 'First' },
    { id: 2, name: 'Second' },
  ]);
  readonly selected = model<Item[]>([]);
  readonly trackBy = input<((row: Item, index: number) => unknown) | undefined>(
    undefined,
  );
}

function getHeaderCells(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('thead th'));
}

function getBodyRows(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('tbody tr'));
}

function getColumnValues(
  container: HTMLElement,
  columnIndex: number,
): string[] {
  return getBodyRows(container).map(
    (row) => row.querySelectorAll('td')[columnIndex]?.textContent?.trim() ?? '',
  );
}

function getRowCheckboxes(container: HTMLElement): HTMLInputElement[] {
  return Array.from(container.querySelectorAll('tbody input[type="checkbox"]'));
}

function getSelectAllCheckbox(container: HTMLElement): HTMLInputElement | null {
  return container.querySelector('thead input[type="checkbox"]');
}

function getPaginationSummary(container: HTMLElement): string {
  return (
    container.querySelector('[aria-live="polite"]')?.textContent?.trim() ?? ''
  );
}

function getFilterInput(container: HTMLElement): HTMLInputElement {
  const input = container.querySelector<HTMLInputElement>(
    'input[type="search"]',
  );
  if (!input) throw new Error('No filter input found — is filterable set?');
  return input;
}

function setFilterValue(container: HTMLElement, value: string): void {
  const input = getFilterInput(container);
  input.value = value;
  input.dispatchEvent(new Event('input'));
}

describe('DynamoTable', () => {
  describe('creation', () => {
    it('renders one header cell per column and one row per data entry', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent);

      expect(getHeaderCells(container)).toHaveLength(2);
      expect(getBodyRows(container)).toHaveLength(3);
    });
  });

  describe('default behavior', () => {
    it('defaults size to "md" and applies no sort', () => {
      const { componentInstance } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: { columns: SORTABLE_COLUMNS, data: PEOPLE },
        },
      );

      expect(componentInstance.size()).toBe('md');
    });

    it('has no aria-sort on any header by default', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent);

      for (const th of getHeaderCells(container)) {
        expect(th.getAttribute('aria-sort')).toBeNull();
      }
    });

    it('defaults pageSize to undefined and selectable to false', () => {
      const { componentInstance } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: { columns: SORTABLE_COLUMNS, data: PEOPLE },
        },
      );

      expect(componentInstance.pageSize()).toBeUndefined();
      expect(componentInstance.selectable()).toBe(false);
    });

    it('defaults pageSizeOptions to [10, 25, 50, 100]', () => {
      const { componentInstance } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: { columns: SORTABLE_COLUMNS, data: PEOPLE },
        },
      );

      expect(componentInstance.pageSizeOptions()).toEqual([10, 25, 50, 100]);
    });
  });

  describe('input properties', () => {
    it('shows the emptyMessage text when data is empty', () => {
      const { container } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: {
            columns: SORTABLE_COLUMNS,
            data: [],
            emptyMessage: 'Nothing here',
          },
        },
      );

      expect(container.textContent).toContain('Nothing here');
    });

    it('reflects ariaLabel on the table element', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { ariaLabel: 'People' },
      });

      expect(container.querySelector('table')?.getAttribute('aria-label')).toBe(
        'People',
      );
    });

    it.each(['sm', 'md', 'lg'] as const)(
      'accepts size "%s" without throwing',
      (size) => {
        expect(() =>
          renderDynamoComponent<DynamoTable<Person>>(DynamoTable, {
            inputs: { columns: SORTABLE_COLUMNS, data: PEOPLE, size },
          }),
        ).not.toThrow();
      },
    );
  });

  describe('output events', () => {
    it.todo(
      'N/A — Table has no outputs; page/selected models are the entire event surface',
    );
  });

  describe('user interactions', () => {
    it('cycles a sortable column through ascending, descending, and unsorted', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
      );
      const nameHeader = within(container).getByRole('button', {
        name: 'Name',
      });

      nameHeader.click();
      fixture.detectChanges();
      expect(getColumnValues(container, 0)).toEqual(['Ada', 'Bea', 'Charlie']);
      expect(getHeaderCells(container)[0]?.getAttribute('aria-sort')).toBe(
        'ascending',
      );

      nameHeader.click();
      fixture.detectChanges();
      expect(getColumnValues(container, 0)).toEqual(['Charlie', 'Bea', 'Ada']);
      expect(getHeaderCells(container)[0]?.getAttribute('aria-sort')).toBe(
        'descending',
      );

      nameHeader.click();
      fixture.detectChanges();
      expect(getColumnValues(container, 0)).toEqual(['Charlie', 'Ada', 'Bea']);
      expect(
        getHeaderCells(container)[0]?.getAttribute('aria-sort'),
      ).toBeNull();
    });

    it('jumps a newly-clicked column straight to ascending and clears the previous one', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
      );
      const nameHeader = within(container).getByRole('button', {
        name: 'Name',
      });
      const ageHeader = within(container).getByRole('button', { name: 'Age' });

      nameHeader.click();
      fixture.detectChanges();
      ageHeader.click();
      fixture.detectChanges();

      expect(getColumnValues(container, 1)).toEqual(['25', '30', '40']);
      expect(
        getHeaderCells(container)[0]?.getAttribute('aria-sort'),
      ).toBeNull();
      expect(getHeaderCells(container)[1]?.getAttribute('aria-sort')).toBe(
        'ascending',
      );
    });

    it('sorts when Enter is pressed on a focused header button', async () => {
      const { container } = renderDynamoComponent(TableTestHostComponent);
      const nameHeader = within(container).getByRole('button', {
        name: 'Name',
      });
      nameHeader.focus();

      await userEvent.keyboard('{Enter}');

      expect(getColumnValues(container, 0)).toEqual(['Ada', 'Bea', 'Charlie']);
    });

    it('does not render a button for a non-sortable column', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { columns: MIXED_COLUMNS },
      });

      const ageHeader = getHeaderCells(container)[1];
      expect(ageHeader?.querySelector('button')).toBeNull();
      expect(ageHeader?.textContent?.trim()).toBe('Age');
    });
  });

  describe('conditional rendering', () => {
    it('renders a single empty-state row spanning all columns when data is empty', () => {
      const { container } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: { columns: SORTABLE_COLUMNS, data: [] },
        },
      );

      const rows = getBodyRows(container);
      expect(rows).toHaveLength(1);
      expect(rows[0]?.querySelector('td')?.getAttribute('colspan')).toBe('2');
    });

    it('accounts for the selection column in the empty-state colspan', () => {
      const { container } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: { columns: SORTABLE_COLUMNS, data: [], selectable: true },
        },
      );

      const rows = getBodyRows(container);
      expect(rows[0]?.querySelector('td')?.getAttribute('colspan')).toBe('3');
    });
  });

  describe('template behavior', () => {
    it('reflects sort direction through the DynamoTableHarness', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTableHarness,
      );

      expect(await harness.getRowCount()).toBe(3);
      expect(await harness.getColumnText(0)).toEqual(['Charlie', 'Ada', 'Bea']);

      await harness.sortBy('Name');

      expect(await harness.getColumnText(0)).toEqual(['Ada', 'Bea', 'Charlie']);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in the default state', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations after sorting', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
      );
      within(container).getByRole('button', { name: 'Name' }).click();
      fixture.detectChanges();

      return expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations in the empty state', async () => {
      const { fixture } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: { columns: SORTABLE_COLUMNS, data: [] },
        },
      );

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations with pagination controls rendered', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2 },
      });

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations with selection enabled and one row selected', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true } },
      );
      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();

      return expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('state changes', () => {
    it('re-applies the active sort when data changes to a new array reference', () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        TableTestHostComponent,
      );
      within(container).getByRole('button', { name: 'Name' }).click();
      fixture.detectChanges();
      expect(getColumnValues(container, 0)).toEqual(['Ada', 'Bea', 'Charlie']);

      setInputs({ data: [...PEOPLE, { name: 'Abe', age: 22 }] });
      fixture.detectChanges();

      expect(getColumnValues(container, 0)).toEqual([
        'Abe',
        'Ada',
        'Bea',
        'Charlie',
      ]);
    });

    it('does not throw when columns change and the sorted field no longer exists', () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        TableTestHostComponent,
      );
      within(container).getByRole('button', { name: 'Name' }).click();
      fixture.detectChanges();

      expect(() => {
        setInputs({
          columns: [{ field: 'age', header: 'Age', sortable: true }],
        });
        fixture.detectChanges();
      }).not.toThrow();
    });
  });

  describe('edge cases', () => {
    it('renders correctly with a single row', () => {
      const { container } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: {
            columns: SORTABLE_COLUMNS,
            data: [{ name: 'Ada', age: 40 }],
          },
        },
      );

      expect(getBodyRows(container)).toHaveLength(1);
    });

    it('preserves relative order for tied sort values (stability)', () => {
      const tied: Person[] = [
        { name: 'First', age: 30 },
        { name: 'Second', age: 30 },
        { name: 'Third', age: 30 },
      ];
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        {
          inputs: { data: tied },
        },
      );

      within(container).getByRole('button', { name: 'Age' }).click();
      fixture.detectChanges();

      expect(getColumnValues(container, 0)).toEqual([
        'First',
        'Second',
        'Third',
      ]);
    });

    it('renders without throwing when columns is an empty array', () => {
      expect(() =>
        renderDynamoComponent<DynamoTable<Person>>(DynamoTable, {
          inputs: { columns: [], data: PEOPLE },
        }),
      ).not.toThrow();
    });
  });

  describe('pagination', () => {
    it('does not render pagination controls when pageSize is unset', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent);

      expect(container.querySelector('[aria-label="Next page"]')).toBeNull();
    });

    it('renders all rows unpaginated when pageSize is unset', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent);

      expect(getBodyRows(container)).toHaveLength(3);
    });

    it('slices data into pages of pageSize and shows the page indicator', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2 },
      });

      expect(getBodyRows(container)).toHaveLength(2);
      expect(getPaginationSummary(container)).toBe('Showing 1-2 of 3');
    });

    it('clamps an out-of-range page down to the last valid page instead of rendering empty', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2, page: 99 },
      });

      expect(getBodyRows(container)).toHaveLength(1);
      expect(getPaginationSummary(container)).toBe('Showing 3-3 of 3');
      expect(container.textContent).not.toContain('No data');
    });

    it('disables Previous on page 1 and enables Next', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2 },
      });

      expect(
        container.querySelector<HTMLButtonElement>(
          '[aria-label="Previous page"]',
        )?.disabled,
      ).toBe(true);
      expect(
        container.querySelector<HTMLButtonElement>('[aria-label="Next page"]')
          ?.disabled,
      ).toBe(false);
    });

    it('disables Next on the last page', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2, page: 2 },
      });

      expect(
        container.querySelector<HTMLButtonElement>('[aria-label="Next page"]')
          ?.disabled,
      ).toBe(true);
      expect(
        container.querySelector<HTMLButtonElement>(
          '[aria-label="Previous page"]',
        )?.disabled,
      ).toBe(false);
    });

    it('advances the page via Next and writes the value back through the [(page)] model', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { pageSize: 2 } },
      );

      within(container).getByRole('button', { name: 'Next page' }).click();
      fixture.detectChanges();

      expect(componentInstance.page()).toBe(2);
    });

    it('self-heals an out-of-range bound page on the next Previous click', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { pageSize: 2, page: 99 } },
      );

      within(container).getByRole('button', { name: 'Previous page' }).click();
      fixture.detectChanges();

      expect(componentInstance.page()).toBe(1);
    });

    it('resets to page 1 when a sortable column header is clicked', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { pageSize: 2, page: 2 } },
      );

      within(container).getByRole('button', { name: 'Name' }).click();
      fixture.detectChanges();

      expect(componentInstance.page()).toBe(1);
    });

    it('does not reset the page when pageSize changes — clamps only', () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { pageSize: 2 } },
      );
      within(container).getByRole('button', { name: 'Next page' }).click();
      fixture.detectChanges();
      expect(getPaginationSummary(container)).toBe('Showing 3-3 of 3');

      setInputs({ pageSize: 3 });
      fixture.detectChanges();

      expect(getPaginationSummary(container)).toBe('Showing 1-3 of 3');
    });

    it('shows the genuine emptyMessage, not a pagination artifact, when data is empty and pageSize is set', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { data: [], pageSize: 2 },
      });

      expect(container.textContent).toContain('No data');
      expect(getPaginationSummary(container)).toBe('No results');
    });

    it('shows a rows-per-page selector by default, and changing it resets to page 1', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { pageSize: 2, page: 2 } },
      );

      expect(
        within(container).getByRole('combobox', { name: 'Rows per page' }),
      ).toBeTruthy();

      within(container)
        .getByRole('combobox', { name: 'Rows per page' })
        .click();
      fixture.detectChanges();
      // The listbox panel is CDK-portaled onto document.body, outside
      // `container`'s own layout box — same as Select/MultiSelect elsewhere.
      within(document.body).getByRole('option', { name: '25 / page' }).click();
      fixture.detectChanges();

      expect(getPaginationSummary(container)).toBe('Showing 1-3 of 3');
    });

    it('forwards pageSizeOptions to the rows-per-page selector so a non-default pageSize still has a matching option', () => {
      const { container } = renderDynamoComponent<DynamoTable<Person>>(
        DynamoTable,
        {
          inputs: {
            columns: SORTABLE_COLUMNS,
            data: PEOPLE,
            pageSize: 2,
            pageSizeOptions: [2, 3],
          },
        },
      );

      expect(
        within(container).getByRole('combobox', { name: 'Rows per page' })
          .textContent,
      ).toContain('2 / page');
    });

    it('paginates through the DynamoTableHarness', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2 },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTableHarness,
      );

      expect(await harness.getPaginationSummary()).toBe('Showing 1-2 of 3');
      expect(await harness.isPreviousPageDisabled()).toBe(true);

      await harness.goToNextPage();

      expect(await harness.getPaginationSummary()).toBe('Showing 3-3 of 3');
      expect(await harness.isNextPageDisabled()).toBe(true);

      await harness.goToPreviousPage();

      expect(await harness.getPaginationSummary()).toBe('Showing 1-2 of 3');
    });
  });

  describe('selection', () => {
    it('renders no selection column when selectable is false (default)', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent);

      expect(container.querySelector('input[type="checkbox"]')).toBeNull();
    });

    it('toggles a single row into the [(selected)] model', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true } },
      );

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();
      expect(componentInstance.selected()).toEqual([PEOPLE[0]]);

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();
      expect(componentInstance.selected()).toEqual([]);
    });

    it('selects only the current page via the header checkbox when paginated, accumulating across pages', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true, pageSize: 2 } },
      );

      getSelectAllCheckbox(container)?.click();
      fixture.detectChanges();
      expect(componentInstance.selected()).toHaveLength(2);

      within(container).getByRole('button', { name: 'Next page' }).click();
      fixture.detectChanges();
      getSelectAllCheckbox(container)?.click();
      fixture.detectChanges();

      expect(componentInstance.selected()).toHaveLength(3);
    });

    it('persists selection across page navigation', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true, pageSize: 2 } },
      );

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();

      within(container).getByRole('button', { name: 'Next page' }).click();
      fixture.detectChanges();
      expect(componentInstance.selected()).toHaveLength(1);

      within(container).getByRole('button', { name: 'Previous page' }).click();
      fixture.detectChanges();

      expect(getRowCheckboxes(container)[0]?.checked).toBe(true);
    });

    it('sets the header checkbox indeterminate when only some current-page rows are selected', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true } },
      );

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();

      const selectAll = getSelectAllCheckbox(container);
      expect(selectAll?.indeterminate).toBe(true);
      expect(selectAll?.checked).toBe(false);
    });

    it('clears indeterminate once every current-page row is selected', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true } },
      );

      for (const checkbox of getRowCheckboxes(container)) {
        checkbox.click();
      }
      fixture.detectChanges();

      const selectAll = getSelectAllCheckbox(container);
      expect(selectAll?.indeterminate).toBe(false);
      expect(selectAll?.checked).toBe(true);
    });

    it('leaves the header checkbox unchecked and not indeterminate when nothing is selected', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { selectable: true },
      });

      const selectAll = getSelectAllCheckbox(container);
      expect(selectAll?.indeterminate).toBe(false);
      expect(selectAll?.checked).toBe(false);
    });

    it('uses trackBy for selection identity when row objects are recreated with new references', () => {
      const { container, fixture, setInputs, componentInstance } =
        renderDynamoComponent(TableItemHostComponent, {
          inputs: { trackBy: (row: Item) => row.id },
        });

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();
      expect(componentInstance.selected()).toHaveLength(1);

      setInputs({
        data: [
          { id: 1, name: 'First' },
          { id: 2, name: 'Second' },
        ].map((item) => ({ ...item })),
      });
      fixture.detectChanges();

      expect(getRowCheckboxes(container)[0]?.checked).toBe(true);
    });

    it('treats row objects with equal contents but different references as distinct when trackBy is not provided', () => {
      const { container, fixture, setInputs } = renderDynamoComponent(
        TableItemHostComponent,
      );

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();

      setInputs({
        data: [
          { id: 1, name: 'First' },
          { id: 2, name: 'Second' },
        ].map((item) => ({ ...item })),
      });
      fixture.detectChanges();

      expect(getRowCheckboxes(container)[0]?.checked).toBe(false);
    });

    it('applies the selected-row highlight class only to selected rows', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true } },
      );

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();

      const rows = getBodyRows(container);
      expect(rows[0]?.className).toContain('bg-primary');
      expect(rows[1]?.className).not.toContain('bg-primary');
    });

    it('disables the select-all checkbox when the current page has zero rows', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { selectable: true, data: [] },
      });

      expect(getSelectAllCheckbox(container)?.disabled).toBe(true);
    });

    it('selects and reads selection through the DynamoTableHarness', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { selectable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTableHarness,
      );

      expect(await harness.getSelectedCount()).toBe(0);

      await harness.toggleRowSelection('Charlie');

      expect(await harness.isRowSelected('Charlie')).toBe(true);
      expect(await harness.getSelectedCount()).toBe(1);
    });
  });

  describe('pagination + selection together', () => {
    it('keeps independently-made selections across both pages after navigating', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { selectable: true, pageSize: 2 } },
      );

      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();

      within(container).getByRole('button', { name: 'Next page' }).click();
      fixture.detectChanges();
      getRowCheckboxes(container)[0]?.click();
      fixture.detectChanges();

      within(container).getByRole('button', { name: 'Previous page' }).click();
      fixture.detectChanges();

      expect(componentInstance.selected()).toHaveLength(2);
      expect(getRowCheckboxes(container)[0]?.checked).toBe(true);
    });
  });

  describe('filtering', () => {
    it('renders no search input when filterable is false (default)', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent);

      expect(container.querySelector('input[type="search"]')).toBeNull();
    });

    it('renders a search input with the given placeholder when filterable is true', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { filterable: true, filterPlaceholder: 'Find a person' },
      });

      expect(getFilterInput(container).placeholder).toBe('Find a person');
    });

    it('filters rows via a case-insensitive substring match and writes filterText back', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true } },
      );

      setFilterValue(container, 'ADA');
      fixture.detectChanges();

      expect(getColumnValues(container, 0)).toEqual(['Ada']);
      expect(componentInstance.filterText()).toBe('ADA');
    });

    it('matches when any filterable-eligible column contains the query', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true } },
      );

      setFilterValue(container, '40'); // only Ada's age
      fixture.detectChanges();

      expect(getColumnValues(container, 0)).toEqual(['Ada']);
    });

    it('treats a whitespace-only filter as matching everything', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true } },
      );

      setFilterValue(container, '   ');
      fixture.detectChanges();

      expect(getBodyRows(container)).toHaveLength(3);
    });

    it('excludes a column with filterable: false from matching', () => {
      const columns: DynamoTableColumn<Person>[] = [
        { field: 'name', header: 'Name' },
        { field: 'age', header: 'Age', filterable: false },
      ];
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true, columns } },
      );

      setFilterValue(container, '40'); // Ada's age — but age is filterable:false
      fixture.detectChanges();

      // "No matching rows" (the empty-state row) renders instead of any
      // data row — getBodyRows would still report 1 `<tr>` for that row.
      expect(container.textContent).toContain('No matching rows');
    });

    it('resets to page 1 when the filter text changes', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true, pageSize: 1, page: 2 } },
      );

      setFilterValue(container, 'a');
      fixture.detectChanges();

      expect(componentInstance.page()).toBe(1);
    });

    it('scopes select-all to only the currently filtered rows', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true, selectable: true } },
      );

      setFilterValue(container, 'da'); // matches only "Ada"
      fixture.detectChanges();

      getSelectAllCheckbox(container)?.click();
      fixture.detectChanges();

      expect(componentInstance.selected()).toEqual([PEOPLE[1]]); // Ada
    });

    it('filters through the DynamoTableHarness', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { filterable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTableHarness,
      );

      await harness.setFilterText('ada');

      expect(await harness.getRowCount()).toBe(1);
      expect(await harness.getFilterText()).toBe('ada');
    });
  });

  describe('empty state messaging', () => {
    it('shows emptyMessage (not noMatchesMessage) when data itself is empty and no filter is active', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { data: [], filterable: true },
      });

      expect(container.textContent).toContain('No data');
      expect(container.textContent).not.toContain('No matching rows');
    });

    it('shows emptyMessage (not noMatchesMessage) when data is empty even with an active filter bound', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { data: [], filterable: true, filterText: 'anything' },
      });

      expect(container.textContent).toContain('No data');
      expect(container.textContent).not.toContain('No matching rows');
    });

    it('shows noMatchesMessage when data has rows but the filter matches none', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true } },
      );

      setFilterValue(container, 'zzz-no-match');
      fixture.detectChanges();

      expect(container.textContent).toContain('No matching rows');
      expect(container.textContent).not.toContain('No data');
    });

    it('honors a custom noMatchesMessage', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true, noMatchesMessage: 'Nothing found' } },
      );

      setFilterValue(container, 'zzz');
      fixture.detectChanges();

      expect(container.textContent).toContain('Nothing found');
    });

    it('still clamps to a non-empty page instead of showing an empty state when filtered rows exist', () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true, pageSize: 2, page: 5 } },
      );

      setFilterValue(container, 'a'); // matches all three, still exercises the clamp
      fixture.detectChanges();

      expect(container.textContent).not.toContain('No data');
      expect(container.textContent).not.toContain('No matching rows');
    });

    it('reads the empty-state message through the DynamoTableHarness', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { filterable: true },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTableHarness,
      );

      await harness.setFilterText('zzz');

      expect(await harness.getEmptyStateMessage()).toBe('No matching rows');
    });
  });

  describe('cellTemplate', () => {
    it('renders the template instead of cellValue when cellTemplate is set', () => {
      const { container } = renderDynamoComponent(
        TableCellTemplateHostComponent,
      );

      expect(container.querySelector('[data-cell-marker]')).not.toBeNull();
      expect(container.textContent).not.toContain('Age: 25'); // the `cell` output never renders
    });

    it('passes $implicit/row/index correctly into the template context', () => {
      const { container } = renderDynamoComponent(
        TableCellTemplateHostComponent,
      );

      const markers = Array.from(
        container.querySelectorAll('[data-cell-marker]'),
      ).map((el) => el.textContent?.trim());
      // PEOPLE = [Charlie 25, Ada 40, Bea 30] (unsorted, default order)
      expect(markers).toEqual(['25yo (idx 0)', '40yo (idx 1)', '30yo (idx 2)']);
    });

    it('index stays absolute (pre-pagination) even when pageSize is set', () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        TableCellTemplateHostComponent,
        { inputs: { pageSize: 2 } },
      );
      componentInstance.page.set(2);
      fixture.detectChanges();

      const markers = Array.from(
        container.querySelectorAll('[data-cell-marker]'),
      ).map((el) => el.textContent?.trim());
      // Page 2 shows only Bea (absolute index 2), not page-relative index 0
      expect(markers).toEqual(['30yo (idx 2)']);
    });

    it('sorts by the raw field even when the column also has a cellTemplate', () => {
      const { container, fixture } = renderDynamoComponent(
        TableCellTemplateHostComponent,
      );

      within(container).getByRole('button', { name: 'Age' }).click();
      fixture.detectChanges();

      const markers = Array.from(
        container.querySelectorAll('[data-cell-marker]'),
      ).map((el) => el.textContent);
      expect(markers[0]).toContain('25yo');
    });

    it('has no axe violations when a column uses cellTemplate', async () => {
      const { fixture } = renderDynamoComponent(TableCellTemplateHostComponent);

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });

  describe('accessibility (v3)', () => {
    it('has no axe violations with the filter search box rendered', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { filterable: true },
      });

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });

    it('has no axe violations in the "no matching rows" empty state', async () => {
      const { container, fixture } = renderDynamoComponent(
        TableTestHostComponent,
        { inputs: { filterable: true } },
      );

      setFilterValue(container, 'zzz');
      fixture.detectChanges();

      await expect(
        expectNoA11yViolations(fixture.nativeElement),
      ).resolves.toBeUndefined();
    });
  });
});
