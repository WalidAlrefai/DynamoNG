import { ComponentHarness, type TestElement } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTreeTable, for use in consumer app tests. */
export class DynamoTreeTableHarness extends ComponentHarness {
  static hostSelector = 'dg-tree-table';

  private readonly headerButtonLocators = this.locatorForAll('thead button');
  private readonly headerCellLocators = this.locatorForAll('thead th');
  private readonly bodyRowLocators = this.locatorForAll('tbody tr[role="row"]');
  private readonly bodyCellLocators = this.locatorForAll('tbody td');
  // A normal body <td> never carries a `colspan` attribute; only the
  // synthetic empty-state row's single <td> does (see tree-table.html) —
  // same reliable, markup-native technique as Table's own harness.
  private readonly emptyStateCellLocator = this.locatorForOptional('tbody td[colspan]');

  async sortBy(header: string): Promise<void> {
    for (const button of await this.headerButtonLocators()) {
      if ((await button.text()).trim() === header) {
        await button.click();
        return;
      }
    }
    throw new Error(`No sortable column header "${header}" found`);
  }

  async getVisibleRowCount(): Promise<number> {
    return (await this.bodyRowLocators()).length;
  }

  /**
   * Reads one column's values down every currently-visible row, by index.
   * `TestElement` has no nested-locator API, so this flattens all `<td>`s
   * (row-major document order) and picks every Nth one, where N is the
   * column count — same technique as Table's own `getColumnText`.
   */
  async getColumnText(columnIndex: number): Promise<string[]> {
    const columnCount = (await this.headerCellLocators()).length;
    const cells = await this.bodyCellLocators();
    const values: string[] = [];
    for (let i = columnIndex; i < cells.length; i += columnCount) {
      values.push((await cells[i]?.text())?.trim() ?? '');
    }
    return values;
  }

  async isExpanded(rowLabel: string): Promise<boolean | null> {
    const row = await this.findRow(rowLabel);
    const value = await row.getAttribute('aria-expanded');
    return value === null ? null : value === 'true';
  }

  /**
   * Clicks the chevron of the row whose first cell contains `rowLabel`.
   * `TestElement` has no nested-locator API, so the row's structural
   * position (found via `bodyRowLocators`) is used to build an `:nth-child`
   * selector scoped to just that row, rather than a flat index into all
   * chevrons (which aren't 1:1 with rows — leaf rows have none).
   */
  async toggleExpand(rowLabel: string): Promise<void> {
    const index = await this.findRowIndex(rowLabel);
    const chevron = await this.locatorForOptional(
      `tbody tr[role="row"]:nth-child(${index + 1}) [data-testid="chevron"]`,
    )();
    if (!chevron) {
      throw new Error(`Row "${rowLabel}" has no chevron (is it a leaf?)`);
    }
    await chevron.click();
  }

  /** The current `emptyMessage` text, or `null` when rows are rendered (no empty-state row present). */
  async getEmptyStateMessage(): Promise<string | null> {
    const cell = await this.emptyStateCellLocator();
    return (await cell?.text())?.trim() ?? null;
  }

  private async findRow(rowLabel: string): Promise<TestElement> {
    const rows = await this.bodyRowLocators();
    for (const row of rows) {
      if ((await row.text()).includes(rowLabel)) return row;
    }
    throw new Error(`No row containing "${rowLabel}" found`);
  }

  private async findRowIndex(rowLabel: string): Promise<number> {
    const rows = await this.bodyRowLocators();
    for (let i = 0; i < rows.length; i++) {
      if ((await rows[i]?.text())?.includes(rowLabel)) return i;
    }
    throw new Error(`No row containing "${rowLabel}" found`);
  }
}
