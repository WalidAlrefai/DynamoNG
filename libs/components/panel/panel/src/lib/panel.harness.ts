import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoPanel, for use in consumer app tests. */
export class DynamoPanelHarness extends ComponentHarness {
  static hostSelector = 'dg-panel';

  private readonly headerLocator = this.locatorFor('[data-testid="dg-panel-header"]');
  private readonly toggleButtonLocator = this.locatorForOptional('button[aria-expanded]');
  private readonly regionLocator = this.locatorFor('[role="region"]');

  async getHeaderText(): Promise<string> {
    return (await (await this.headerLocator()).text()).trim();
  }

  async isCollapsed(): Promise<boolean> {
    const button = await this.toggleButtonLocator();
    if (!button) {
      return false;
    }
    return (await button.getAttribute('aria-expanded')) === 'false';
  }

  async toggle(): Promise<void> {
    await (await this.toggleButtonLocator())?.click();
  }

  async getRegionText(): Promise<string> {
    return (await (await this.regionLocator()).text()).trim();
  }
}
