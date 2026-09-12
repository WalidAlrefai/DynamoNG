import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSplitButton } from '@dynamong/split-button';
import { DynamoMenuItem } from '@dynamong/menu';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'label', type: 'string (required)', default: '—' },
  {
    name: 'severity / variant / size',
    type: 'same as Button',
    default: "'primary' / 'solid' / 'md'",
  },
  { name: 'disabled', type: 'boolean', default: 'false' },
  {
    name: 'position',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
  },
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'ariaLabel', type: 'string | undefined', default: "'More actions'" },
];

@Component({
  selector: 'docs-split-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoSplitButton,
    DynamoMenuItem,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Split Button"
      description="A primary action button with an attached dropdown of secondary actions."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="(action) fires for the primary button; (itemSelect) fires with the full chosen menu item ({ value, label, disabled })."
      >
        <div preview>
          <dg-split-button
            label="Save"
            (action)="lastAction.set('save')"
            (itemSelect)="lastAction.set($event.value)"
          >
            <dg-menu-item value="save-as" label="Save as..." />
            <dg-menu-item value="duplicate" label="Duplicate" />
            <dg-menu-item value="delete" label="Delete" [disabled]="true" />
          </dg-split-button>
          @if (lastAction(); as action) {
            <p class="mt-2 text-sm text-text-muted">
              Last action: <span class="font-mono">{{ action }}</span>
            </p>
          }
        </div>
        <div code>
          &lt;dg-split-button label="Save" (action)="onSave()"
          (itemSelect)="onSelect($event)"&gt; &lt;dg-menu-item value="save-as"
          label="Save as..." /&gt; &lt;/dg-split-button&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SplitButtonDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly lastAction = signal<string | null>(null);
}
