import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoCarousel, DynamoCarouselSlide } from '@dynamong/carousel';
import { DocPageShell } from '../components/doc-page-shell';

@Component({
  selector: 'docs-carousel-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoCarousel, DynamoCarouselSlide, DocPageShell],
  template: `
    <docs-page-shell
      name="Carousel"
      description="A sliding content carousel with swipe, keyboard, and autoplay navigation."
    >
      <div demo>
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
        &lt;dg-carousel [autoPlay]="true"&gt; &lt;dg-carousel-slide&gt;...&lt;/dg-carousel-slide&gt;
        &lt;/dg-carousel&gt;
      </div>
      <table api class="w-full border-collapse text-sm">
        <thead>
          <tr class="border-b border-border text-left text-text-muted">
            <th class="py-2 pr-4">Input</th>
            <th class="py-2 pr-4">Type</th>
            <th class="py-2">Default</th>
          </tr>
        </thead>
        <tbody>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">activeIndex</td>
            <td class="py-2 pr-4 font-mono">number (model)</td>
            <td class="py-2 font-mono">0</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">loop</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">autoPlay</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">false</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">autoPlayInterval</td>
            <td class="py-2 pr-4 font-mono">number (ms)</td>
            <td class="py-2 font-mono">5000</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showArrows</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showIndicators</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('Carousel')</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class CarouselDocPage {}
