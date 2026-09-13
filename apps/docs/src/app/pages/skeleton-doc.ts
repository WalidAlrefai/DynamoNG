import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoSkeleton } from '@dynamong/skeleton';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'variants', title: 'Variants' },
  { id: 'card', title: 'Card Placeholder' },
  { id: 'animation-radius', title: 'Animation & Border Radius' },
];

const API: ApiTableRow[] = [
  {
    name: 'variant',
    type: "'text' | 'circular' | 'rectangular'",
    default: "'text'",
  },
  { name: 'width', type: 'string | number | undefined', default: 'undefined' },
  { name: 'height', type: 'string | number | undefined', default: 'undefined' },
  { name: 'animation', type: "'pulse' | 'none'", default: "'pulse'" },
  {
    name: 'borderRadius',
    type: 'string | undefined',
    default: 'undefined',
  },
];

@Component({
  selector: 'docs-skeleton-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoSkeleton, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Skeleton"
      description="An animated loading-placeholder block."
      [examples]="examples"
    >
      <docs-example
        exampleId="variants"
        title="Variants"
        description="variant sets the shape; width / height accept any CSS length."
      >
        <div preview class="flex max-w-sm flex-col gap-3">
          <dg-skeleton variant="text" width="60%" />
          <dg-skeleton variant="circular" />
          <dg-skeleton variant="rectangular" height="6rem" />
        </div>
        <div code>&lt;dg-skeleton variant="text" width="60%" /&gt;</div>
      </docs-example>

      <docs-example
        exampleId="card"
        title="Card Placeholder"
        description="Compose several skeletons to mirror the layout you're loading."
      >
        <div preview class="flex max-w-sm items-center gap-3">
          <dg-skeleton variant="circular" />
          <div class="flex flex-1 flex-col gap-2">
            <dg-skeleton variant="text" width="60%" />
            <dg-skeleton variant="text" width="40%" />
          </div>
        </div>
        <div code>
          &lt;dg-skeleton variant="circular" /&gt; &lt;dg-skeleton
          variant="text" width="60%" /&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="animation-radius"
        title="Animation & Border Radius"
        description='animation="none" opts out of the pulse; borderRadius overrides the variant&apos;s own default rounding.'
      >
        <div preview class="flex max-w-sm flex-col gap-3">
          <dg-skeleton variant="rectangular" height="3rem" animation="none" />
          <dg-skeleton
            variant="rectangular"
            height="3rem"
            borderRadius="9999px"
          />
        </div>
        <div code>
          &lt;dg-skeleton animation="none" /&gt; &lt;dg-skeleton
          borderRadius="9999px" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class SkeletonDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
}
