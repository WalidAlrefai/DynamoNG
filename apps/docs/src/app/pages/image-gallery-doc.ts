import { ChangeDetectionStrategy, Component } from '@angular/core';
import { DynamoImageGallery } from '@dynamong/image-gallery';
import type { DynamoGalleryImage } from '@dynamong/image-gallery';
import { DocPageShell } from '../components/doc-page-shell';

// Self-contained inline SVG data-URIs rather than external image URLs — no
// network dependency, and reliable for live/automated browser verification.
function placeholder(label: string, color: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="${color}"/><text x="50%" y="50%" font-family="sans-serif" font-size="48" fill="white" text-anchor="middle" dominant-baseline="middle">${label}</text></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const GALLERY_IMAGES: DynamoGalleryImage[] = [
  { src: placeholder('Image 1', '#6366f1'), alt: 'Placeholder image 1', caption: 'A mountain range at dawn' },
  { src: placeholder('Image 2', '#22c55e'), alt: 'Placeholder image 2', caption: 'A forest trail in summer' },
  { src: placeholder('Image 3', '#f59e0b'), alt: 'Placeholder image 3' },
  { src: placeholder('Image 4', '#ef4444'), alt: 'Placeholder image 4', caption: 'A coastline at sunset' },
  { src: placeholder('Image 5', '#0ea5e9'), alt: 'Placeholder image 5' },
];

@Component({
  selector: 'docs-image-gallery-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DynamoImageGallery, DocPageShell],
  template: `
    <docs-page-shell
      name="Image Gallery"
      description="An image viewer with a thumbnail strip and a fullscreen lightbox."
    >
      <div demo class="max-w-lg">
        <dg-image-gallery [images]="images" ariaLabel="Sample photos" />
      </div>
      <div code>&lt;dg-image-gallery [images]="images" ariaLabel="Sample photos" /&gt;</div>
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
            <td class="py-2 pr-4 font-mono">images</td>
            <td class="py-2 pr-4 font-mono">DynamoGalleryImage[] (required)</td>
            <td class="py-2 font-mono">—</td>
          </tr>
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
            <td class="py-2 pr-4 font-mono">aspectRatio</td>
            <td class="py-2 pr-4 font-mono">'square' | 'video' | 'wide'</td>
            <td class="py-2 font-mono">'video'</td>
          </tr>
          <tr class="border-b border-border">
            <td class="py-2 pr-4 font-mono">showThumbnails</td>
            <td class="py-2 pr-4 font-mono">boolean</td>
            <td class="py-2 font-mono">true</td>
          </tr>
          <tr>
            <td class="py-2 pr-4 font-mono">ariaLabel</td>
            <td class="py-2 pr-4 font-mono">string | undefined</td>
            <td class="py-2 font-mono">undefined ('Image gallery')</td>
          </tr>
        </tbody>
      </table>
    </docs-page-shell>
  `,
})
export class ImageGalleryDocPage {
  protected readonly images = GALLERY_IMAGES;
}
