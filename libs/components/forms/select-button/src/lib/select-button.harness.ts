import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoSelectButton, for use in consumer app tests. */
export class DynamoSelectButtonHarness extends ComponentHarness {
  static hostSelector = 'dg-select-button';

  private readonly segmentLocators = this.locatorForAll('button');

  private async findSegment(label: string) {
    const segments = await this.segmentLocators();
    for (const segment of segments) {
      if ((await segment.text()).trim() === label) {
        return segment;
      }
    }
    throw new Error(`No segment found with label "${label}"`);
  }

  async clickSegment(label: string): Promise<void> {
    const segment = await this.findSegment(label);
    await segment.click();
  }

  async getSelectedLabels(): Promise<string[]> {
    const segments = await this.segmentLocators();
    const selected: string[] = [];
    for (const segment of segments) {
      const isSelected =
        (await segment.getAttribute('aria-checked')) === 'true' ||
        (await segment.getAttribute('aria-pressed')) === 'true';
      if (isSelected) {
        selected.push((await segment.text()).trim());
      }
    }
    return selected;
  }

  async isSegmentDisabled(label: string): Promise<boolean> {
    const segment = await this.findSegment(label);
    return (await segment.getProperty<boolean>('disabled')) ?? false;
  }
}
