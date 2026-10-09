import { Component } from '@angular/core';
import {
  expectNoA11yViolations,
  renderDynamoComponent,
} from '@dynamong/testing';
import { describe, expect, it } from 'vitest';
import { DynamoAvatar } from './avatar';
import { DynamoAvatarGroup } from './avatar-group';

@Component({
  selector: 'dg-avatar-group-test-host',
  standalone: true,
  imports: [DynamoAvatarGroup, DynamoAvatar],
  template: `
    <dg-avatar-group>
      <dg-avatar name="Ada Lovelace" />
      <dg-avatar name="Grace Hopper" />
      <dg-avatar name="Margaret Hamilton" />
    </dg-avatar-group>
  `,
})
class AvatarGroupTestHostComponent {}

describe('DynamoAvatarGroup', () => {
  it('renders a group role wrapping every projected avatar', () => {
    const { container } = renderDynamoComponent(AvatarGroupTestHostComponent);

    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group?.querySelectorAll('dg-avatar')).toHaveLength(3);
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(AvatarGroupTestHostComponent);
    await expectNoA11yViolations(container);
  });

  describe('pt / ariaDescribedby', () => {
    it('merges pt class onto root', () => {
      const { container } = renderDynamoComponent(DynamoAvatarGroup, {
        inputs: { pt: { root: { class: 'pt-root' } } },
      });

      expect(
        container
          .querySelector('[role="group"]')
          ?.classList.contains('pt-root'),
      ).toBe(true);
    });

    it('merges a non-class pt attribute onto root', () => {
      const { container } = renderDynamoComponent(DynamoAvatarGroup, {
        inputs: { pt: { root: { 'data-testid': 'root-el' } } },
      });

      expect(container.querySelector('[data-testid="root-el"]')).not.toBeNull();
    });

    it('omits aria-describedby by default, forwards it to the root when set', () => {
      const { container } = renderDynamoComponent(DynamoAvatarGroup, {
        inputs: { ariaDescribedby: 'hint-id' },
      });

      expect(
        container
          .querySelector('[role="group"]')
          ?.getAttribute('aria-describedby'),
      ).toBe('hint-id');
    });
  });
});
