import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoButton } from '@dynamong/button';
import { DynamoCard } from '@dynamong/card';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

function placeholder(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="160"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="24" fill="white" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const EXAMPLES: DocExampleRef[] = [
  { id: 'variants', title: 'Variants' },
  { id: 'media', title: 'With Media' },
  { id: 'footer', title: 'With Footer' },
];

const API: ApiTableRow[] = [
  { name: 'header', type: 'string', default: "''" },
  { name: 'subheader', type: 'string', default: "''" },
  {
    name: 'variant',
    type: "'elevated' | 'outlined' | 'filled'",
    default: "'elevated'",
  },
];

@Component({
  selector: 'docs-card-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoButton,
    DynamoCard,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Card"
      description="A content container with an optional header, media, body, and footer."
      [examples]="examples"
    >
      <docs-example
        exampleId="variants"
        title="Variants"
        description="variant controls the surface treatment — a shadow, a border, or a filled background."
      >
        <div preview class="flex flex-wrap gap-4">
          <div class="w-64">
            <dg-card header="Elevated" subheader="Default shadow">
              <p class="text-text-primary">Card body content.</p>
            </dg-card>
          </div>
          <div class="w-64">
            <dg-card header="Outlined" variant="outlined">
              <p class="text-text-primary">Card body content.</p>
            </dg-card>
          </div>
          <div class="w-64">
            <dg-card header="Filled" variant="filled">
              <p class="text-text-primary">Card body content.</p>
            </dg-card>
          </div>
        </div>
        <div code>
          &lt;dg-card header="Title" subheader="Subtitle" variant="outlined"&gt;
          Body &lt;/dg-card&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="media"
        title="With Media"
        description="Project a [media] slot for a full-bleed banner image above the header/subheader block."
      >
        <div preview class="w-64">
          <dg-card header="Mountain trail" subheader="Ridge loop, 8 mi">
            <img
              media
              [src]="mediaSrc"
              alt=""
              class="h-40 w-full object-cover"
            />
            <p class="text-text-primary">Card body content.</p>
          </dg-card>
        </div>
        <div code>
          &lt;dg-card header="Title" subheader="Subtitle"&gt; &lt;img media
          src="banner.jpg" alt="" /&gt; Body &lt;/dg-card&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="footer"
        title="With Footer"
        description="Project a [footer] slot for actions below the body."
      >
        <div preview class="w-64">
          <dg-card
            header="Outlined"
            subheader="With actions"
            variant="outlined"
          >
            <p class="text-text-primary">Card body content.</p>
            <div footer>
              <dg-button size="sm">Action</dg-button>
            </div>
          </dg-card>
        </div>
        <div code>
          &lt;dg-card header="Title"&gt; Body &lt;div footer&gt;&lt;dg-button
          size="sm"&gt;Action&lt;/dg-button&gt;&lt;/div&gt; &lt;/dg-card&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class CardDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly mediaSrc = placeholder('Mountain trail', '#0ea5e9');
}
