import { Component, input, model } from '@angular/core';
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
import type { DynamoTableColumn } from './table.types';

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

function getPageText(container: HTMLElement): string {
  return (
    container.querySelector('[aria-live="polite"]')?.textContent?.trim() ?? ''
  );
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
      expect(getPageText(container)).toBe('Page 1 of 2');
    });

    it('clamps an out-of-range page down to the last valid page instead of rendering empty', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2, page: 99 },
      });

      expect(getBodyRows(container)).toHaveLength(1);
      expect(getPageText(container)).toBe('Page 2 of 2');
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
      expect(getPageText(container)).toBe('Page 2 of 2');

      setInputs({ pageSize: 3 });
      fixture.detectChanges();

      expect(getPageText(container)).toBe('Page 1 of 1');
    });

    it('shows the genuine emptyMessage, not a pagination artifact, when data is empty and pageSize is set', () => {
      const { container } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { data: [], pageSize: 2 },
      });

      expect(container.textContent).toContain('No data');
      expect(getPageText(container)).toBe('Page 1 of 1');
    });

    it('paginates through the DynamoTableHarness', async () => {
      const { fixture } = renderDynamoComponent(TableTestHostComponent, {
        inputs: { pageSize: 2 },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTableHarness,
      );

      expect(await harness.getPageText()).toBe('Page 1 of 2');
      expect(await harness.isPreviousPageDisabled()).toBe(true);

      await harness.goToNextPage();

      expect(await harness.getPageText()).toBe('Page 2 of 2');
      expect(await harness.isNextPageDisabled()).toBe(true);

      await harness.goToPreviousPage();

      expect(await harness.getPageText()).toBe('Page 1 of 2');
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
});
