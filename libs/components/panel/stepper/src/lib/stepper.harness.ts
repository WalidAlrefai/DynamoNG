import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for DynamoStepper, for use in consumer app tests. */
export class DynamoStepperHarness extends ComponentHarness {
  static hostSelector = 'dg-stepper';

  private readonly stepButtonLocators = this.locatorForAll('nav button');
  private readonly controlButtonLocators = this.locatorForAll(
    '[data-testid="stepper-controls"] button',
  );

  private readonly activeStepLabelLocator = this.locatorForOptional(
    'nav button[aria-current="step"] [data-testid="step-label"]',
  );

  async getActiveStepLabel(): Promise<string | null> {
    const label = await this.activeStepLabelLocator();
    return label ? (await label.text()).trim() : null;
  }

  async clickStep(index: number): Promise<void> {
    const buttons = await this.stepButtonLocators();
    await buttons[index]?.click();
  }

  async clickNext(): Promise<void> {
    const buttons = await this.controlButtonLocators();
    await buttons[1]?.click();
  }

  async clickBack(): Promise<void> {
    const buttons = await this.controlButtonLocators();
    await buttons[0]?.click();
  }
}
