import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTable, for use in consumer app tests. */
export class DynamoTableHarness extends ComponentHarness {
  static hostSelector = 'dg-table';

  private readonly headerButtonLocators = this.locatorForAll('thead button');
  private readonly headerCellLocators = this.locatorForAll('thead th');
  private readonly bodyRowLocators = this.locatorForAll('tbody tr');
  private readonly bodyCellLocators = this.locatorForAll('tbody td');
  private readonly rowCheckboxLocators = this.locatorForAll(
    'tbody input[type="checkbox"]',
  );
  private readonly selectAllCheckboxLocator = this.locatorForOptional(
    'thead input[type="checkbox"]',
  );
  private readonly previousPageButtonLocator = this.locatorForOptional(
    'button[aria-label="Previous page"]',
  );
  private readonly nextPageButtonLocator = this.locatorForOptional(
    'button[aria-label="Next page"]',
  );
  private readonly pageIndicatorLocator = this.locatorForOptional(
    '[aria-live="polite"]',
  );
  private readonly filterInputLocator = this.locatorForOptional(
    'input[type="search"]',
  );
  // A normal body <td> never carries a `colspan` attribute; only the
  // synthetic empty-state row's single <td> does (see table.html) — a
  // reliable, markup-native way to find it regardless of the real data's
  // shape.
  private readonly emptyStateCellLocator =
    this.locatorForOptional('tbody td[colspan]');

  async sortBy(header: string): Promise<void> {
    for (const button of await this.headerButtonLocators()) {
      if ((await button.text()).trim() === header) {
        await button.click();
        return;
      }
    }
    throw new Error(`No sortable column header "${header}" found`);
  }

  async getRowCount(): Promise<number> {
    return (await this.bodyRowLocators()).length;
  }

  /**
   * Reads one column's values down every row, by index. `TestElement`
   * has no nested-locator API, so this flattens all `<td>`s (in row-major
   * document order) and picks every Nth one, where N is the column count.
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

  /** Throws if `pageSize` is not set — there is no Prev/Next control to click. */
  async goToNextPage(): Promise<void> {
    const button = await this.nextPageButtonLocator();
    if (!button) {
      throw new Error('DynamoTable is not paginated (pageSize input not set)');
    }
    await button.click();
  }

  async goToPreviousPage(): Promise<void> {
    const button = await this.previousPageButtonLocator();
    if (!button) {
      throw new Error('DynamoTable is not paginated (pageSize input not set)');
    }
    await button.click();
  }

  /**
   * The `<dg-pagination>` footer's live summary text, e.g.
   * `"Showing 1-2 of 3"` or `"No results"`. Empty string when unpaginated
   * (`pageSize` unset — no `<dg-pagination>` rendered at all).
   */
  async getPaginationSummary(): Promise<string> {
    const indicator = await this.pageIndicatorLocator();
    return (await indicator?.text())?.trim() ?? '';
  }

  async isNextPageDisabled(): Promise<boolean> {
    const button = await this.nextPageButtonLocator();
    return (await button?.getProperty<boolean>('disabled')) ?? true;
  }

  async isPreviousPageDisabled(): Promise<boolean> {
    const button = await this.previousPageButtonLocator();
    return (await button?.getProperty<boolean>('disabled')) ?? true;
  }

  /** Throws if `selectable` is not set — there is no header checkbox to click. */
  async toggleSelectAll(): Promise<void> {
    const checkbox = await this.selectAllCheckboxLocator();
    if (!checkbox) {
      throw new Error(
        'DynamoTable is not selectable (selectable input not set)',
      );
    }
    await checkbox.click();
  }

  /**
   * Toggles the row whose text content contains `rowText` — same
   * "match by visible text" refactor-safety as `sortBy`. Rows and their
   * (at most one) selection checkbox are 1:1 in document order, so this
   * reuses `getColumnText`'s flatten-then-index approach rather than a
   * nested lookup, since `TestElement` has no nested-locator API.
   */
  async toggleRowSelection(rowText: string): Promise<void> {
    const index = await this.findRowIndex(rowText);
    const checkboxes = await this.rowCheckboxLocators();
    const checkbox = checkboxes[index];
    if (!checkbox) {
      throw new Error(
        `Row "${rowText}" has no selection checkbox — is selectable set?`,
      );
    }
    await checkbox.click();
  }

  async isRowSelected(rowText: string): Promise<boolean> {
    const index = await this.findRowIndex(rowText);
    const checkboxes = await this.rowCheckboxLocators();
    return (await checkboxes[index]?.getProperty<boolean>('checked')) ?? false;
  }

  async getSelectedCount(): Promise<number> {
    const checkboxes = await this.rowCheckboxLocators();
    let count = 0;
    for (const checkbox of checkboxes) {
      if (await checkbox.getProperty<boolean>('checked')) count++;
    }
    return count;
  }

  private async findRowIndex(rowText: string): Promise<number> {
    const rows = await this.bodyRowLocators();
    for (let i = 0; i < rows.length; i++) {
      if ((await rows[i]?.text())?.includes(rowText)) return i;
    }
    throw new Error(`No row containing "${rowText}" found`);
  }

  /** Throws if `filterable` is not set — there is no search input to type into. */
  async setFilterText(text: string): Promise<void> {
    const input = await this.filterInputLocator();
    if (!input) {
      throw new Error(
        'DynamoTable is not filterable (filterable input not set)',
      );
    }
    await input.clear();
    await input.sendKeys(text);
  }

  async getFilterText(): Promise<string> {
    const input = await this.filterInputLocator();
    return (await input?.getProperty<string>('value')) ?? '';
  }

  /**
   * The current `emptyMessage`/`noMatchesMessage` text, or `null` when
   * rows are rendered (no empty-state row present).
   */
  async getEmptyStateMessage(): Promise<string | null> {
    const cell = await this.emptyStateCellLocator();
    return (await cell?.text())?.trim() ?? null;
  }
}
