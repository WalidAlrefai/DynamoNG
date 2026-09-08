import { Component, model } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoImageGallery } from './image-gallery';
import { DynamoImageGalleryHarness } from './image-gallery.harness';
import type { DynamoGalleryImage } from './image-gallery.types';

const SAMPLE_IMAGES: DynamoGalleryImage[] = [
  { src: 'image-0.jpg', alt: 'Image 0' },
  { src: 'image-1.jpg', alt: 'Image 1', caption: 'A caption' },
  { src: 'image-2.jpg', alt: 'Image 2', thumbnailSrc: 'thumb-2.jpg' },
];

@Component({
  selector: 'dg-image-gallery-test-host',
  standalone: true,
  imports: [DynamoImageGallery],
  template: `<dg-image-gallery [images]="images" [(activeIndex)]="index" [loop]="loop()" />`,
})
class ImageGalleryTestHostComponent {
  readonly images = SAMPLE_IMAGES;
  readonly index = model(0);
  readonly loop = model(true);
}

/** CDK's ConfigurableFocusTrap moves initial focus asynchronously; flush that before asserting on it. */
function flushFocusTrap(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

function thumbnails(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll('[role="tab"]'));
}

describe('DynamoImageGallery', () => {
  describe('creation', () => {
    it('renders a main image and one thumbnail per image', () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });

      expect(within(container).getByRole('button', { name: /View fullscreen/ })).toBeTruthy();
      expect(thumbnails(container)).toHaveLength(3);
    });

    it('renders no lightbox in the DOM until opened', () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });

      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });
  });

  describe('default behavior', () => {
    it('starts on the first image', () => {
      const { container, componentInstance } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });

      expect(componentInstance.activeIndex()).toBe(0);
      expect(thumbnails(container)[0]?.getAttribute('aria-selected')).toBe('true');
    });

    it('defaults loop and showThumbnails to true', () => {
      const { componentInstance } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });

      expect(componentInstance.loop()).toBe(true);
      expect(componentInstance.showThumbnails()).toBe(true);
    });
  });

  describe('navigation', () => {
    it('advances to the next image on arrow-button click and updates the two-way-bound activeIndex', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );

      await userEvent.click(within(container).getByRole('button', { name: 'Next image' }));

      expect(componentInstance.index()).toBe(1);
    });

    it('goes back to the previous image on arrow-button click', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      componentInstance.index.set(1);

      await userEvent.click(within(container).getByRole('button', { name: 'Previous image' }));

      expect(componentInstance.index()).toBe(0);
    });

    it('wraps from the last image to the first when loop is true', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      componentInstance.index.set(2);

      await userEvent.click(within(container).getByRole('button', { name: 'Next image' }));

      expect(componentInstance.index()).toBe(0);
    });

    it('does not wrap and disables the next arrow at the last image when loop is false', () => {
      const { container } = renderDynamoComponent(ImageGalleryTestHostComponent, {
        inputs: { loop: false, index: 2 },
      });

      expect(
        within(container).getByRole('button', { name: 'Next image' }).hasAttribute('disabled'),
      ).toBe(true);
    });

    it('jumps to a clicked thumbnail', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );

      await userEvent.click(thumbnails(container)[2] as HTMLElement);

      expect(componentInstance.index()).toBe(2);
    });
  });

  describe('viewport keyboard navigation', () => {
    it('ArrowRight/ArrowLeft on the main image move to the next/previous image', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      const main = within(container).getByRole('button', { name: /View fullscreen/ });
      main.focus();

      await userEvent.keyboard('{ArrowRight}');
      expect(componentInstance.index()).toBe(1);

      await userEvent.keyboard('{ArrowLeft}');
      expect(componentInstance.index()).toBe(0);
    });

    it('Home/End jump to the first/last image', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      const main = within(container).getByRole('button', { name: /View fullscreen/ });
      main.focus();

      await userEvent.keyboard('{End}');
      expect(componentInstance.index()).toBe(2);

      await userEvent.keyboard('{Home}');
      expect(componentInstance.index()).toBe(0);
    });
  });

  describe('thumbnail keyboard navigation', () => {
    it('roves focus and activates with ArrowRight/ArrowLeft, wrapping at the ends', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      thumbnails(container)[0]?.focus();

      await userEvent.keyboard('{ArrowLeft}');

      expect(document.activeElement).toBe(thumbnails(container)[2]);
      expect(componentInstance.index()).toBe(2);
    });

    it('Home/End roving-focus to the first/last thumbnail', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      thumbnails(container)[0]?.focus();

      await userEvent.keyboard('{End}');

      expect(document.activeElement).toBe(thumbnails(container)[2]);
      expect(componentInstance.index()).toBe(2);
    });

    it('only the active thumbnail is a tab stop', () => {
      const { container } = renderDynamoComponent(ImageGalleryTestHostComponent);
      const tabs = thumbnails(container);

      expect(tabs[0]?.getAttribute('tabindex')).toBe('0');
      expect(tabs[1]?.getAttribute('tabindex')).toBe('-1');
      expect(tabs[2]?.getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('lightbox', () => {
    it('opens when the main image is clicked', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });

      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));

      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    });

    it('opens on Enter when the main image is focused', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      within(container).getByRole('button', { name: /View fullscreen/ }).focus();

      await userEvent.keyboard('{Enter}');

      expect(container.querySelector('[role="dialog"]')).not.toBeNull();
    });

    it('closes on Escape', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));
      await flushFocusTrap();

      await userEvent.keyboard('{Escape}');

      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('closes when the backdrop is clicked', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));

      await userEvent.click(within(container).getByTestId('image-gallery-lightbox-backdrop'));

      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('closes when the close button is clicked', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));

      await userEvent.click(within(container).getByRole('button', { name: 'Close' }));

      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('moves focus inside the lightbox panel when opened', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });

      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));
      await flushFocusTrap();

      const panel = container.querySelector('[role="dialog"]') as HTMLElement;
      expect(panel.contains(document.activeElement)).toBe(true);
    });

    it('returns focus to the main image button when the lightbox closes', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      const main = within(container).getByRole('button', {
        name: /View fullscreen/,
      }) as HTMLButtonElement;
      main.focus();

      await userEvent.click(main);
      await flushFocusTrap();
      expect(document.activeElement).not.toBe(main);

      await userEvent.click(within(container).getByRole('button', { name: 'Close' }));

      expect(document.activeElement).toBe(main);
    });

    it('navigates with arrow keys while open, keeping the thumbnail strip in sync after closing', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));
      await flushFocusTrap();

      await userEvent.keyboard('{ArrowRight}');
      await userEvent.click(within(container).getByRole('button', { name: 'Close' }));

      expect(componentInstance.index()).toBe(1);
      expect(thumbnails(container)[1]?.getAttribute('aria-selected')).toBe('true');
    });

    it('supports interaction through the DynamoImageGalleryHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoImageGalleryHarness,
      );

      expect(await harness.getImageCount()).toBe(3);
      expect(await harness.isLightboxOpen()).toBe(false);

      await harness.openLightbox();
      expect(await harness.isLightboxOpen()).toBe(true);

      await harness.closeLightbox();
      expect(await harness.isLightboxOpen()).toBe(false);

      await harness.goToThumbnail(1);
      expect(await harness.getActiveIndex()).toBe(1);
    });
  });

  describe('image error fallback', () => {
    it('renders a fallback placeholder for the main image after it fails to load', () => {
      const { container, fixture } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      const main = within(container).getByRole('button', { name: /View fullscreen/ });
      const img = main.querySelector('img') as HTMLImageElement;

      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(main.querySelector('img')).toBeNull();
      expect(main.querySelector('svg')).not.toBeNull();
    });

    it('renders a fallback placeholder for a thumbnail after it fails to load', () => {
      const { container, fixture } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      const thumbnailImg = thumbnails(container)[1]?.querySelector('img') as HTMLImageElement;

      thumbnailImg.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(thumbnails(container)[1]?.querySelector('img')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('has no axe violations by default', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations with the lightbox open', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });
      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));
      await flushFocusTrap();

      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('marks the lightbox backdrop as aria-hidden so it is excluded from the accessibility tree', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: SAMPLE_IMAGES },
      });

      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));

      expect(
        within(container)
          .getByTestId('image-gallery-lightbox-backdrop')
          .getAttribute('aria-hidden'),
      ).toBe('true');
    });
  });

  describe('edge cases', () => {
    it('renders without arrows or thumbnails for a single image', () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: [SAMPLE_IMAGES[0] as DynamoGalleryImage] },
      });

      expect(container.querySelector('button[aria-label="Next image"]')).toBeNull();
      expect(thumbnails(container)).toHaveLength(0);
    });

    it('renders an empty viewport without throwing for zero images', () => {
      expect(() => {
        renderDynamoComponent(DynamoImageGallery, { inputs: { images: [] } });
      }).not.toThrow();
    });

    it('does not open the lightbox when there are zero images', async () => {
      const { container } = renderDynamoComponent(DynamoImageGallery, {
        inputs: { images: [] },
      });

      expect(container.querySelector('button[aria-label^="View fullscreen"]')).toBeNull();
      expect(container.querySelector('[role="dialog"]')).toBeNull();
    });

    it('renders a caption in the lightbox only when the active image has one', async () => {
      const { container, componentInstance } = renderDynamoComponent(
        ImageGalleryTestHostComponent,
      );
      componentInstance.index.set(1);

      await userEvent.click(within(container).getByRole('button', { name: /View fullscreen/ }));

      expect(container.textContent).toContain('A caption');
    });
  });
});
