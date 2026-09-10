import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSpeedDial } from '@dynamong/speed-dial';
import type {
  DynamoSpeedDialAction,
  DynamoSpeedDialType,
} from '@dynamong/speed-dial';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const ACTIONS: DynamoSpeedDialAction[] = [
  { label: 'Add', icon: '+' },
  { label: 'Edit', icon: '✎' },
  { label: 'Share', icon: '↗' },
  { label: 'Delete', icon: '🗑' },
];

const EXAMPLES: DocExampleRef[] = [
  { id: 'linear', title: 'Linear' },
  { id: 'arc', title: 'Arc' },
];

const API: ApiTableRow[] = [
  { name: 'actions', type: 'DynamoSpeedDialAction[] (required)', default: '—' },
  {
    name: 'direction',
    type: "'up' | 'down' | 'left' | 'right'",
    default: "'up'",
  },
  {
    name: 'type',
    type: "'linear' | 'circle' | 'semi-circle' | 'quarter-circle'",
    default: "'linear'",
  },
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'openOnHover', type: 'boolean', default: 'false' },
  { name: 'radius', type: 'number', default: '90' },
  {
    name: 'actionSelect',
    type: 'output<DynamoSpeedDialAction>',
    default: '—',
  },
];

@Component({
  selector: 'docs-speed-dial-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSpeedDial, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="SpeedDial"
      description="A floating action button that fans out action items along a line or around an arc, with roving-focus keyboard support."
      [examples]="examples"
    >
      <docs-example
        exampleId="linear"
        title="Linear"
        description="type=&quot;linear&quot; fans the actions out in a straight line along direction."
      >
        <div preview class="flex min-h-[14rem] items-end p-8">
          <dg-speed-dial [actions]="actions" type="linear" direction="up" />
        </div>
        <div code>
          &lt;dg-speed-dial [actions]="actions" type="linear" direction="up" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="arc"
        title="Arc"
        description="circle / semi-circle / quarter-circle arrange the actions around an arc of the given radius."
      >
        <div preview class="flex min-h-[16rem] items-end p-8">
          <dg-speed-dial
            [actions]="actions"
            [type]="arcType()"
            direction="up"
            [radius]="100"
          />
        </div>
        <div code>
          &lt;dg-speed-dial [actions]="actions" type="quarter-circle"
          [radius]="100" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SpeedDialDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly actions = ACTIONS;
  protected readonly arcType = signal<DynamoSpeedDialType>('quarter-circle');
}
