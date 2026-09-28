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

  private async readSpinbuttonValue(label: string): Promise<number | null> {
    const field = await this.documentRootLocatorFactory().locatorForOptional(
      `[role="spinbutton"][aria-label="${label}"]`,
    )();
    const raw = await field?.getAttribute('aria-valuenow');
    return raw === undefined || raw === null ? null : Number(raw);
  }

  /** Reads the current hour/minute/second spinbuttons — `null` if `showTime` isn't rendering them (panel closed, or `showTime` off). `seconds` is `null` unless `showSeconds` is also on. */
  async getTimeValue(): Promise<{
    hours: number;
    minutes: number;
    seconds: number | null;
  } | null> {
    const hours = await this.readSpinbuttonValue('Hour');
    const minutes = await this.readSpinbuttonValue('Minute');
    if (hours === null || minutes === null) return null;
    const seconds = await this.readSpinbuttonValue('Second');
    return { hours, minutes, seconds };
  }

  /** Clicks the increment/decrement button for the given time field. Throws if `showTime` isn't rendering it. */
  async stepTime(
    field: 'hour' | 'minute' | 'second',
    direction: 'up' | 'down',
  ): Promise<void> {
    const verb = direction === 'up' ? 'Increment' : 'Decrement';
    const ariaLabel = `${verb} ${field}`;
    const button = await this.documentRootLocatorFactory().locatorForOptional(
      `[aria-label="${ariaLabel}"]`,
    )();
    if (!button) {
      throw new Error(
        `No "${ariaLabel}" button found — is \`showTime\` set (and \`showSeconds\` if stepping seconds)?`,
      );
    }
    await button.click();
  }
}
