import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoSwitch } from '@dynamong/switch';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';
import switchApiRows from '../generated/api/switch.json';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'readonly', title: 'Read-only' },
  { id: 'reactive-forms', title: 'Reactive Forms' },
  { id: 'accessibility', title: 'Accessibility' },
];

@Component({
  selector: 'docs-switch-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoSwitch,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Switch"
      description="A boolean on/off toggle control."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind a boolean with [(checked)]. Projected content is the label."
        [code]="basicCode"
      >
        <div preview>
          <dg-switch [(checked)]="enabled">Enable notifications</dg-switch>
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three track sizes via the size input — sm, md (default), and lg."
        [code]="sizesCode"
      >
        <div preview class="flex flex-col gap-3">
          <dg-switch size="sm">Small</dg-switch>
          <dg-switch size="md">Medium</dg-switch>
          <dg-switch size="lg">Large</dg-switch>
        </div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
        [code]="invalidCode"
      >
        <div preview>
          <dg-switch [invalid]="true">Required setting</dg-switch>
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the control out and blocks interaction."
        [code]="disabledCode"
      >
        <div preview>
          <dg-switch [disabled]="true">Disabled option</dg-switch>
        </div>
      </docs-example>

      <docs-example
        exampleId="readonly"
        title="Read-only"
        description="readOnly keeps the switch focusable but blocks toggling — unlike disabled, it doesn't dim it or remove it from the tab order."
        [code]="readonlyCode"
      >
        <div preview>
          <dg-switch [checked]="true" [readOnly]="true"
            >Read-only option</dg-switch
          >
        </div>
      </docs-example>

      <docs-example
        exampleId="reactive-forms"
        title="Reactive Forms"
        description="Implements ControlValueAccessor, so it plugs directly into formControl/ngModel."
        [code]="reactiveFormsCode"
      >
        <div preview>
          <dg-switch [formControl]="reactiveEnabled"
            >Reactive notifications</dg-switch
          >
        </div>
      </docs-example>

      <section id="accessibility" class="space-y-3">
        <h2
          class="text-sm font-semibold uppercase tracking-wide text-text-muted"
        >
          Accessibility
        </h2>
        <ul class="list-disc space-y-1 pl-5 text-sm text-text-primary">
          <li>
            Renders a native
            <code class="font-mono"
              >&lt;input type="checkbox" role="switch"&gt;</code
            >, inheriting keyboard (Space to toggle) semantics for free.
          </li>
          <li>
            <code class="font-mono">aria-checked</code> reflects the current
            state, <code class="font-mono">aria-invalid</code> is set while
            <code class="font-mono">invalid</code> is true, and
            <code class="font-mono">aria-readonly</code> while
            <code class="font-mono">readOnly</code> is true.
          </li>
          <li>
            Always pair with an accessible name — the projected label content,
            or <code class="font-mono">ariaLabel</code> when there's no visible
            one.
          </li>
          <li>
            <code class="font-mono">ariaDescribedby</code> associates an
            external help/error message's <code class="font-mono">id</code>.
          </li>
        </ul>
      </section>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SwitchDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows: ApiTableRow[] = switchApiRows;
  protected readonly enabled = signal(true);
  protected readonly reactiveEnabled = new FormControl(false, {
    nonNullable: true,
  });

  protected readonly basicCode = `<dg-switch [(checked)]="enabled">Enable notifications</dg-switch>`;
  protected readonly sizesCode = `<dg-switch size="sm">Small</dg-switch>
<dg-switch size="md">Medium</dg-switch>
<dg-switch size="lg">Large</dg-switch>`;
  protected readonly invalidCode = `<dg-switch [invalid]="true">Required setting</dg-switch>`;
  protected readonly disabledCode = `<dg-switch [disabled]="true">Disabled option</dg-switch>`;
  protected readonly readonlyCode = `<dg-switch [checked]="true" [readOnly]="true">Read-only option</dg-switch>`;
  protected readonly reactiveFormsCode = `<dg-switch [formControl]="enabled">Reactive notifications</dg-switch>`;
}
