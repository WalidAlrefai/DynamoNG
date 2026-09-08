import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoEditor, for use in consumer app tests. */
export class DynamoEditorHarness extends ComponentHarness {
  static hostSelector = 'dg-editor';

  private readonly contentEl = this.locatorFor('[role="textbox"]');
  private readonly boldButton = this.locatorFor('[aria-label="Bold"]');
  private readonly italicButton = this.locatorFor('[aria-label="Italic"]');
  private readonly underlineButton = this.locatorFor('[aria-label="Underline"]');
  private readonly unorderedListButton = this.locatorFor('[aria-label="Bulleted list"]');
  private readonly orderedListButton = this.locatorFor('[aria-label="Numbered list"]');
  private readonly linkButton = this.locatorFor('[aria-label="Insert link"]');

  async getHtml(): Promise<string> {
    return (await (await this.contentEl()).getProperty<string>('innerHTML')) ?? '';
  }

  async clickBold(): Promise<void> {
    await (await this.boldButton()).click();
  }

  async clickItalic(): Promise<void> {
    await (await this.italicButton()).click();
  }

  async clickUnderline(): Promise<void> {
    await (await this.underlineButton()).click();
  }

  async clickUnorderedList(): Promise<void> {
    await (await this.unorderedListButton()).click();
  }

  async clickOrderedList(): Promise<void> {
    await (await this.orderedListButton()).click();
  }

  async clickLink(): Promise<void> {
    await (await this.linkButton()).click();
  }

  async isBoldActive(): Promise<boolean> {
    return (await (await this.boldButton()).getAttribute('aria-pressed')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (await (await this.contentEl()).getAttribute('contenteditable')) !== 'true';
  }
}
