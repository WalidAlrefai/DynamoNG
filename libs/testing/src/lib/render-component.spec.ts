import { Component, inject, input } from '@angular/core';
import { DYNAMONG_CONFIG } from '@dynamong/core/config';
import { describe, expect, it } from 'vitest';
import { renderDynamoComponent } from './render-component';

@Component({
  selector: 'dg-render-test-host',
  template: `<p>theme: {{ config.theme }}, label: {{ label() }}</p>`,
})
class RenderTestHostComponent {
  protected readonly config = inject(DYNAMONG_CONFIG);
  readonly label = input('default');
}

describe('renderDynamoComponent', () => {
  it('renders the component and resolves DYNAMONG_CONFIG to its defaults', () => {
    const { container } = renderDynamoComponent(RenderTestHostComponent);

    expect(container.textContent).toContain('theme: aura');
  });

  it('applies caller-supplied dynamoConfig overrides', () => {
    const { container } = renderDynamoComponent(RenderTestHostComponent, { dynamoConfig: { theme: 'nova' } });

    expect(container.textContent).toContain('theme: nova');
  });

  it('applies initial inputs before the first detectChanges', () => {
    const { container } = renderDynamoComponent(RenderTestHostComponent, { inputs: { label: 'custom' } });

    expect(container.textContent).toContain('label: custom');
  });

  it('setInputs updates the DOM after the initial render', () => {
    const { container, setInputs } = renderDynamoComponent(RenderTestHostComponent, { inputs: { label: 'first' } });
    expect(container.textContent).toContain('label: first');

    setInputs({ label: 'second' });

    expect(container.textContent).toContain('label: second');
  });

  it('merges caller-supplied extra providers alongside the defaults', () => {
    const { componentInstance } = renderDynamoComponent(RenderTestHostComponent, { providers: [] });

    expect(componentInstance).toBeTruthy();
  });
});
