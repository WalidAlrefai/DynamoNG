import { ComponentHarness } from '@angular/cdk/testing';

type OrderListButton = 'up' | 'down' | 'top' | 'bottom';

/** Refactor-safe interaction API for DynamoOrderList, for use in consumer app tests. */
export class DynamoOrderListHarness extends ComponentHarness {
  static hostSelector = 'dg-order-list';

  private readonly options = this.locatorForAll('[role="option"]');
  private readonly buttons = this.locatorForAll(
    '[data-part="controls"] button',
  );
  private readonly list = this.locatorFor('[role="listbox"]');
  private readonly filterInput = this.locatorForOptional(
    'input[type="search"]',
  );
  private readonly noResultsEl = this.locatorForOptional('[role="status"]');

  async getItemLabels(): Promise<string[]> {
    const options = await this.options();
    return Promise.all(options.map(async (o) => (await o.text()).trim()));
  }

  /** Index of the row currently `aria-selected="true"`, or -1. */
  async getActiveIndex(): Promise<number> {
    const options = await this.options();
    for (let i = 0; i < options.length; i++) {
      const option = options[i];
      if (option && (await option.getAttribute('aria-selected')) === 'true') {
        return i;
      }
    }
    return -1;
  }

  async clickRow(label: string): Promise<void> {
    const options = await this.options();
    for (const option of options) {
      if ((await option.text()).trim() === label) {
        await option.click();
        return;
      }
    }
    throw new Error(`No row "${label}" found`);
  }

  async clickButton(which: OrderListButton): Promise<void> {
    const buttons = await this.buttons();
    // Button order in the template: [top?] up down [bottom?]. Match by
    // aria-label keyword so it works whether or not the top/bottom pair is shown.
    const keyword = {
      up: 'Move up',
      down: 'Move down',
      top: 'Move to top',
      bottom: 'Move to bottom',
    }[which];
    for (const button of buttons) {
      if ((await button.getAttribute('aria-label'))?.startsWith(keyword)) {
        await button.click();
        return;
      }
    }
    throw new Error(`No "${which}" control button found`);
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.list()).getAttribute('tabindex')) === '-1';
  }

  /** Throws if `filterable` is off (no box rendered). */
  async setFilterText(text: string): Promise<void> {
    const input = await this.filterInput();
    if (!input) {
      throw new Error('No filter box found — is `filterable` set?');
    }
    await input.clear();
    if (text) {
      await input.sendKeys(text);
    }
  }

  async getFilterText(): Promise<string> {
    const input = await this.filterInput();
    return input ? ((await input.getProperty<string>('value')) ?? '') : '';
  }

  /** True when the filter matched nothing and the no-results message is showing. */
  async hasNoResults(): Promise<boolean> {
    return (await this.noResultsEl()) !== null;
  }

  /** True when the drop list is CDK-disabled (filtering active, virtualized, disabled, readOnly, or dragdrop=false). */
  async isDragDisabled(): Promise<boolean> {
    const classes = await (await this.list()).getAttribute('class');
    return (classes ?? '').includes('cdk-drop-list-disabled');
  }
}
