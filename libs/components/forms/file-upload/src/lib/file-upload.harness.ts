import { ComponentHarness } from '@angular/cdk/testing';
import type { DynamoFileUploadStatus } from './file-upload.types';

/** Refactor-safe interaction API for DynamoFileUpload, for use in consumer app tests. */
export class DynamoFileUploadHarness extends ComponentHarness {
  static hostSelector = 'dg-file-upload';

  private readonly dropzoneLocator = this.locatorFor('[role="button"]');
  // The value-carrying `data-file` marker (not visible text) is the lookup
  // key for every per-file query below — robust regardless of how the
  // name/size/status markup inside is nested or reordered.
  private readonly fileNameLocator = this.locatorForAll('li [data-file]');
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
    const wrappers = await this.fileNameLocator();
    return Promise.all(
      wrappers.map(async (el) => (await el.getAttribute('data-file')) ?? ''),
    );
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

  /** 0-100, or `null` when that file isn't currently `'uploading'` (or doesn't exist). */
  async getProgress(name: string): Promise<number | null> {
    const fill = await this.locatorForOptional(
      `li [data-file="${name}"] [data-progress]`,
    )();
    const value = await fill?.getAttribute('data-progress');
    return value == null ? null : Number(value);
  }

  /** `null` when `fileStatus` has no entry for this file. */
  async getStatus(name: string): Promise<DynamoFileUploadStatus | null> {
    if (
      await this.locatorForOptional(`li [data-file="${name}"] [data-success]`)()
    ) {
      return 'success';
    }
    if (
      await this.locatorForOptional(
        `li [data-file="${name}"] [data-progress]`,
      )()
    ) {
      return 'uploading';
    }
    if (
      await this.locatorForOptional(`li [data-file="${name}"] [data-error]`)()
    ) {
      return 'error';
    }
    return null;
  }

  /** The error message text, or `null` when that file isn't currently `'error'` (or doesn't exist). */
  async getErrorText(name: string): Promise<string | null> {
    const el = await this.locatorForOptional(
      `li [data-file="${name}"] [data-error]`,
    )();
    return (await el?.text()) ?? null;
  }
}
