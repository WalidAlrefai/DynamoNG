import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoTimeline, DynamoTimelineItem } from '@dynamong/timeline';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

@Component({
  selector: 'docs-timeline-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoTimeline, DynamoTimelineItem, DocExamplesLayout, DocExample],
  template: `
    <docs-examples-layout
      name="Timeline"
      description="A vertical event/activity list with markers, connecting lines, and per-item content projection."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Project one <dg-timeline-item> per event; severity colors its marker. Any markup goes inside."
      >
        <div preview class="max-w-md">
          <dg-timeline ariaLabel="Order status">
            <dg-timeline-item severity="success">
              <p class="font-medium text-text-primary">Order placed</p>
              <p class="text-sm text-text-muted">Jan 1, 9:02 AM</p>
            </dg-timeline-item>
            <dg-timeline-item severity="info">
              <p class="font-medium text-text-primary">Shipped</p>
              <p class="text-sm text-text-muted">Jan 2, 4:45 PM</p>
            </dg-timeline-item>
            <dg-timeline-item severity="warning">
              <p class="font-medium text-text-primary">Out for delivery</p>
              <p class="text-sm text-text-muted">Jan 3, 8:15 AM</p>
            </dg-timeline-item>
            <dg-timeline-item severity="primary">
              <p class="font-medium text-text-primary">Delivered</p>
              <p class="text-sm text-text-muted">Jan 3, 1:30 PM</p>
            </dg-timeline-item>
          </dg-timeline>
        </div>
        <div code>
          &lt;dg-timeline&gt; &lt;dg-timeline-item severity="success"&gt;Order
          placed&lt;/dg-timeline-item&gt; &lt;dg-timeline-item
          severity="info"&gt;Shipped&lt;/dg-timeline-item&gt; &lt;/dg-timeline&gt;
        </div>
      </docs-example>

      <div api class="space-y-3">
        <table class="w-full border-collapse text-sm">
          <thead>
            <tr class="border-b border-border text-left text-text-muted">
              <th class="py-2 pr-4">Input</th>
              <th class="py-2 pr-4">Component</th>
              <th class="py-2">Default</th>
            </tr>
          </thead>
          <tbody>
            <tr class="border-b border-border">
              <td class="py-2 pr-4 font-mono">ariaLabel</td>
              <td class="py-2 pr-4 font-mono">DynamoTimeline</td>
              <td class="py-2 font-mono">undefined</td>
            </tr>
            <tr>
              <td class="py-2 pr-4 font-mono">severity</td>
              <td class="py-2 pr-4 font-mono">DynamoTimelineItem</td>
              <td class="py-2 font-mono">'primary'</td>
            </tr>
          </tbody>
        </table>
      </div>
    </docs-examples-layout>
  `,
})
export class TimelineDocPage {
  protected readonly examples = EXAMPLES;
}
