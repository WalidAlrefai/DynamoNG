import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoAvatar, for use in consumer app tests. */
export class DynamoAvatarHarness extends ComponentHarness {
  static hostSelector = 'dg-avatar';

  private readonly rootEl = this.locatorFor('span[role="img"]');

  async getAltText(): Promise<string | null> {
    return (await this.rootEl()).getAttribute('aria-label');
  }

  async isShowingImage(): Promise<boolean> {
    return (await this.locatorForOptional('img')()) !== null;
  }

  async isShowingInitials(): Promise<boolean> {
    const root = await this.rootEl();
    const text = await root.text();
    return !(await this.isShowingImage()) && text.length > 0;
  }
}
