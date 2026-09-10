import { Injectable } from '@angular/core';
import type {
  DynamoOrgChartNode,
  DynamoOrgChartTemplateRef,
} from './org-chart.types';

/**
 * Internal, DI-scoped coordination point between the recursive
 * `DynamoOrgChartItem` components and their `DynamoOrgChart` root. Provided
 * fresh per `<dg-org-chart>` (`providers: [DynamoOrgChartState]`) and injected
 * by every `DynamoOrgChartItem` at any recursion depth — Angular resolves it
 * from the nearest ancestor `DynamoOrgChart` no matter how many item levels
 * sit between.
 *
 * `DynamoOrgChart` overwrites every field in its constructor to close over
 * its own signals; the defaults below only exist so the class is
 * constructible before that wiring runs. Not exported from `index.ts`.
 */
@Injectable()
export class DynamoOrgChartState {
  template: () => DynamoOrgChartTemplateRef | null = () => null;
  collapsible: () => boolean = () => true;
  selectable: () => boolean = () => false;
  isCollapsed: (id: string) => boolean = () => false;
  isSelected: (id: string) => boolean = () => false;
  toggle: (id: string) => void = () => undefined;
  select: (node: DynamoOrgChartNode) => void = () => undefined;
}
