import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoTooltip, for use in consumer app tests. */
export class DynamoTooltipHarness extends ComponentHarness {
  static hostSelector = 'dg-tooltip';

  // `mouseenter`/`mouseleave` don't bubble, and the component's own listeners
  // are on its internal trigger `<span>` (not the `dg-tooltip` host element
  // `host()` resolves to), so interactions must target that span directly.
  private readonly triggerLocator = this.locatorFor('span');

  async show(): Promise<void> {
    const trigger = await this.triggerLocator();
    await trigger.hover();
  }

  async hide(): Promise<void> {
    const trigger = await this.triggerLocator();
    await trigger.mouseAway();
  }

  async isVisible(): Promise<boolean> {
    return (await this.getPanel()) !== null;
  }

  async getPanelText(): Promise<string | null> {
    const panel = await this.getPanel();
    return panel ? (await panel.text()).trim() : null;
  }

  // The panel is portaled into a `.cdk-overlay-container` appended near
  // document.body — outside this harness's own host subtree — so the
  // host-scoped `locatorFor` can't reach it. `documentRootLocatorFactory()` is
  // CDK's documented mechanism for exactly this case.
  private getPanel() {
    return this.documentRootLocatorFactory().locatorForOptional(
      '[role="tooltip"]',
    )();
  }
}
