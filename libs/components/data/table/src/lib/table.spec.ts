import { Component, input } from '@angular/core';
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

@Component({
  selector: 'dg-table-test-host',
  standalone: true,
  imports: [DynamoTable],
  template: `<dg-table
    [columns]="columns()"
    [data]="data()"
    [ariaLabel]="ariaLabel()"
  />`,
})
class TableTestHostComponent {
  readonly columns = input<DynamoTableColumn<Person>[]>(SORTABLE_COLUMNS);
  readonly data = input<readonly Person[]>(PEOPLE);
  readonly ariaLabel = input<string | undefined>(undefined);
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
      'N/A — Table has no outputs in v1; sorted state is purely internal presentation state',
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
});
