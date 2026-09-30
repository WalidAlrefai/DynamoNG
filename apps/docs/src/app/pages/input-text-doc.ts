import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  DynamoInputText,
  DynamoInputTextDirective,
} from '@dynamong/input-text';
import { DynamoFloatLabel, DynamoIftaLabel } from '@dynamong/float-label';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'clear-icon', title: 'Clear Icon' },
  { id: 'sizes', title: 'Sizes' },
  { id: 'filled', title: 'Filled' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'float-label', title: 'Float Label' },
  { id: 'ifta-label', title: 'Ifta Label' },
  { id: 'fluid', title: 'Fluid' },
  { id: 'help-text', title: 'Help Text' },
  { id: 'forms', title: 'Reactive Forms' },
  { id: 'accessibility', title: 'Accessibility' },
];

const API: ApiTableRow[] = [
  {
    name: 'type',
    type: "'text' | 'email' | 'password' | 'search' | 'tel' | 'url'",
    default: "'text'",
  },
  { name: 'size', type: "'sm' | 'md' | 'lg'", default: "'md'" },
  {
    name: 'variant',
    type: "'outlined' | 'filled'",
    default: "'outlined'",
  },
  { name: 'placeholder', type: 'string', default: "''" },
  { name: 'invalid', type: 'boolean', default: 'false' },
  { name: 'ariaLabel', type: 'string | undefined', default: 'undefined' },
  {
    name: 'ariaDescribedby',
    type: 'string | undefined',
    default: 'undefined',
  },
  { name: 'disabled', type: 'boolean (model)', default: 'false' },
  { name: 'readOnly', type: 'boolean', default: 'false' },
  { name: 'fluid', type: 'boolean', default: 'true' },
  { name: 'showClear', type: 'boolean', default: 'false' },
  { name: 'clearAriaLabel', type: 'string', default: "'Clear'" },
  { name: 'value', type: 'string (model)', default: "''" },
];

@Component({
  selector: 'docs-input-text-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoInputText,
    DynamoInputTextDirective,
    DynamoFloatLabel,
    DynamoIftaLabel,
    FormsModule,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Input Text"
      description="A single-line text input with full Angular Forms (ControlValueAccessor) integration."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Bind with ngModel or a FormControl; pass an ariaLabel when there's no visible <label>."
        [code]="basicCode"
      >
        <div preview class="max-w-sm">
          <dg-input-text
            [(ngModel)]="name"
            placeholder="Ada Lovelace"
            ariaLabel="Name"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="clear-icon"
        title="Clear Icon"
        description="showClear renders a clear button once there's a value; hidden while disabled or readOnly."
        [code]="clearIconCode"
      >
        <div preview class="max-w-sm">
          <dg-input-text
            [(ngModel)]="clearDemo"
            [showClear]="true"
            placeholder="Type to see the clear button"
            ariaLabel="Search"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="sizes"
        title="Sizes"
        description="Three heights via the size input."
      >
        <div preview class="flex flex-col gap-2 max-w-sm">
          <dg-input-text size="sm" placeholder="Small" ariaLabel="Small" />
          <dg-input-text size="md" placeholder="Medium" ariaLabel="Medium" />
          <dg-input-text size="lg" placeholder="Large" ariaLabel="Large" />
        </div>
        <div code>
          &lt;dg-input-text size="sm" /&gt; &lt;dg-input-text size="lg" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="filled"
        title="Filled"
        description='variant "filled" swaps the outlined look for a filled surface background.'
      >
        <div preview class="max-w-sm">
          <dg-input-text
            variant="filled"
            placeholder="Filled"
            ariaLabel="Filled example"
          />
        </div>
        <div code>&lt;dg-input-text variant="filled" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
        [code]="invalidCode"
      >
        <div preview class="max-w-sm">
          <dg-input-text
            placeholder="Invalid state"
            [invalid]="true"
            ariaLabel="Invalid example"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="disabled greys the field out and blocks input."
        [code]="disabledCode"
      >
        <div preview class="max-w-sm">
          <dg-input-text
            placeholder="Disabled"
            [disabled]="true"
            ariaLabel="Disabled example"
          />
        </div>
      </docs-example>

      <docs-example
        exampleId="float-label"
        title="Float Label"
        description="Compose with @dynamong/float-label's dg-float-label to float the label on focus/fill. See the Float Label page for every variant."
      >
        <div preview class="max-w-xs">
          <dg-float-label label="Email" variant="over">
            <dg-input-text
              [(ngModel)]="floatEmail"
              placeholder=" "
              ariaLabel="Email"
            />
          </dg-float-label>
        </div>
        <div code>
          &lt;dg-float-label label="Email"&gt; &lt;dg-input-text placeholder=" "
          /&gt; &lt;/dg-float-label&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="ifta-label"
        title="Ifta Label"
        description="Compose with dg-ifta-label for an always-visible, in-the-field label. See the Float Label page for details."
      >
        <div preview class="max-w-xs">
          <dg-ifta-label label="Phone">
            <dg-input-text
              [(ngModel)]="iftaPhone"
              placeholder=" "
              ariaLabel="Phone"
            />
          </dg-ifta-label>
        </div>
        <div code>
          &lt;dg-ifta-label label="Phone"&gt; &lt;dg-input-text placeholder=" "
          /&gt; &lt;/dg-ifta-label&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="fluid"
        title="Fluid"
        description="fluid defaults true (fills its container); set false for intrinsic, content-driven width."
      >
        <div
          preview
          class="flex flex-col gap-3 max-w-sm rounded-lg border border-border p-4"
        >
          <div>
            <p class="mb-1 text-xs text-text-muted">fluid (default)</p>
            <dg-input-text placeholder="Fills container" ariaLabel="Fluid" />
          </div>
          <div>
            <p class="mb-1 text-xs text-text-muted">[fluid]="false"</p>
            <dg-input-text
              [fluid]="false"
              placeholder="Intrinsic"
              ariaLabel="Not fluid"
            />
          </div>
        </div>
        <div code>&lt;dg-input-text [fluid]="false" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="help-text"
        title="Help Text"
        description="No dedicated helpText input — pair a plain element with ariaDescribedby so assistive tech announces it."
      >
        <div preview class="max-w-sm">
          <dg-input-text
            [(ngModel)]="helpValue"
            ariaLabel="Username"
            ariaDescribedby="username-help"
            placeholder="Username"
          />
          <p id="username-help" class="mt-1 text-xs text-text-muted">
            Must be 3-20 characters, letters and numbers only.
          </p>
        </div>
        <div code>
          &lt;dg-input-text ariaDescribedby="username-help" /&gt; &lt;p
          id="username-help"&gt;Must be 3-20 characters&lt;/p&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="forms"
        title="Reactive Forms"
        description="InputText is a ControlValueAccessor — bind a FormControl directly. Disabled state follows the control."
        [code]="formsCode"
      >
        <div preview class="max-w-sm space-y-2">
          <dg-input-text
            [formControl]="emailControl"
            ariaLabel="Email"
            placeholder="you@example.com"
          />
          <p class="text-sm text-text-muted">
            value:
            <span class="font-mono">{{ emailControl.value || "''" }}</span> ·
            dirty: <span class="font-mono">{{ emailControl.dirty }}</span>
          </p>
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
            Renders a native <code class="font-mono">&lt;input&gt;</code>,
            inheriting its keyboard and text-editing semantics for free.
          </li>
          <li>
            <code class="font-mono">aria-invalid</code> is set while
            <code class="font-mono">invalid</code> is true,
            <code class="font-mono">aria-readonly</code> while
            <code class="font-mono">readOnly</code> is true.
          </li>
          <li>
            Always pair with an accessible name — a visible
            <code class="font-mono">&lt;label&gt;</code>, or
            <code class="font-mono">ariaLabel</code> when there's no visible one
            (e.g. a bare search box).
          </li>
          <li>
            <code class="font-mono">ariaDescribedby</code> associates an
            external help/error message's <code class="font-mono">id</code>
            — see the Help Text example above.
          </li>
        </ul>

        <p class="text-sm text-text-muted">
          Already own the
          <code class="font-mono">&lt;input&gt;</code> element — a form built
          with strict layout selectors, or migrating existing markup? Use the
          <code class="font-mono">dgInputText</code> directive instead of
          <code class="font-mono">&lt;dg-input-text&gt;</code> — it applies the
          exact same classes directly to an element you already own, with no
          <code class="font-mono">&lt;dg-input-text&gt;</code> host tag around
          it.
        </p>
        <div class="max-w-sm rounded-lg border border-border p-4">
          <input
            dgInputText
            aria-label="Coupon code"
            placeholder="Coupon code"
          />
        </div>
        <div class="rounded-md bg-surface-100 p-3 text-sm font-mono">
          &lt;input dgInputText aria-label="Coupon code"
          placeholder="Coupon code" /&gt;
        </div>
      </section>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class InputTextDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;

  protected readonly name = signal('');
  protected readonly clearDemo = signal('');
  protected readonly floatEmail = signal('');
  protected readonly iftaPhone = signal('');
  protected readonly helpValue = signal('');
  protected readonly emailControl = new FormControl('', { nonNullable: true });

  protected readonly basicCode = `<dg-input-text [(ngModel)]="name" placeholder="Ada Lovelace" ariaLabel="Name" />`;
  protected readonly clearIconCode = `<dg-input-text [(ngModel)]="value" [showClear]="true" ariaLabel="Search" />`;
  protected readonly invalidCode = `<dg-input-text [invalid]="true" placeholder="Invalid state" ariaLabel="Name" />`;
  protected readonly disabledCode = `<dg-input-text [disabled]="true" placeholder="Disabled" ariaLabel="Name" />`;
  protected readonly formsCode = `<dg-input-text [formControl]="emailControl" ariaLabel="Email" />`;
}
