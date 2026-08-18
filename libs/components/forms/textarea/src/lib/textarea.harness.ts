import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTextarea, for use in consumer app tests. */
export class DynamoTextareaHarness extends ComponentHarness {
  static hostSelector = 'dg-textarea';

  private readonly textareaEl = this.locatorFor('textarea');

  async setValue(value: string): Promise<void> {
    const textarea = await this.textareaEl();
    await textarea.clear();
    await textarea.sendKeys(value);
  }

  async getValue(): Promise<string> {
    const textarea = await this.textareaEl();
    return (await textarea.getProperty<string>('value')) ?? '';
  }

  async isDisabled(): Promise<boolean> {
    const textarea = await this.textareaEl();
    return (await textarea.getProperty<boolean>('disabled')) ?? false;
  }

  async blur(): Promise<void> {
    const textarea = await this.textareaEl();
    await textarea.blur();
  }
}
