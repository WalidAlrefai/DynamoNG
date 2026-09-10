import { Component, signal } from '@angular/core';
import type { ComponentFixture } from '@angular/core/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoInplace } from './inplace';
import { DynamoInplaceHarness } from './inplace.harness';

@Component({
  selector: 'dg-inplace-host',
  standalone: true,
  imports: [DynamoInplace],
  template: `
    <dg-inplace [(active)]="active" [disabled]="disabled()" [closable]="closable()">
      <span display>{{ text() || 'Click to edit' }}</span>
      <input editor [value]="text()" aria-label="Value" (input)="onInput($event)" />
    </dg-inplace>
  `,
})
class InplaceHostComponent {
  readonly active = signal(false);
  readonly disabled = signal(false);
  readonly closable = signal(true);
  readonly text = signal('Hello');
  onInput(e: Event): void {
    this.text.set((e.target as HTMLInputElement).value);
  }
}

function displayBtn(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-testid="DynamoInplace-display"]');
}
function editor(container: HTMLElement): HTMLElement | null {
  return container.querySelector('[data-testid="DynamoInplace-editor"]');
}
async function flush(fixture: ComponentFixture<unknown>): Promise<void> {
  await new Promise((r) => setTimeout(r, 0));
  fixture.detectChanges();
}

describe('DynamoInplace', () => {
  describe('creation', () => {
    it('starts in display mode showing the [display] slot; [editor] is not rendered', () => {
      const { container } = renderDynamoComponent(InplaceHostComponent);

      expect(displayBtn(container)?.textContent).toContain('Hello');
      expect(editor(container)).toBeNull();
    });
  });

  describe('activation', () => {
    it('clicking the display swaps to the editor and emits active=true', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        InplaceHostComponent,
      );

      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);

      expect(editor(container)).toBeTruthy();
      expect(displayBtn(container)).toBeNull();
      expect(componentInstance.active()).toBe(true);
      expect(
        within(container).getByRole('textbox', { name: 'Value' }),
      ).toBeTruthy();
    });

    it('moves focus into the editor on activate', async () => {
      const { container, fixture } = renderDynamoComponent(InplaceHostComponent);

      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);

      expect(document.activeElement).toBe(
        within(container).getByRole('textbox', { name: 'Value' }),
      );
    });

    it('does not activate when disabled', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        InplaceHostComponent,
      );
      componentInstance.disabled.set(true);
      fixture.detectChanges();

      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);

      expect(editor(container)).toBeNull();
      expect(componentInstance.active()).toBe(false);
    });
  });

  describe('deactivation', () => {
    it('the close button returns to display mode and re-emits active=false', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        InplaceHostComponent,
      );
      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);

      await userEvent.click(
        container.querySelector('[data-testid="DynamoInplace-close"]') as HTMLElement,
      );
      await flush(fixture);

      expect(editor(container)).toBeNull();
      expect(displayBtn(container)).toBeTruthy();
      expect(componentInstance.active()).toBe(false);
    });

    it('Escape while editing returns to display mode', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        InplaceHostComponent,
      );
      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);

      await userEvent.keyboard('{Escape}');
      await flush(fixture);

      expect(componentInstance.active()).toBe(false);
      expect(editor(container)).toBeNull();
    });

    it('moves focus back to the display trigger on deactivate', async () => {
      const { container, fixture } = renderDynamoComponent(InplaceHostComponent);
      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);
      await userEvent.keyboard('{Escape}');
      await flush(fixture);

      expect(document.activeElement).toBe(displayBtn(container));
    });

    it('no close button when closable is false', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        InplaceHostComponent,
      );
      componentInstance.closable.set(false);
      fixture.detectChanges();
      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);

      expect(
        container.querySelector('[data-testid="DynamoInplace-close"]'),
      ).toBeNull();
      // Escape still works as the exit path.
      await userEvent.keyboard('{Escape}');
      await flush(fixture);
      expect(componentInstance.active()).toBe(false);
    });
  });

  describe('two-way [(active)]', () => {
    it('honours an external write to active', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        InplaceHostComponent,
      );
      componentInstance.active.set(true);
      await flush(fixture);
      expect(editor(container)).toBeTruthy();

      componentInstance.active.set(false);
      await flush(fixture);
      expect(displayBtn(container)).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    it('emits only styleClass on the root when unstyled', () => {
      @Component({
        selector: 'dg-inplace-unstyled-host',
        standalone: true,
        imports: [DynamoInplace],
        template: `<dg-inplace [unstyled]="true" styleClass="mine">
          <span display>x</span><span editor>y</span>
        </dg-inplace>`,
      })
      class UnstyledHost {}

      const { container } = renderDynamoComponent(UnstyledHost);
      expect(
        (
          container.querySelector('[data-testid="DynamoInplace"]') as HTMLElement
        ).className,
      ).toBe('mine');
    });

    it('Escape while in display mode does nothing', async () => {
      const { container, fixture, componentInstance } = renderDynamoComponent(
        InplaceHostComponent,
      );
      (displayBtn(container) as HTMLElement).focus();
      await userEvent.keyboard('{Escape}');
      await flush(fixture);

      expect(componentInstance.active()).toBe(false);
      expect(editor(container)).toBeNull();
    });

  });

  describe('harness', () => {
    it('reports state and drives activate/deactivate', async () => {
      const { fixture } = renderDynamoComponent(InplaceHostComponent);
      const harness = await TestbedHarnessEnvironment.harnessForFixture(
        fixture,
        DynamoInplaceHarness,
      );

      expect(await harness.isActive()).toBe(false);
      expect(await harness.getDisplayText()).toBe('Hello');

      await harness.activate();
      await flush(fixture);
      expect(await harness.isActive()).toBe(true);

      await harness.deactivate();
      await flush(fixture);
      expect(await harness.isActive()).toBe(false);
    });
  });

  describe('accessibility', () => {
    it('has no axe violations in display mode', async () => {
      const { container } = renderDynamoComponent(InplaceHostComponent);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });

    it('has no axe violations in editor mode', async () => {
      const { container, fixture } = renderDynamoComponent(InplaceHostComponent);
      await userEvent.click(displayBtn(container) as HTMLElement);
      await flush(fixture);
      await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
    });
  });
});
