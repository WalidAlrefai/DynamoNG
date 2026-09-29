import {
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import type { DynamoPassThroughAttrs } from '@dynamong/core/api';
import { beforeEach, describe, expect, it } from 'vitest';
import { DynamoPassThroughDirective } from './pass-through.directive';

@Component({
  selector: 'dg-test-pt-host',
  standalone: true,
  imports: [DynamoPassThroughDirective],
  template: `<span [dgPt]="attrs()" class="static-class"></span>`,
})
class TestPassThroughHostComponent {
  readonly attrs = signal<DynamoPassThroughAttrs | undefined>(undefined);
}

describe('DynamoPassThroughDirective', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
    });
  });

  it('sets a given attribute value on the host element', async () => {
    const { fixture, container } = await render(TestPassThroughHostComponent);
    fixture.componentInstance.attrs.set({ 'data-testid': 'my-span' });
    fixture.detectChanges();

    expect(container.querySelector('span')?.getAttribute('data-testid')).toBe(
      'my-span',
    );
  });

  it('stringifies a non-string value', async () => {
    const { fixture, container } = await render(TestPassThroughHostComponent);
    fixture.componentInstance.attrs.set({ 'aria-checked': true });
    fixture.detectChanges();

    expect(container.querySelector('span')?.getAttribute('aria-checked')).toBe(
      'true',
    );
  });

  it('removes a previously-set attribute when the object no longer includes it', async () => {
    const { fixture, container } = await render(TestPassThroughHostComponent);
    fixture.componentInstance.attrs.set({
      'data-testid': 'my-span',
      title: 'Hi',
    });
    fixture.detectChanges();
    expect(container.querySelector('span')?.hasAttribute('title')).toBe(true);

    fixture.componentInstance.attrs.set({ 'data-testid': 'my-span' });
    fixture.detectChanges();

    expect(container.querySelector('span')?.hasAttribute('title')).toBe(false);
    expect(container.querySelector('span')?.getAttribute('data-testid')).toBe(
      'my-span',
    );
  });

  it('never sets a "class" attribute, even when class is present in the object', async () => {
    const { fixture, container } = await render(TestPassThroughHostComponent);
    fixture.componentInstance.attrs.set({ class: 'injected-class' });
    fixture.detectChanges();

    const span = container.querySelector('span');
    expect(span?.className).toBe('static-class');
    expect(span?.className).not.toContain('injected-class');
  });

  it('does not throw and applies no attributes when dgPt is unset', async () => {
    const { container } = await render(TestPassThroughHostComponent);

    const span = container.querySelector('span');
    expect(span?.attributes.length).toBe(1); // just the static "class"
  });
});
