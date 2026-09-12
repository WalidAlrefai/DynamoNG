import { Component, model, signal } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { DynamoTreeTable } from './tree-table';
import { DynamoTreeTableHarness } from './tree-table.harness';
import type {
  DynamoTreeTableColumn,
  DynamoTreeTableNode,
} from './tree-table.types';

interface FileRow {
  name: string;
  size: string;
  modified: string;
}

// docs (branch)
//   ├─ resume (leaf)
//   └─ cover (leaf, disabled)
// photos (branch)
//   ├─ vacation (branch)
//   │   ├─ beach (leaf)
//   │   └─ mountain (leaf)
//   └─ family (leaf)
// notes (leaf)
function sampleItems(): DynamoTreeTableNode<FileRow>[] {
  return [
    {
      id: 'docs',
      data: { name: 'docs', size: '—', modified: '2024-01-01' },
      children: [
        {
          id: 'resume',
          data: { name: 'resume.pdf', size: '120kb', modified: '2024-02-01' },
        },
        {
          id: 'cover',
          data: { name: 'cover.pdf', size: '80kb', modified: '2023-11-01' },
          disabled: true,
        },
      ],
    },
    {
      id: 'photos',
      data: { name: 'photos', size: '—', modified: '2024-03-01' },
      children: [
        {
          id: 'vacation',
          data: { name: 'vacation', size: '—', modified: '2024-04-01' },
          children: [
            {
              id: 'beach',
              data: {
                name: 'beach.jpg',
                size: '2.4mb',
                modified: '2024-04-02',
              },
            },
            {
              id: 'mountain',
              data: {
                name: 'mountain.jpg',
                size: '3.1mb',
                modified: '2024-04-03',
              },
            },
          ],
        },
        {
          id: 'family',
          data: { name: 'family.jpg', size: '1.8mb', modified: '2024-04-05' },
        },
      ],
    },
    {
      id: 'notes',
      data: { name: 'notes.txt', size: '2kb', modified: '2024-05-01' },
    },
  ];
}

function sampleColumns(): DynamoTreeTableColumn<FileRow>[] {
  return [
    { field: 'name', header: 'Name', sortable: true },
    { field: 'size', header: 'Size', sortable: true },
    { field: 'modified', header: 'Modified' },
  ];
}

function rows(container: HTMLElement): HTMLElement[] {
  // Excludes the synthetic `@empty` row (it carries a `td[colspan]`, which
  // no real data row ever does — same disambiguation Table's own harness
  // uses).
  return Array.from(
    container.querySelectorAll<HTMLElement>('tbody tr[role="row"]'),
  ).filter((row) => !row.querySelector('td[colspan]'));
}

function rowByName(container: HTMLElement, name: string): HTMLElement {
  const el = rows(container).find((row) =>
    row.querySelector('td')?.textContent?.trim().startsWith(name),
  );
  if (!el) throw new Error(`row not found: ${name}`);
  return el;
}

function rowNames(container: HTMLElement): string[] {
  return rows(container).map(
    (row) => row.querySelector('td')?.textContent?.trim() ?? '',
  );
}

// Matches on the whole row's text content rather than assuming the first
// `<td>` holds the name — once `selectable` is on, the first `<td>` is the
// checkbox cell instead.
function rowByNameSelectable(
  container: HTMLElement,
  name: string,
): HTMLElement {
  const el = rows(container).find((row) => row.textContent?.includes(name));
  if (!el) throw new Error(`row not found: ${name}`);
  return el;
}

function checkboxIn(row: HTMLElement): HTMLInputElement {
  return row.querySelector('input[type="checkbox"]') as HTMLInputElement;
}

function headerCheckbox(container: HTMLElement): HTMLInputElement {
  return container.querySelector(
    'thead input[type="checkbox"]',
  ) as HTMLInputElement;
}

@Component({
  selector: 'dg-tree-table-test-host',
  standalone: true,
  imports: [DynamoTreeTable],
  template: `
    <dg-tree-table
      [items]="items()"
      [columns]="columns()"
      [(expandedIds)]="expanded"
      ariaLabel="Files"
    />
  `,
})
class TreeTableTestHostComponent {
  readonly items = signal(sampleItems());
  readonly columns = signal(sampleColumns());
  readonly expanded = model<string[]>([]);
}

describe('DynamoTreeTable', () => {
  describe('creation', () => {
    it('renders one row per root-level node by default (children collapsed)', () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);

      expect(rowNames(container)).toEqual(['docs', 'photos', 'notes.txt']);
    });

    it('renders role="treegrid" on the table with the given aria-label', () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);

      const table = container.querySelector('[role="treegrid"]');
      expect(table?.getAttribute('aria-label')).toBe('Files');
    });

    it('renders one header cell per column', () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);

      const headers = Array.from(container.querySelectorAll('thead th')).map(
        (el) => el.textContent?.trim(),
      );
      expect(headers).toEqual(['Name', 'Size', 'Modified']);
    });
  });

  describe('default behavior', () => {
    it('starts with nothing expanded', () => {
      const { componentInstance } = renderDynamoComponent(
        TreeTableTestHostComponent,
      );

      expect(componentInstance.expanded()).toEqual([]);
    });

    it('makes the first row the only roving tab stop by default', () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);

      expect(rowByName(container, 'docs').getAttribute('tabindex')).toBe('0');
      expect(rowByName(container, 'photos').getAttribute('tabindex')).toBe(
        '-1',
      );
      expect(rowByName(container, 'notes.txt').getAttribute('tabindex')).toBe(
        '-1',
      );
    });

    it('does not render aria-expanded on a leaf row', () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);

      expect(
        rowByName(container, 'notes.txt').getAttribute('aria-expanded'),
      ).toBeNull();
    });
  });

  describe('rendering', () => {
    it("renders the other columns' plain values alongside the tree column", () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);

      const cells = Array.from(
        rowByName(container, 'notes.txt').querySelectorAll('td'),
      ).map((el) => el.textContent?.trim());
      expect(cells).toEqual(['notes.txt', '2kb', '2024-05-01']);
    });

    it('renders a custom cellTemplate instead of the default value', () => {
      @Component({
        selector: 'dg-tree-table-template-host',
        standalone: true,
        imports: [DynamoTreeTable],
        template: `
          <dg-tree-table
            [items]="items"
            [columns]="[
              { field: 'size', header: 'Size', cellTemplate: sizeTemplate },
            ]"
          />
          <ng-template #sizeTemplate let-row>SIZE:{{ row.size }}</ng-template>
        `,
      })
      class TemplateHostComponent {
        readonly items: DynamoTreeTableNode<FileRow>[] = [
          { id: 'a', data: { name: 'a', size: '5kb', modified: '' } },
        ];
      }

      const { container } = renderDynamoComponent(TemplateHostComponent);

      expect(rowByName(container, 'SIZE:5kb')).toBeTruthy();
    });
  });

  describe('expand/collapse', () => {
    it('expands a branch and renders its children when the chevron is clicked', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTableTestHostComponent,
      );

      const chevron = rowByName(container, 'docs').querySelector<HTMLElement>(
        '[data-testid="chevron"]',
      )!;
      await userEvent.click(chevron);

      expect(componentInstance.expanded()).toEqual(['docs']);
      expect(rowNames(container)).toEqual([
        'docs',
        'resume.pdf',
        'cover.pdf',
        'photos',
        'notes.txt',
      ]);
    });

    it('collapses an expanded branch when its chevron is clicked again', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTableTestHostComponent,
      );
      const chevron = () =>
        rowByName(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!;
      await userEvent.click(chevron());

      await userEvent.click(chevron());

      expect(componentInstance.expanded()).toEqual([]);
      expect(rowNames(container)).toEqual(['docs', 'photos', 'notes.txt']);
    });

    it('clicking elsewhere in a row does nothing', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTableTestHostComponent,
      );

      const cells = rowByName(container, 'docs').querySelectorAll('td');
      await userEvent.click(cells[1]!); // the Size column, not the chevron

      expect(componentInstance.expanded()).toEqual([]);
    });

    it('indentation compounds at 3+ levels deep', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      await userEvent.click(
        rowByName(container, 'photos').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      await userEvent.click(
        rowByName(container, 'vacation').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );

      expect(rowNames(container)).toEqual([
        'docs',
        'photos',
        'vacation',
        'beach.jpg',
        'mountain.jpg',
        'family.jpg',
        'notes.txt',
      ]);
      const beachIndent = rowByName(
        container,
        'beach.jpg',
      ).querySelector<HTMLElement>('span')!;
      const photosIndent = rowByName(
        container,
        'photos',
      ).querySelector<HTMLElement>('span')!;
      expect(parseFloat(beachIndent.style.paddingLeft)).toBeGreaterThan(
        parseFloat(photosIndent.style.paddingLeft),
      );
    });
  });

  describe('keyboard navigation', () => {
    it('moves focus with ArrowDown/ArrowUp across root-level rows', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      rowByName(container, 'docs').focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(rowByName(container, 'photos'));

      await userEvent.keyboard('{ArrowUp}');
      expect(document.activeElement).toBe(rowByName(container, 'docs'));
    });

    it('wraps ArrowDown from the last visible row to the first', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      rowByName(container, 'notes.txt').focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(rowByName(container, 'docs'));
    });

    it('jumps to the first/last visible row on Home/End', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      rowByName(container, 'photos').focus();

      await userEvent.keyboard('{End}');
      expect(document.activeElement).toBe(rowByName(container, 'notes.txt'));

      await userEvent.keyboard('{Home}');
      expect(document.activeElement).toBe(rowByName(container, 'docs'));
    });

    it('descends into expanded children with ArrowDown, skipping disabled rows', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      await userEvent.click(
        rowByName(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      rowByName(container, 'docs').focus();

      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(rowByName(container, 'resume.pdf'));

      // 'cover.pdf' is disabled and is skipped, straight to 'photos'.
      await userEvent.keyboard('{ArrowDown}');
      expect(document.activeElement).toBe(rowByName(container, 'photos'));
    });

    it('expands with ArrowRight and moves into the first child on a second ArrowRight', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      rowByName(container, 'docs').focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(rowByName(container, 'docs').getAttribute('aria-expanded')).toBe(
        'true',
      );
      expect(document.activeElement).toBe(rowByName(container, 'docs'));

      await userEvent.keyboard('{ArrowRight}');
      expect(document.activeElement).toBe(rowByName(container, 'resume.pdf'));
    });

    it('collapses with ArrowLeft, and moves to the parent with a second ArrowLeft', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      rowByName(container, 'docs').focus();
      await userEvent.keyboard('{ArrowRight}'); // expand
      await userEvent.keyboard('{ArrowRight}'); // move to resume.pdf

      await userEvent.keyboard('{ArrowLeft}');
      expect(document.activeElement).toBe(rowByName(container, 'docs'));

      await userEvent.keyboard('{ArrowLeft}');
      expect(rowByName(container, 'docs').getAttribute('aria-expanded')).toBe(
        'false',
      );
    });

    it('Enter toggles expand on a branch and does nothing on a leaf', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      rowByName(container, 'docs').focus();

      await userEvent.keyboard('{Enter}');
      expect(rowByName(container, 'docs').getAttribute('aria-expanded')).toBe(
        'true',
      );

      rowByName(container, 'notes.txt').focus();
      await userEvent.keyboard('{Enter}');
      expect(document.activeElement).toBe(rowByName(container, 'notes.txt'));
    });

    it('an unhandled key does nothing', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        TreeTableTestHostComponent,
      );
      rowByName(container, 'docs').focus();

      await userEvent.keyboard('z');

      expect(componentInstance.expanded()).toEqual([]);
      expect(document.activeElement).toBe(rowByName(container, 'docs'));
    });
  });

  describe('sorting', () => {
    it('cycles a sortable column asc -> desc -> unsorted', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      const header = Array.from(
        container.querySelectorAll('thead button'),
      ).find((el) => el.textContent?.trim() === 'Name')!;

      await userEvent.click(header);
      expect(rowNames(container)).toEqual(['docs', 'notes.txt', 'photos']);

      await userEvent.click(header);
      expect(rowNames(container)).toEqual(['photos', 'notes.txt', 'docs']);

      await userEvent.click(header);
      expect(rowNames(container)).toEqual(['docs', 'photos', 'notes.txt']);
    });

    it('sorts each level independently, without flattening across levels', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      await userEvent.click(
        rowByName(container, 'photos').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      const header = Array.from(
        container.querySelectorAll('thead button'),
      ).find((el) => el.textContent?.trim() === 'Name')!;

      await userEvent.click(header); // asc

      // Root order becomes alphabetical (docs, notes.txt, photos) and
      // "family.jpg" sorts before "vacation" among photos' own children —
      // but photos' children never mix with docs'/notes' siblings.
      expect(rowNames(container)).toEqual([
        'docs',
        'notes.txt',
        'photos',
        'family.jpg',
        'vacation',
      ]);
    });
  });

  describe('disabled items', () => {
    it('a disabled row is never focused via Arrow navigation', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      await userEvent.click(
        rowByName(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      rowByName(container, 'resume.pdf').focus();

      await userEvent.keyboard('{ArrowDown}');

      expect(document.activeElement).toBe(rowByName(container, 'photos'));
    });
  });

  describe('selection', () => {
    it('renders no selection column when selectable is false (default)', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        { inputs: { items: sampleItems(), columns: sampleColumns() } },
      );

      expect(container.querySelector('input[type="checkbox"]')).toBeNull();
    });

    it('checks a leaf directly', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });

      await userEvent.click(
        checkboxIn(rowByNameSelectable(container, 'notes.txt')),
      );
      fixture.detectChanges();

      expect(componentInstance.selected()).toEqual(['notes']);
    });

    it('cascades a parent check to all enabled descendants, skipping disabled ones', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      await userEvent.click(
        rowByNameSelectable(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );

      await userEvent.click(checkboxIn(rowByNameSelectable(container, 'docs')));
      fixture.detectChanges();

      expect(componentInstance.selected().sort()).toEqual(['docs', 'resume']);
    });

    it('cascades an uncheck back through all enabled descendants', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      await userEvent.click(
        rowByNameSelectable(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      await userEvent.click(checkboxIn(rowByNameSelectable(container, 'docs')));

      await userEvent.click(checkboxIn(rowByNameSelectable(container, 'docs')));
      fixture.detectChanges();

      expect(componentInstance.selected()).toEqual([]);
    });

    it('shows indeterminate on an ancestor through 2+ levels when only some descendants are checked', async () => {
      const { container, fixture } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      await userEvent.click(
        rowByNameSelectable(container, 'photos').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      await userEvent.click(
        rowByNameSelectable(container, 'vacation').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );

      await userEvent.click(
        checkboxIn(rowByNameSelectable(container, 'beach.jpg')),
      );
      fixture.detectChanges();

      expect(
        checkboxIn(rowByNameSelectable(container, 'vacation')).indeterminate,
      ).toBe(true);
      expect(
        checkboxIn(rowByNameSelectable(container, 'photos')).indeterminate,
      ).toBe(true);
    });

    it('does not toggle a disabled node', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      await userEvent.click(
        rowByNameSelectable(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );

      await userEvent.click(
        checkboxIn(rowByNameSelectable(container, 'cover.pdf')),
      );
      fixture.detectChanges();

      expect(componentInstance.selected()).toEqual([]);
    });

    it('select-all checks every node in the tree, including collapsed ones', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });

      await userEvent.click(headerCheckbox(container));
      fixture.detectChanges();

      // "cover" is excluded — it's disabled, so it's never part of any cascade.
      expect(componentInstance.selected().sort()).toEqual([
        'beach',
        'docs',
        'family',
        'mountain',
        'notes',
        'photos',
        'resume',
        'vacation',
      ]);
    });

    it('select-all clears every checked node when already fully checked', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      await userEvent.click(headerCheckbox(container));
      fixture.detectChanges();

      await userEvent.click(headerCheckbox(container));
      fixture.detectChanges();

      expect(componentInstance.selected()).toEqual([]);
    });

    it('toggles the focused row via Enter/Space when selectable', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      rowByNameSelectable(container, 'notes.txt').focus();

      await userEvent.keyboard('{Enter}');
      fixture.detectChanges();

      expect(componentInstance.selected()).toEqual(['notes']);
    });
  });

  describe('itemSelect', () => {
    it('emits the full node object on check and on uncheck', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      const emitted: DynamoTreeTableNode<FileRow>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      const checkbox = checkboxIn(rowByNameSelectable(container, 'notes.txt'));

      await userEvent.click(checkbox);
      fixture.detectChanges();
      await userEvent.click(checkbox);
      fixture.detectChanges();

      expect(emitted.map((n) => n.id)).toEqual(['notes', 'notes']);
    });

    it('emits once for a cascading parent check, not once per descendant', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      const emitted: DynamoTreeTableNode<FileRow>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      await userEvent.click(
        rowByNameSelectable(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      const checkbox = checkboxIn(rowByNameSelectable(container, 'docs'));

      await userEvent.click(checkbox);
      fixture.detectChanges();

      expect(emitted.map((n) => n.id)).toEqual(['docs']);
    });

    it('does not emit for a disabled node', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      const emitted: DynamoTreeTableNode<FileRow>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));
      await userEvent.click(
        rowByNameSelectable(container, 'docs').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      const checkbox = checkboxIn(rowByNameSelectable(container, 'cover.pdf'));

      await userEvent.click(checkbox);
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });

    it('does not emit from toggleSelectAll (the header checkbox)', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          selectable: true,
        },
      });
      const emitted: DynamoTreeTableNode<FileRow>[] = [];
      componentInstance.itemSelect.subscribe((node) => emitted.push(node));

      await userEvent.click(headerCheckbox(container));
      fixture.detectChanges();
      await userEvent.click(headerCheckbox(container));
      fixture.detectChanges();

      expect(emitted).toHaveLength(0);
    });
  });

  describe('user interactions', () => {
    it('supports interaction through the DynamoTreeTableHarness', async () => {
      const { fixture } = renderDynamoComponent(TreeTableTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeTableHarness,
      );

      expect(await harness.getVisibleRowCount()).toBe(3);
      await harness.toggleExpand('docs');
      expect(await harness.isExpanded('docs')).toBe(true);
      expect(await harness.getColumnText(0)).toEqual([
        'docs',
        'resume.pdf',
        'cover.pdf',
        'photos',
        'notes.txt',
      ]);
    });

    it('sorts via the harness and reports no empty-state message when rows exist', async () => {
      const { fixture } = renderDynamoComponent(TreeTableTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeTableHarness,
      );

      await harness.sortBy('Name');

      expect(await harness.getColumnText(0)).toEqual([
        'docs',
        'notes.txt',
        'photos',
      ]);
      expect(await harness.getEmptyStateMessage()).toBeNull();
    });

    it('reports the empty-state message via the harness when there is no data', async () => {
      const { fixture } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        {
          inputs: { items: [], columns: sampleColumns() },
        },
      );
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeTableHarness,
      );

      expect(await harness.getEmptyStateMessage()).toBe('No data');
    });

    it('throws from sortBy/toggleExpand when no matching header/row exists', async () => {
      const { fixture } = renderDynamoComponent(TreeTableTestHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoTreeTableHarness,
      );

      await expect(harness.sortBy('Nope')).rejects.toThrow();
      await expect(harness.toggleExpand('Nope')).rejects.toThrow();
      await expect(harness.toggleExpand('notes.txt')).rejects.toThrow(); // a leaf has no chevron
    });
  });

  describe('loading', () => {
    it('shows a spinner and loadingMessage in the empty-state slot instead of emptyMessage', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        { inputs: { items: [], columns: sampleColumns(), loading: true } },
      );

      expect(container.querySelector('dg-spinner')).not.toBeNull();
      expect(container.textContent).toContain('Loading…');
      expect(container.textContent).not.toContain('No data');
    });

    it('honors a custom loadingMessage', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        {
          inputs: {
            items: [],
            columns: sampleColumns(),
            loading: true,
            loadingMessage: 'Fetching…',
          },
        },
      );

      expect(container.textContent).toContain('Fetching…');
    });

    it('sets aria-busy="true" on the root while loading', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        {
          inputs: {
            items: sampleItems(),
            columns: sampleColumns(),
            loading: true,
          },
        },
      );

      expect(container.querySelector('[aria-busy="true"]')).not.toBeNull();
    });

    it('disables the sort button and ignores clicks on it while loading', async () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        {
          inputs: {
            items: sampleItems(),
            columns: sampleColumns(),
            loading: true,
          },
        },
      );
      const header = Array.from(
        container.querySelectorAll<HTMLButtonElement>('thead button'),
      ).find((el) => el.textContent?.trim() === 'Name')!;
      expect(header.disabled).toBe(true);

      await userEvent.click(header);

      expect(rowNames(container)).toEqual(['docs', 'photos', 'notes.txt']);
    });

    it('does not expand a branch when its chevron is clicked while loading', async () => {
      const { container, componentInstance } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: {
          items: sampleItems(),
          columns: sampleColumns(),
          loading: true,
        },
      });
      const chevron = rowByName(container, 'docs').querySelector<HTMLElement>(
        '[data-testid="chevron"]',
      )!;

      await userEvent.click(chevron);

      expect(componentInstance.expandedIds()).toEqual([]);
      expect(rowNames(container)).toEqual(['docs', 'photos', 'notes.txt']);
    });
  });

  describe('typeahead', () => {
    interface NameRow {
      name: string;
    }

    const TYPEAHEAD_COLUMNS: DynamoTreeTableColumn<NameRow>[] = [
      { field: 'name', header: 'Name' },
    ];

    const TYPEAHEAD_ITEMS: DynamoTreeTableNode<NameRow>[] = [
      { id: 'apple', data: { name: 'Apple' } },
      { id: 'apricot', data: { name: 'Apricot' } },
      { id: 'banana', data: { name: 'Banana' } },
    ];

    function dispatchKey(target: HTMLElement, key: string): void {
      target.dispatchEvent(
        new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }),
      );
    }

    it('jumps focus to the first matching row, matching against the first column', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<NameRow>>(
        DynamoTreeTable,
        { inputs: { items: TYPEAHEAD_ITEMS, columns: TYPEAHEAD_COLUMNS } },
      );

      dispatchKey(rowByName(container, 'Apple'), 'b');

      expect(document.activeElement).toBe(rowByName(container, 'Banana'));
    });

    it('cycles through rows sharing the same starting letter on repeated presses', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<NameRow>>(
        DynamoTreeTable,
        { inputs: { items: TYPEAHEAD_ITEMS, columns: TYPEAHEAD_COLUMNS } },
      );

      dispatchKey(rowByName(container, 'Apple'), 'a');
      expect(document.activeElement).toBe(rowByName(container, 'Apricot'));

      dispatchKey(rowByName(container, 'Apricot'), 'a');
      expect(document.activeElement).toBe(rowByName(container, 'Apple'));
    });

    it('resets the buffer after the timeout so a new letter starts a fresh match', () => {
      vi.useFakeTimers();
      try {
        const { container } = renderDynamoComponent<DynamoTreeTable<NameRow>>(
          DynamoTreeTable,
          { inputs: { items: TYPEAHEAD_ITEMS, columns: TYPEAHEAD_COLUMNS } },
        );

        dispatchKey(rowByName(container, 'Apple'), 'a');
        expect(document.activeElement).toBe(rowByName(container, 'Apricot'));

        vi.advanceTimersByTime(600);

        dispatchKey(rowByName(container, 'Apricot'), 'b');
        expect(document.activeElement).toBe(rowByName(container, 'Banana'));
      } finally {
        vi.useRealTimers();
      }
    });

    it('skips disabled rows', () => {
      const itemsWithDisabled: DynamoTreeTableNode<NameRow>[] = [
        { id: 'apple', data: { name: 'Apple' } },
        { id: 'apricot', data: { name: 'Apricot' }, disabled: true },
      ];
      const { container } = renderDynamoComponent<DynamoTreeTable<NameRow>>(
        DynamoTreeTable,
        { inputs: { items: itemsWithDisabled, columns: TYPEAHEAD_COLUMNS } },
      );

      dispatchKey(rowByName(container, 'Apple'), 'a');

      expect(document.activeElement).toBe(rowByName(container, 'Apple'));
    });
  });

  describe('accessibility', () => {
    it('has no axe violations when collapsed', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with a multi-level expanded tree', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      await userEvent.click(
        rowByName(container, 'photos').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );
      await userEvent.click(
        rowByName(container, 'vacation').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('sets aria-level correctly', async () => {
      const { container } = renderDynamoComponent(TreeTableTestHostComponent);
      await userEvent.click(
        rowByName(container, 'photos').querySelector<HTMLElement>(
          '[data-testid="chevron"]',
        )!,
      );

      expect(rowByName(container, 'vacation').getAttribute('aria-level')).toBe(
        '2',
      );
    });
  });

  describe('state changes', () => {
    it('expands a branch when expandedIds is set programmatically', () => {
      const { container, setInputs } = renderDynamoComponent<
        DynamoTreeTable<FileRow>
      >(DynamoTreeTable, {
        inputs: { items: sampleItems(), columns: sampleColumns() },
      });

      setInputs({ expandedIds: ['docs'] });

      expect(rowNames(container)).toContain('resume.pdf');
    });
  });

  describe('edge cases', () => {
    it('renders no rows for an empty items array, showing the empty message', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        {
          inputs: { items: [], columns: sampleColumns() },
        },
      );

      expect(rows(container)).toHaveLength(0);
      expect(
        container.querySelector('[role="status"]')?.textContent?.trim(),
      ).toBe('No data');
    });

    it('treats a node with an empty children array as expandable, not a leaf', () => {
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        {
          inputs: {
            items: [
              {
                id: 'empty',
                data: { name: 'Empty folder', size: '—', modified: '' },
                children: [],
              },
            ],
            columns: sampleColumns(),
          },
        },
      );

      expect(
        rowByName(container, 'Empty folder').getAttribute('aria-expanded'),
      ).toBeNull();
    });

    it('does not throw when every row is disabled', async () => {
      const items: DynamoTreeTableNode<FileRow>[] = [
        {
          id: 'a',
          data: { name: 'A', size: '', modified: '' },
          disabled: true,
        },
        {
          id: 'b',
          data: { name: 'B', size: '', modified: '' },
          disabled: true,
        },
      ];
      const { container } = renderDynamoComponent<DynamoTreeTable<FileRow>>(
        DynamoTreeTable,
        {
          inputs: { items, columns: sampleColumns() },
        },
      );

      await expect(async () => {
        rowByName(container, 'A').focus();
        await userEvent.keyboard('{ArrowDown}');
      }).not.toThrow();
    });

    it('renders deeply nested trees (5+ levels) without throwing', () => {
      const deep: DynamoTreeTableNode<FileRow> = {
        id: 'l0',
        data: { name: 'L0', size: '', modified: '' },
      };
      let current = deep;
      for (let i = 1; i <= 6; i++) {
        const child: DynamoTreeTableNode<FileRow> = {
          id: `l${i}`,
          data: { name: `L${i}`, size: '', modified: '' },
        };
        current.children = [child];
        current = child;
      }

      expect(() =>
        renderDynamoComponent<DynamoTreeTable<FileRow>>(DynamoTreeTable, {
          inputs: {
            items: [deep],
            columns: sampleColumns(),
            expandedIds: ['l0', 'l1', 'l2', 'l3', 'l4', 'l5'],
          },
        }),
      ).not.toThrow();
    });
  });
});
