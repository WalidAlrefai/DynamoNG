import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoToggleButton } from '@dynamong/toggle-button';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'severity', title: 'Severity' },
  { id: 'reactive-forms', title: 'Reactive Forms' },
];

const API: ApiTableRow[] = [
  { name: 'pressed', type: 'boolean (model)', default: 'false' },
  { name: 'severity', type: 'DynamoSeverity', default: "'primary'" },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'ariaLabel', type: 'string', default: '—' },
];

@Component({
  selector: 'docs-toggle-button-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoToggleButton,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Toggle Button"
      description="A single pressable button with a pressed/unpressed visual state."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Two-way bind the pressed state with [(pressed)]."
      >
        <div preview class="flex flex-wrap items-center gap-2">
          <dg-toggle-button [(pressed)]="bold">Bold</dg-toggle-button>
          <dg-toggle-button [(pressed)]="italic">Italic</dg-toggle-button>
          <dg-toggle-button [disabled]="true">Disabled</dg-toggle-button>
        </div>
        <div code>
          &lt;dg-toggle-button
          [(pressed)]="bold"&gt;Bold&lt;/dg-toggle-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="severity"
        title="Severity"
        description="severity recolors the pressed state."
      >
        <div preview>
          <dg-toggle-button severity="danger" [(pressed)]="muted">
            Mute
          </dg-toggle-button>
        </div>
        <div code>
          &lt;dg-toggle-button severity="danger"
          [(pressed)]="muted"&gt;Mute&lt;/dg-toggle-button&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="reactive-forms"
        title="Reactive Forms"
        description="Implements ControlValueAccessor, so it plugs directly into formControl/ngModel."
        [code]="reactiveFormsCode"
      >
        <div preview>
          <dg-toggle-button [formControl]="subscribed" ariaLabel="Subscribe">
            Subscribed
          </dg-toggle-button>
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ToggleButtonDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly bold = signal(false);
  protected readonly italic = signal(false);
  protected readonly muted = signal(false);
  protected readonly subscribed = new FormControl(false, {
    nonNullable: true,
  });

  protected readonly reactiveFormsCode = `<dg-toggle-button [formControl]="subscribed" ariaLabel="Subscribe">Subscribed</dg-toggle-button>`;
}
