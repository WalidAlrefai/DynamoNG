import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTabs, for use in consumer app tests. */
export class DynamoTabsHarness extends ComponentHarness {
  static hostSelector = 'dg-tabs';

  private readonly tabLocators = this.locatorForAll('[role="tab"]');
  private readonly panelLocator = this.locatorForOptional(
    '[role="tabpanel"]:not([hidden])',
  );

  async selectTabByLabel(label: string): Promise<void> {
    const tabs = await this.tabLocators();
    for (const tab of tabs) {
      if ((await tab.text()).trim() === label) {
        await tab.click();
        return;
      }
    }
    throw new Error(`No tab with label "${label}" found`);
  }

  async getActiveTabLabel(): Promise<string | null> {
    const tabs = await this.tabLocators();
    for (const tab of tabs) {
      if ((await tab.getAttribute('aria-selected')) === 'true') {
        return (await tab.text()).trim();
      }
    }
    return null;
  }

  async getVisiblePanelText(): Promise<string | null> {
    const panel = await this.panelLocator();
    return panel ? (await panel.text()).trim() : null;
  }
}
