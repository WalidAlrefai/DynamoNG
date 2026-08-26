import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoFileUpload, for use in consumer app tests. */
export class DynamoFileUploadHarness extends ComponentHarness {
  static hostSelector = 'dg-file-upload';

  private readonly dropzoneLocator = this.locatorFor('[role="button"]');
  private readonly fileNameLocator = this.locatorForAll('li span:first-of-type');
  private readonly removeButtonLocator = this.locatorForAll('li button');

  async openFileBrowser(): Promise<void> {
    await (await this.dropzoneLocator()).click();
  }

  async isDisabled(): Promise<boolean> {
    const value = await (
      await this.dropzoneLocator()
    ).getAttribute('aria-disabled');
    return value === 'true';
  }

  async getSelectedFileNames(): Promise<string[]> {
    const spans = await this.fileNameLocator();
    return Promise.all(spans.map((span) => span.text()));
  }

  async removeFileByName(name: string): Promise<void> {
    const buttons = await this.removeButtonLocator();
    for (const button of buttons) {
      if ((await button.getAttribute('aria-label')) === `Remove ${name}`) {
        await button.click();
        return;
      }
    }
    throw new Error(`No file item found with name "${name}"`);
  }
}
