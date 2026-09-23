import { ComponentHarness, type TestElement } from '@angular/cdk/testing';
import type { DynamoEditorBlockFormat } from './editor.types';

/** Refactor-safe interaction API for DynamoEditor, for use in consumer app tests. */
export class DynamoEditorHarness extends ComponentHarness {
  static hostSelector = 'dg-editor';

  private readonly contentEl = this.locatorFor('[role="textbox"]');
  private readonly boldButton = this.locatorFor('[aria-label="Bold"]');
  private readonly italicButton = this.locatorFor('[aria-label="Italic"]');
  private readonly underlineButton = this.locatorFor(
    '[aria-label="Underline"]',
  );
  private readonly unorderedListButton = this.locatorFor(
    '[aria-label="Bulleted list"]',
  );
  private readonly orderedListButton = this.locatorFor(
    '[aria-label="Numbered list"]',
  );
  private readonly linkButton = this.locatorFor('[aria-label="Insert link"]');
  private readonly undoButton = this.locatorFor('[aria-label="Undo"]');
  private readonly redoButton = this.locatorFor('[aria-label="Redo"]');
  private readonly alignLeftButton = this.locatorFor(
    '[aria-label="Align left"]',
  );
  private readonly alignCenterButton = this.locatorFor(
    '[aria-label="Align center"]',
  );
  private readonly alignRightButton = this.locatorFor(
    '[aria-label="Align right"]',
  );
  private readonly justifyButton = this.locatorFor('[aria-label="Justify"]');
  private readonly insertImageButton = this.locatorFor(
    '[aria-label="Insert image"]',
  );
  private readonly headingSelect = this.locatorFor('[aria-label="Text style"]');
  private readonly imageInputEl = this.locatorFor('input[type="file"]');
  private readonly overflowTrigger = this.locatorForOptional(
    '[aria-label="More formatting options"]',
  );

  async getHtml(): Promise<string> {
    return (
      (await (await this.contentEl()).getProperty<string>('innerHTML')) ?? ''
    );
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

  async clickUndo(): Promise<void> {
    await (await this.undoButton()).click();
  }

  async clickRedo(): Promise<void> {
    await (await this.redoButton()).click();
  }

  async clickAlignLeft(): Promise<void> {
    await (await this.alignLeftButton()).click();
  }

  async clickAlignCenter(): Promise<void> {
    await (await this.alignCenterButton()).click();
  }

  async clickAlignRight(): Promise<void> {
    await (await this.alignRightButton()).click();
  }

  async clickJustify(): Promise<void> {
    await (await this.justifyButton()).click();
  }

  async clickInsertImage(): Promise<void> {
    await (await this.insertImageButton()).click();
  }

  async selectHeading(format: DynamoEditorBlockFormat): Promise<void> {
    const optionIndex = (['p', 'h1', 'h2', 'h3'] as const).indexOf(format);
    await (await this.headingSelect()).selectOptions(optionIndex);
  }

  /** Exposes the hidden file input so a test can dispatch its own `change` event. */
  async getImageInput(): Promise<TestElement> {
    return this.imageInputEl();
  }

  /** Whether the toolbar is currently narrow enough to show a "⋯" trigger. */
  async hasOverflowTrigger(): Promise<boolean> {
    return (await this.overflowTrigger()) !== null;
  }

  async openOverflow(): Promise<void> {
    const trigger = await this.overflowTrigger();
    await trigger?.click();
  }

  async isBoldActive(): Promise<boolean> {
    return (
      (await (await this.boldButton()).getAttribute('aria-pressed')) === 'true'
    );
  }

  async isDisabled(): Promise<boolean> {
    return (
      (await (await this.contentEl()).getAttribute('contenteditable')) !==
      'true'
    );
  }
}
