import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { describe, expect, it } from 'vitest';
import { DynamoAvatar } from './avatar';
import { DynamoAvatarHarness } from './avatar.harness';

describe('DynamoAvatar', () => {
  describe('creation', () => {
    it('renders without errors', () => {
      const { container } = renderDynamoComponent(DynamoAvatar);

      expect(container.querySelector('span[role="img"]')).toBeTruthy();
    });
  });

  describe('default behavior', () => {
    it('renders the generic icon fallback when neither src nor name is set', () => {
      const { container } = renderDynamoComponent(DynamoAvatar);

      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('defaults size to md', () => {
      const { componentInstance } = renderDynamoComponent(DynamoAvatar);

      expect(componentInstance.size()).toBe('md');
    });
  });

  describe('input properties', () => {
    it('accepts every documented size without throwing', () => {
      const { componentInstance, setInputs } =
        renderDynamoComponent(DynamoAvatar);

      for (const size of ['sm', 'md', 'lg'] as const) {
        setInputs({ size });
        expect(componentInstance.size()).toBe(size);
      }
    });

    it.each([
      { name: 'Ada Lovelace', expected: 'AL' },
      { name: 'Madonna', expected: 'MA' },
      { name: 'Ada Bea Lovelace', expected: 'AL' },
      { name: 'X', expected: 'X' },
    ])(
      'derives initials "$expected" from name "$name"',
      ({ name, expected }) => {
        const { container } = renderDynamoComponent(DynamoAvatar, {
          inputs: { name },
        });

        expect(
          container.querySelector('span[role="img"]')?.textContent?.trim(),
        ).toBe(expected);
      },
    );
  });

  describe('conditional rendering', () => {
    it('renders an image when src is set', () => {
      const { container } = renderDynamoComponent(DynamoAvatar, {
        inputs: { src: 'https://example.com/avatar.png' },
      });

      expect(container.querySelector('img')).not.toBeNull();
    });

    it('falls back to initials when the image fails to load', () => {
      const { container, fixture } = renderDynamoComponent(DynamoAvatar, {
        inputs: { src: 'https://example.com/broken.png', name: 'Ada Lovelace' },
      });

      const img = container.querySelector('img') as HTMLImageElement;
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(container.querySelector('img')).toBeNull();
      expect(
        container.querySelector('span[role="img"]')?.textContent?.trim(),
      ).toBe('AL');
    });

    it('falls back to the icon when the image fails to load and no name is set', () => {
      const { container, fixture } = renderDynamoComponent(DynamoAvatar, {
        inputs: { src: 'https://example.com/broken.png' },
      });

      const img = container.querySelector('img') as HTMLImageElement;
      img.dispatchEvent(new Event('error'));
      fixture.detectChanges();

      expect(container.querySelector('img')).toBeNull();
      expect(container.querySelector('svg')).not.toBeNull();
    });
  });

  describe('template behavior', () => {
    it('prefers an explicit alt over the derived name, and the name over the default', () => {
      const { container, setInputs } = renderDynamoComponent(DynamoAvatar, {
        inputs: { name: 'Ada Lovelace' },
      });
      expect(
        container.querySelector('span[role="img"]')?.getAttribute('aria-label'),
      ).toBe('Ada Lovelace');

      setInputs({ alt: 'Custom label' });
      expect(
        container.querySelector('span[role="img"]')?.getAttribute('aria-label'),
      ).toBe('Custom label');
    });

    it('defaults the alt text to "Avatar" when neither alt nor name is set', () => {
      const { container } = renderDynamoComponent(DynamoAvatar);

      expect(
        container.querySelector('span[role="img"]')?.getAttribute('aria-label'),
      ).toBe('Avatar');
    });
  });

  describe('accessibility', () => {
    it('has no axe violations showing an image', async () => {
      const { container } = renderDynamoComponent(DynamoAvatar, {
        inputs: { src: 'https://example.com/avatar.png', name: 'Ada Lovelace' },
      });
      await expectNoA11yViolations(container);
    });

    it('has no axe violations showing initials', async () => {
      const { container } = renderDynamoComponent(DynamoAvatar, {
        inputs: { name: 'Ada Lovelace' },
      });
      await expectNoA11yViolations(container);
    });

    it('has no axe violations showing the generic icon', async () => {
      const { container } = renderDynamoComponent(DynamoAvatar);
      await expectNoA11yViolations(container);
    });

    it('supports interaction through the DynamoAvatarHarness', async () => {
      const { fixture } = renderDynamoComponent(DynamoAvatar, {
        inputs: { name: 'Ada Lovelace' },
      });
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoAvatarHarness,
      );

      expect(await harness.getAltText()).toBe('Ada Lovelace');
      expect(await harness.isShowingInitials()).toBe(true);
      expect(await harness.isShowingImage()).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('falls back to the icon for an empty-string name', () => {
      const { container } = renderDynamoComponent(DynamoAvatar, {
        inputs: { name: '' },
      });

      expect(container.querySelector('svg')).not.toBeNull();
    });

    it('falls back to the icon for a whitespace-only name', () => {
      const { container } = renderDynamoComponent(DynamoAvatar, {
        inputs: { name: '   ' },
      });

      expect(container.querySelector('svg')).not.toBeNull();
    });
  });
});
