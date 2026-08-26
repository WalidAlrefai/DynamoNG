import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoOtpInput, for use in consumer app tests. */
export class DynamoOtpInputHarness extends ComponentHarness {
  static hostSelector = 'dg-otp-input';

  private readonly boxesLocator = this.locatorForAll('input');

  async getValue(): Promise<string> {
    const boxes = await this.boxesLocator();
    const values = await Promise.all(
      boxes.map((box) => box.getProperty<string>('value')),
    );
    return values.join('');
  }

  async typeInBox(index: number, char: string): Promise<void> {
    const boxes = await this.boxesLocator();
    const box = boxes[index];
    if (!box) {
      throw new Error(`No box at index ${index}`);
    }
    await box.sendKeys(char);
  }

  async focusBox(index: number): Promise<void> {
    const boxes = await this.boxesLocator();
    const box = boxes[index];
    if (!box) {
      throw new Error(`No box at index ${index}`);
    }
    await box.focus();
  }
}
