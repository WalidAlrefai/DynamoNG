import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoSplitButton } from '@dynamong/split-button';
import { DynamoMenuItem } from '@dynamong/menu';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'split-disabled', title: 'Split Disabled' },
  { id: 'fluid', title: 'Fluid' },
];

const API: ApiTableRow[] = [
  { name: 'label', type: 'string (required)', default: '—' },
  {
    name: 'severity / variant / size',
    type: 'same as Button',
    default: "'primary' / 'solid' / 'md'",
  },
  { name: 'disabled', type: 'boolean', default: 'false' },
  { name: 'buttonDisabled', type: 'boolean', default: 'false' },
  { name: 'menuButtonDisabled', type: 'boolean', default: 'false' },
  {
    name: 'position',
    type: "'bottom-start' | 'bottom-end' | 'top-start' | 'top-end'",
    default: "'bottom-start'",
  },
  { name: 'open', type: 'boolean (model)', default: 'false' },
  { name: 'ariaLabel', type: 'string | undefined', default: "'More actions'" },
  { name: 'ariaDescribedby', type: 'string | undefined', default: 'undefined' },
  { name: 'fluid', type: 'boolean', default: 'false' },
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
        description="(action) fires for the primary button; (itemSelect) fires with the full chosen menu item ({ value, label, disabled, icon? }). shortcut renders a display-only trailing hint; badge renders a small trailing dg-badge; visible: false omits an item from render AND keyboard nav entirely; separator renders a non-interactive divider row; routerLink (on an item) renders a real <a> instead of a <button>."
      >
        <div preview>
          <dg-split-button
            label="Save"
            (action)="lastAction.set('save')"
            (itemSelect)="lastAction.set($event.value)"
          >
            <dg-menu-item value="save-as" label="Save as..." shortcut="⌘S" />
            <dg-menu-item value="duplicate" label="Duplicate" />
            <dg-menu-item value="shared" label="Shared with" [badge]="3" />
            <dg-menu-item
              value="hidden"
              label="Hidden for now"
              [visible]="false"
            />
            <dg-menu-item [separator]="true" value="" label="" />
            <dg-menu-item
              value="docs"
              label="Open Badge docs"
              routerLink="/components/badge"
            />
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
          label="Save as..." shortcut="⌘S" /&gt; &lt;dg-menu-item value="shared"
          label="Shared with" [badge]="3" /&gt; &lt;/dg-split-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="split-disabled"
        title="Split Disabled"
        description="buttonDisabled and menuButtonDisabled disable each half independently — unlike disabled, which disables both."
      >
        <div preview class="flex flex-col gap-3">
          <dg-split-button
            label="Save (menu disabled)"
            [menuButtonDisabled]="true"
          >
            <dg-menu-item value="save-as" label="Save as..." />
          </dg-split-button>
          <dg-split-button
            label="Save (button disabled)"
            [buttonDisabled]="true"
          >
            <dg-menu-item value="save-as" label="Save as..." />
          </dg-split-button>
        </div>
        <div code>
          &lt;dg-split-button label="Save"
          [menuButtonDisabled]="true"&gt;...&lt;/dg-split-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="fluid"
        title="Fluid"
        description="fluid fills the width of its container — the primary action button grows to fill the extra space while the chevron trigger stays a fixed aspect-square."
      >
        <div preview class="w-full">
          <dg-split-button label="Save" [fluid]="true">
            <dg-menu-item value="save-as" label="Save as..." />
          </dg-split-button>
        </div>
        <div code>
          &lt;dg-split-button label="Save"
          [fluid]="true"&gt;...&lt;/dg-split-button&gt;
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
