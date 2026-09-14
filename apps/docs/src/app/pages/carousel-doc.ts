import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoCarousel, DynamoCarouselSlide } from '@dynamong/carousel';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

const EXAMPLES: DocExampleRef[] = [
  { id: 'basic', title: 'Basic' },
  { id: 'multi-visible', title: 'Multiple Visible' },
];

const API: ApiTableRow[] = [
  { name: 'activeIndex', type: 'number (model)', default: '0' },
  { name: 'loop', type: 'boolean', default: 'true' },
  { name: 'autoPlay', type: 'boolean', default: 'false' },
  { name: 'autoPlayInterval', type: 'number (ms)', default: '5000' },
  { name: 'showArrows', type: 'boolean', default: 'true' },
  { name: 'showIndicators', type: 'boolean', default: 'true' },
  { name: 'numVisible', type: 'number', default: '1' },
  { name: 'numScroll', type: 'number', default: '1' },
  {
    name: 'responsiveOptions',
    type: 'DynamoCarouselResponsiveOption[]',
    default: '[]',
  },
  { name: 'ariaLabel', type: 'string | undefined', default: "'Carousel'" },
];

@Component({
  selector: 'docs-carousel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DynamoCarousel,
    DynamoCarouselSlide,
    DocExamplesLayout,
    DocExample,
    DocApiTable,
  ],
  template: `
    <docs-examples-layout
      name="Carousel"
      description="A sliding content carousel with swipe, keyboard, and autoplay navigation."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Project one <dg-carousel-slide> per panel; autoPlay advances on a timer that pauses on hover/focus."
      >
        <div preview>
          <dg-carousel
            [autoPlay]="true"
            styleClass="max-w-md"
            ariaLabel="Featured content"
          >
            <dg-carousel-slide>
              <div
                class="flex h-48 items-center justify-center bg-primary text-lg font-medium text-on-primary"
              >
                Slide 1
              </div>
            </dg-carousel-slide>
            <dg-carousel-slide>
              <div
                class="flex h-48 items-center justify-center bg-success text-lg font-medium text-on-primary"
              >
                Slide 2
              </div>
            </dg-carousel-slide>
            <dg-carousel-slide>
              <div
                class="flex h-48 items-center justify-center bg-info text-lg font-medium text-on-primary"
              >
                Slide 3
              </div>
            </dg-carousel-slide>
          </dg-carousel>
        </div>
        <div code>
          &lt;dg-carousel [autoPlay]="true"&gt;
          &lt;dg-carousel-slide&gt;...&lt;/dg-carousel-slide&gt;
          &lt;/dg-carousel&gt;
        </div>
      </docs-example>

      <docs-example
        exampleId="multi-visible"
        title="Multiple Visible"
        description="numVisible shows several slides at once; numScroll sets how many next()/prev() advances by. responsiveOptions overrides both at narrower viewports — try shrinking the window."
      >
        <div preview>
          <dg-carousel
            [numVisible]="3"
            [numScroll]="3"
            [responsiveOptions]="[
              { breakpoint: 1024, numVisible: 2, numScroll: 2 },
              { breakpoint: 640, numVisible: 1, numScroll: 1 },
            ]"
            styleClass="max-w-2xl"
            ariaLabel="Product grid"
          >
            @for (color of colors; track color) {
              <dg-carousel-slide>
                <div
                  class="mx-1 flex h-32 items-center justify-center rounded-md text-sm font-medium text-on-primary"
                  [style.background]="color"
                >
                  {{ color }}
                </div>
              </dg-carousel-slide>
            }
          </dg-carousel>
        </div>
        <div code>
          &lt;dg-carousel [numVisible]="3" [numScroll]="3"
          [responsiveOptions]="[&#123; breakpoint: 1024, numVisible: 2,
          numScroll: 2 &#125;]"&gt; ... &lt;/dg-carousel&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class CarouselDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly colors = [
    '#6366f1',
    '#22c55e',
    '#f59e0b',
    '#ef4444',
    '#0ea5e9',
    '#a855f7',
  ];
}
