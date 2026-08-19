import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTable, for use in consumer app tests. */
export class DynamoTableHarness extends ComponentHarness {
  static hostSelector = 'dg-table';

  private readonly headerButtonLocators = this.locatorForAll('thead button');
  private readonly headerCellLocators = this.locatorForAll('thead th');
  private readonly bodyRowLocators = this.locatorForAll('tbody tr');
  private readonly bodyCellLocators = this.locatorForAll('tbody td');

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
}
