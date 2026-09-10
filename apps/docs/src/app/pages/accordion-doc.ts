import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { DynamoAccordion, DynamoAccordionPanel } from '@dynamong/accordion';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'single', title: 'Single' },
  { id: 'multiple', title: 'Multiple' },
];

@Component({
  selector: 'docs-accordion-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoAccordion,
    DynamoAccordionPanel,
    DocExamplesLayout,
    DocExample,
  ],
  template: `
    <docs-examples-layout
      name="Accordion"
      description="A collapsible content switcher with full keyboard navigation and ARIA accordion semantics."
      [examples]="examples"
    >
      <docs-example
        exampleId="single"
        title="Single"
        description="The default — one panel open at a time; [(value)] is the open panel's value."
      >
        <div preview>
          <dg-accordion [(value)]="activePanel">
            <dg-accordion-panel value="shipping" header="Shipping">
              <p class="text-text-primary">
                Orders ship within 2 business days.
              </p>
            </dg-accordion-panel>
            <dg-accordion-panel value="returns" header="Returns">
              <p class="text-text-primary">
                Returns are accepted within 30 days of delivery.
              </p>
            </dg-accordion-panel>
            <dg-accordion-panel
              value="warranty"
              header="Warranty"
              [disabled]="true"
            >
              <p class="text-text-primary">
                Warranty details are not available on this plan.
              </p>
            </dg-accordion-panel>
          </dg-accordion>
        </div>
        <div code>
          &lt;dg-accordion [(value)]="active"&gt; &lt;dg-accordion-panel
          value="shipping" header="Shipping"&gt;...&lt;/dg-accordion-panel&gt;
          &lt;/dg-accordion&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="multiple"
        title="Multiple"
        description="multiple lets several panels stay open; [(value)] is then a string array."
      >
        <div preview>
          <dg-accordion [multiple]="true" [(value)]="openPanels">
            <dg-accordion-panel value="a" header="Section A">
              <p class="text-text-primary">First section content.</p>
            </dg-accordion-panel>
            <dg-accordion-panel value="b" header="Section B">
              <p class="text-text-primary">Second section content.</p>
            </dg-accordion-panel>
          </dg-accordion>
        </div>
        <div code>
          &lt;dg-accordion [multiple]="true" [(value)]="openPanels"&gt; ...
          &lt;/dg-accordion&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-text-muted">
              <th class="py-2 pr-4">Element</th>
              <th class="py-2 pr-4">Input</th>
              <th class="py-2 pr-4">Type</th>
              <th class="py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-accordion</td>
              <td class="py-2 pr-4 font-mono">value</td>
              <td class="py-2 pr-4 font-mono">
                string | string[] | undefined (model)
              </td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-accordion</td>
              <td class="py-2 pr-4 font-mono">multiple</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-accordion-panel</td>
              <td class="py-2 pr-4 font-mono">value</td>
              <td class="py-2 pr-4 font-mono">string (required)</td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">dg-accordion-panel</td>
              <td class="py-2 pr-4 font-mono">header</td>
              <td class="py-2 pr-4 font-mono">string (required)</td>
              <td class="py-2 font-mono">—</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">dg-accordion-panel</td>
              <td class="py-2 pr-4 font-mono">disabled</td>
              <td class="py-2 pr-4 font-mono">boolean</td>
              <td class="py-2 font-mono">false</td>
            </tr>
          </tbody>
        </table>
      </div>
    </docs-examples-layout>
  `,
})
export class AccordionDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly activePanel = signal<string | undefined>('shipping');
  protected readonly openPanels = signal<string[]>(['a']);
}
