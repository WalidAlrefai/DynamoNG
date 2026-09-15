import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoDateRangePicker, for use in consumer app tests. */
export class DynamoDateRangePickerHarness extends ComponentHarness {
  static hostSelector = 'dg-date-range-picker';

  private readonly triggerLocator = this.locatorFor(
    'button[aria-haspopup="dialog"]',
  );
  // The calendar panel is portaled outside dg-date-range-picker's own host
  // subtree by CDK Overlay, so it must be located from the document root —
  // same technique as DynamoDatePickerHarness.
  private readonly dialogLocator =
    this.documentRootLocatorFactory().locatorForOptional('[role="dialog"]');
  private readonly dayButtonLocators =
    this.documentRootLocatorFactory().locatorForAll(
      'table[role="grid"] button',
    );

  async open(): Promise<void> {
    if (await this.isOpen()) return;
    await (await this.triggerLocator()).click();
  }

  async getTriggerText(): Promise<string> {
    return (await this.triggerLocator()).text();
  }

  async isOpen(): Promise<boolean> {
    return (await this.dialogLocator()) !== null;
  }

  /**
   * Clicks a start day, then an end day, by day-of-month text. Same
   * ambiguity caveat as `DynamoDatePickerHarness.selectDayByLabel`: pick
   * unambiguous mid-month days when adjacent-month leading/trailing days
   * could repeat a low day number.
   */
  async selectRangeByLabel(
    startDayOfMonth: string,
    endDayOfMonth: string,
  ): Promise<void> {
    await this.clickDayByLabel(startDayOfMonth);
    await this.clickDayByLabel(endDayOfMonth);
  }

  private async clickDayByLabel(dayOfMonth: string): Promise<void> {
    await this.open();
    for (const day of await this.dayButtonLocators()) {
      if (
        (await day.text()).trim() === dayOfMonth &&
        !(await day.getAttribute('disabled'))
      ) {
        await day.click();
        return;
      }
    }
    throw new Error(`No enabled day button with text "${dayOfMonth}" found`);
  }
}
