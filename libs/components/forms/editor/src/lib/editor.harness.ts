import { ComponentHarness, type TestElement } from '@angular/cdk/testing';
import type { DynamoEditorBlockFormat } from './editor.types';

/** Refactor-safe interaction API for DynamoEditor, for use in consumer app tests. */
export class DynamoEditorHarness extends ComponentHarness {
  static hostSelector = 'dg-editor';

  private readonly contentEl = this.locatorFor('[role="textbox"]');
  // toolbarButtons can configure any of these away — locatorForOptional
  // (not locatorFor, which throws if absent) so a harness consumer touching
  // an excluded button gets this harness's own clear error (below) instead
  // of an opaque "element not found" thrown from deep inside CDK testing.
  private readonly boldButton = this.locatorForOptional('[aria-label="Bold"]');
  private readonly italicButton = this.locatorForOptional(
    '[aria-label="Italic"]',
  );
  private readonly underlineButton = this.locatorForOptional(
    '[aria-label="Underline"]',
  );
  private readonly unorderedListButton = this.locatorForOptional(
    '[aria-label="Bulleted list"]',
  );
  private readonly orderedListButton = this.locatorForOptional(
    '[aria-label="Numbered list"]',
  );
  private readonly linkButton = this.locatorForOptional(
    '[aria-label="Insert link"]',
  );
  private readonly undoButton = this.locatorForOptional('[aria-label="Undo"]');
  private readonly redoButton = this.locatorForOptional('[aria-label="Redo"]');
  private readonly alignLeftButton = this.locatorForOptional(
    '[aria-label="Align left"]',
  );
  private readonly alignCenterButton = this.locatorForOptional(
    '[aria-label="Align center"]',
  );
  private readonly alignRightButton = this.locatorForOptional(
    '[aria-label="Align right"]',
  );
  private readonly justifyButton = this.locatorForOptional(
    '[aria-label="Justify"]',
  );
  private readonly insertImageButton = this.locatorForOptional(
    '[aria-label="Insert image"]',
  );
  private readonly headingSelect = this.locatorForOptional(
    '[aria-label="Text style"]',
  );
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
    await this.clickOrThrow(this.boldButton, 'Bold');
  }

  async clickItalic(): Promise<void> {
    await this.clickOrThrow(this.italicButton, 'Italic');
  }

  async clickUnderline(): Promise<void> {
    await this.clickOrThrow(this.underlineButton, 'Underline');
  }

  async clickUnorderedList(): Promise<void> {
    await this.clickOrThrow(this.unorderedListButton, 'Bulleted list');
  }

  async clickOrderedList(): Promise<void> {
    await this.clickOrThrow(this.orderedListButton, 'Numbered list');
  }

  async clickLink(): Promise<void> {
    await this.clickOrThrow(this.linkButton, 'Insert link');
  }

  async clickUndo(): Promise<void> {
    await this.clickOrThrow(this.undoButton, 'Undo');
  }

  async clickRedo(): Promise<void> {
    await this.clickOrThrow(this.redoButton, 'Redo');
  }

  async clickAlignLeft(): Promise<void> {
    await this.clickOrThrow(this.alignLeftButton, 'Align left');
  }

  async clickAlignCenter(): Promise<void> {
    await this.clickOrThrow(this.alignCenterButton, 'Align center');
  }

  async clickAlignRight(): Promise<void> {
    await this.clickOrThrow(this.alignRightButton, 'Align right');
  }

  async clickJustify(): Promise<void> {
    await this.clickOrThrow(this.justifyButton, 'Justify');
  }

  async clickInsertImage(): Promise<void> {
    await this.clickOrThrow(this.insertImageButton, 'Insert image');
  }

  async selectHeading(format: DynamoEditorBlockFormat): Promise<void> {
    const select = await this.headingSelect();
    if (!select) {
      throw new Error(
        '[DynamoEditorHarness] "Text style" is not present — excluded via toolbarButtons?',
      );
    }
    const optionIndex = (['p', 'h1', 'h2', 'h3'] as const).indexOf(format);
    await select.selectOptions(optionIndex);
  }

  /** Exposes the hidden file input so a test can dispatch its own `change` event. */
  async getImageInput(): Promise<TestElement> {
    return this.imageInputEl();
  }

  // Shared by every click*() method above: locatorForOptional() resolves to
  // null rather than throwing when toolbarButtons() has excluded the
  // control, so each caller fails fast with a harness-specific message
  // instead of a silent no-op or an opaque downstream null-dereference.
  private async clickOrThrow(
    locator: () => Promise<TestElement | null>,
    label: string,
  ): Promise<void> {
    const el = await locator();
    if (!el) {
      throw new Error(
        `[DynamoEditorHarness] "${label}" button is not present — excluded via toolbarButtons?`,
      );
    }
    await el.click();
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
    const bold = await this.boldButton();
    if (!bold) {
      throw new Error(
        '[DynamoEditorHarness] "Bold" button is not present — excluded via toolbarButtons?',
      );
    }
    return (await bold.getAttribute('aria-pressed')) === 'true';
  }

  async isDisabled(): Promise<boolean> {
    return (
      (await (await this.contentEl()).getAttribute('contenteditable')) !==
      'true'
    );
  }
}
