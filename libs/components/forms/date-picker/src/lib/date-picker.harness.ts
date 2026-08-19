import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoDatePicker, for use in consumer app tests. */
export class DynamoDatePickerHarness extends ComponentHarness {
  static hostSelector = 'dg-date-picker';

  private readonly triggerLocator = this.locatorFor(
    'button[aria-haspopup="dialog"]',
  );
  // The calendar panel is portaled outside dg-date-picker's own host subtree
  // by CDK Overlay, so it must be located from the document root, same
  // technique as DynamoMenuHarness/DynamoTooltipHarness.
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
   * Matches on day-of-month text within the currently-open grid. With
   * leading/trailing days from adjacent months rendered, a low day number
   * (e.g. "1") can appear more than once — this returns the first enabled
   * match. Pick an unambiguous mid-month day (e.g. "15") in tests where
   * that matters.
   */
  async selectDayByLabel(dayOfMonth: string): Promise<void> {
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
