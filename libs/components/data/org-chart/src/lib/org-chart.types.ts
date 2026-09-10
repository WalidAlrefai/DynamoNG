import type { TemplateRef } from '@angular/core';

/**
 * One node in an org chart. `children` makes it recursive; a node with no
 * `children` (or an empty array) is a leaf. `id` must be unique across the
 * whole chart — it keys collapse and selection state.
 */
export interface DynamoOrgChartNode<TValue = unknown> {
  id: string;
  label: string;
  value?: TValue;
  children?: DynamoOrgChartNode<TValue>[];
}

export type DynamoOrgChartSelectionMode = 'single' | 'multiple';

/** Context object handed to the projected node `<ng-template>`. */
export interface DynamoOrgChartNodeContext<TValue = unknown> {
  $implicit: DynamoOrgChartNode<TValue>;
  node: DynamoOrgChartNode<TValue>;
}

export type DynamoOrgChartTemplateRef = TemplateRef<DynamoOrgChartNodeContext>;

export type DynamoOrgChartPart =
  | 'root'
  | 'tree'
  | 'node'
  | 'nodeContent'
  | 'toggler'
  | 'connector'
  | 'group';
