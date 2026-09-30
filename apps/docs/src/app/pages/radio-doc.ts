import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { DynamoRadio } from '@dynamong/radio';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';
import radioApiRows from '../generated/api/radio.json';

const EXAMPLES: DocExampleRef[] = [
  { id: 'group', title: 'Radio Group' },
  { id: 'reactive-forms', title: 'Reactive Forms' },
  { id: 'filled', title: 'Filled' },
  { id: 'invalid', title: 'Invalid' },
  { id: 'disabled', title: 'Disabled' },
  { id: 'read-only', title: 'Read-Only' },
  { id: 'accessibility', title: 'Accessibility' },
];

@Component({
  selector: 'docs-radio-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoRadio,
    ReactiveFormsModule,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Radio"
      description="A single-selection control among a group of native radio inputs sharing a name."
      [examples]="examples"
    >
      <docs-example
        exampleId="group"
        title="Radio Group"
        description="There is no group wrapper — give siblings the same name and drive them from one selection signal via the split [checked]/(checkedChange) binding."
        [code]="groupCode"
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio
            name="plan"
            value="free"
            [checked]="plan() === 'free'"
            (checkedChange)="plan.set('free')"
          >
            Free
          </dg-radio>
          <dg-radio
            name="plan"
            value="pro"
            [checked]="plan() === 'pro'"
            (checkedChange)="plan.set('pro')"
          >
            Pro
          </dg-radio>
          <dg-radio
            name="plan"
            value="enterprise"
            [checked]="plan() === 'enterprise'"
            (checkedChange)="plan.set('enterprise')"
          >
            Enterprise
          </dg-radio>
        </div>
      </docs-example>

      <docs-example
        exampleId="reactive-forms"
        title="Reactive Forms"
        description="Implements ControlValueAccessor, so a group can instead bind formControl/formControlName/ngModel — every radio sharing a name stays in sync even when bound to the same control."
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio name="tier" value="basic" [formControl]="tier"
            >Basic</dg-radio
          >
          <dg-radio name="tier" value="premium" [formControl]="tier"
            >Premium</dg-radio
          >
          <p class="mt-2 text-sm text-text-muted">
            Value: <span class="font-mono">{{ tier.value }}</span>
          </p>
        </div>
        <div code>
          &lt;dg-radio name="tier" value="basic" [formControl]="tier"
          /&gt;&lt;dg-radio name="tier" value="premium" [formControl]="tier"
          /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="filled"
        title="Filled"
        description='variant "filled" swaps the outlined look for a filled surface background while unchecked.'
        [code]="filledCode"
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio
            name="filled-demo"
            value="a"
            variant="filled"
            [checked]="true"
            >Option A</dg-radio
          >
          <dg-radio name="filled-demo" value="b" variant="filled"
            >Option B</dg-radio
          >
        </div>
      </docs-example>

      <docs-example
        exampleId="invalid"
        title="Invalid"
        description="invalid applies the error styling for a failed validation state."
        [code]="invalidCode"
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio name="invalid-demo" value="a" [invalid]="true"
            >Option A</dg-radio
          >
          <dg-radio name="invalid-demo" value="b" [invalid]="true"
            >Option B</dg-radio
          >
        </div>
      </docs-example>

      <docs-example
        exampleId="disabled"
        title="Disabled"
        description="A single option can be disabled without affecting its siblings."
        [code]="disabledCode"
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio name="plan2" value="a" [checked]="true">Available</dg-radio>
          <dg-radio [disabled]="true" name="plan2" value="b">
            Enterprise (disabled)
          </dg-radio>
        </div>
      </docs-example>

      <docs-example
        exampleId="read-only"
        title="Read-Only"
        description="readOnly keeps the current selection visible and the input focusable, but blocks selecting a different option — unlike disabled, it stays in the tab order and isn't dimmed."
        [code]="readOnlyCode"
      >
        <div preview class="flex flex-col gap-1">
          <dg-radio
            name="readonly-demo"
            value="a"
            [checked]="true"
            [readOnly]="true"
            >Option A (read-only)</dg-radio
          >
          <dg-radio name="readonly-demo" value="b" [readOnly]="true"
            >Option B (read-only)</dg-radio
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
            <code class="font-mono">&lt;input type="radio"&gt;</code>,
            inheriting native radio-group keyboard navigation (arrow keys move
            selection between same-<code class="font-mono">name</code>
            siblings) for free.
          </li>
          <li>
            <code class="font-mono">aria-invalid</code> is set while
            <code class="font-mono">invalid</code> is true,
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
          <li>
            Two independent reactive-forms radio groups elsewhere in the app
            that happen to reuse the same <code class="font-mono">name</code> no
            longer cross-contaminate each other's selection — the shared
            registry now scopes sibling-sync by each radio's own form root
            (mirroring Angular's own
            <code class="font-mono">RadioControlRegistry</code>), falling back
            to name-only matching only for the plain split-binding pattern shown
            above (which has no form root at all).
          </li>
        </ul>
      </section>

      <div api class="space-y-3">
        <docs-api-table [rows]="apiRows" />
        <p class="text-sm text-text-muted">
          There is no <code>RadioGroup</code> container — give sibling radios
          the same <code>name</code> for native grouping, and drive them from
          one shared selection signal using the split-binding form shown above
          (not full <code>[(checked)]</code>, which would desync a deselected
          sibling since native radios never fire <code>change</code> on
          deselection).
        </p>
      </div>
    </docs-examples-layout>
  `,
})
export class RadioDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows: ApiTableRow[] = radioApiRows;
  protected readonly plan = signal<'free' | 'pro' | 'enterprise'>('free');
  protected readonly tier = new FormControl('basic', { nonNullable: true });

  protected readonly groupCode = `plan = signal<'free' | 'pro' | 'enterprise'>('free');

<dg-radio name="plan" value="free"
  [checked]="plan() === 'free'"
  (checkedChange)="plan.set('free')">Free</dg-radio>
<dg-radio name="plan" value="pro"
  [checked]="plan() === 'pro'"
  (checkedChange)="plan.set('pro')">Pro</dg-radio>`;
  protected readonly disabledCode = `<dg-radio [disabled]="true" name="plan" value="enterprise">
  Enterprise (disabled)
</dg-radio>`;
  protected readonly filledCode = `<dg-radio name="plan" value="a" variant="filled" [checked]="true">Option A</dg-radio>
<dg-radio name="plan" value="b" variant="filled">Option B</dg-radio>`;
  protected readonly invalidCode = `<dg-radio name="plan" value="a" [invalid]="true">Option A</dg-radio>
<dg-radio name="plan" value="b" [invalid]="true">Option B</dg-radio>`;
  protected readonly readOnlyCode = `<dg-radio name="plan" value="a" [checked]="true" [readOnly]="true">Option A</dg-radio>
<dg-radio name="plan" value="b" [readOnly]="true">Option B</dg-radio>`;
}
