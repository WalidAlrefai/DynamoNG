import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoImageGallery } from '@dynamong/image-gallery';
import type { DynamoGalleryImage } from '@dynamong/image-gallery';
import { DocApiTable, type ApiTableRow } from '../components/api-table';
import { DocExample } from '../components/example-block';
import {
  DocExamplesLayout,
  type DocExampleRef,
} from '../components/examples-layout';

function placeholder(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const GALLERY_IMAGES: DynamoGalleryImage[] = [
  {
    src: placeholder('Image 1', '#6366f1'),
    alt: 'Placeholder image 1',
    caption: 'A mountain range at dawn',
  },
  {
    src: placeholder('Image 2', '#22c55e'),
    alt: 'Placeholder image 2',
    caption: 'A forest trail in summer',
  },
  { src: placeholder('Image 3', '#f59e0b'), alt: 'Placeholder image 3' },
  {
    src: placeholder('Image 4', '#ef4444'),
    alt: 'Placeholder image 4',
    caption: 'A coastline at sunset',
  },
  { src: placeholder('Image 5', '#0ea5e9'), alt: 'Placeholder image 5' },
];

const EXAMPLES: DocExampleRef[] = [{ id: 'basic', title: 'Basic' }];

const API: ApiTableRow[] = [
  { name: 'images', type: 'DynamoGalleryImage[] (required)', default: '—' },
  { name: 'activeIndex', type: 'number (model)', default: '0' },
  { name: 'loop', type: 'boolean', default: 'true' },
  {
    name: 'aspectRatio',
    type: "'square' | 'video' | 'wide'",
    default: "'video'",
  },
  { name: 'showThumbnails', type: 'boolean', default: 'true' },
  { name: 'ariaLabel', type: 'string | undefined', default: "'Image gallery'" },
];

@Component({
  selector: 'docs-image-gallery-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoImageGallery, DocExamplesLayout, DocExample, DocApiTable],
  template: `
    <docs-examples-layout
      name="Image Gallery"
      description="An image viewer with a thumbnail strip and a fullscreen lightbox."
      [examples]="examples"
    >
      <docs-example
        exampleId="basic"
        title="Basic"
        description="Pass an images array of { src, alt, caption? }; the thumbnail strip navigates and a click opens the lightbox."
      >
        <div preview class="max-w-lg">
          <dg-image-gallery [images]="images" ariaLabel="Sample photos" />
        </div>
        <div code>
          &lt;dg-image-gallery [images]="images" ariaLabel="Sample photos" /&gt;
        </div>
      </docs-example>

      <docs-api-table api [rows]="apiRows" />
    </docs-examples-layout>
  `,
})
export class ImageGalleryDocPage {
  protected readonly examples = EXAMPLES;
  protected readonly apiRows = API;
  protected readonly images = GALLERY_IMAGES;
}
