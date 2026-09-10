import { ComponentHarness } from '@angular/cdk/testing';

type OrderListButton = 'up' | 'down' | 'top' | 'bottom';

/** Refactor-safe interaction API for DynamoOrderList, for use in consumer app tests. */
export class DynamoOrderListHarness extends ComponentHarness {
  static hostSelector = 'dg-order-list';

  private readonly options = this.locatorForAll('[role="option"]');
  private readonly buttons = this.locatorForAll('[data-part="controls"] button');
  private readonly list = this.locatorFor('[role="listbox"]');

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
}
