import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoAccordion, for use in consumer app tests. */
export class DynamoAccordionHarness extends ComponentHarness {
  static hostSelector = 'dg-accordion';

  private readonly headerLocators = this.locatorForAll('button[aria-expanded]');

  async togglePanelByHeader(header: string): Promise<void> {
    const headers = await this.headerLocators();
    for (const button of headers) {
      if ((await button.text()).trim() === header) {
        await button.click();
        return;
      }
    }
    throw new Error(`No accordion header "${header}" found`);
  }

  async isPanelExpanded(header: string): Promise<boolean> {
    const headers = await this.headerLocators();
    for (const button of headers) {
      if ((await button.text()).trim() === header) {
        return (await button.getAttribute('aria-expanded')) === 'true';
      }
    }
    throw new Error(`No accordion header "${header}" found`);
  }

  async getExpandedHeaders(): Promise<string[]> {
    const headers = await this.headerLocators();
    const expanded: string[] = [];
    for (const button of headers) {
      if ((await button.getAttribute('aria-expanded')) === 'true') {
        expanded.push((await button.text()).trim());
      }
    }
    return expanded;
  }

  async getPanelText(header: string): Promise<string | null> {
    const headers = await this.headerLocators();
    for (const button of headers) {
      if ((await button.text()).trim() === header) {
        const controls = await button.getAttribute('aria-controls');
        if (!controls) {
          return null;
        }
        const region = await this.locatorForOptional(`#${controls}`)();
        return region ? (await region.text()).trim() : null;
      }
    }
    throw new Error(`No accordion header "${header}" found`);
  }
}
