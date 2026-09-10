import { ComponentHarness } from '@angular/cdk/testing';

/** Refactor-safe interaction API for MeterGroup, for use in consumer app tests. */
export class DynamoMeterGroupHarness extends ComponentHarness {
  static hostSelector = 'dg-meter-group';
}
