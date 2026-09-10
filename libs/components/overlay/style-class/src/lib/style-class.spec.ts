import { Component } from '@angular/core';
import { expectNoA11yViolations, renderDynamoComponent } from '@dynamong/testing';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { DynamoStyleClass } from './style-class';

@Component({
  selector: 'dg-style-class-host',
  standalone: true,
  imports: [DynamoStyleClass],
  template: `
    <button
      type="button"
      dgStyleClass="#panel"
      toggleClass="hidden"
      data-testid="toggle-btn"
    >
      Toggle
    </button>
    <button
      type="button"
      dgStyleClass="@next"
      enterClass="is-open"
      leaveClass="is-closed"
      data-testid="enter-btn"
    >
      Enter/Leave
    </button>
    <div data-testid="sibling">sibling</div>
    <div id="panel" data-testid="panel">panel content</div>
  `,
})
class StyleClassHostComponent {}

@Component({
  selector: 'dg-style-class-outside-host',
  standalone: true,
  imports: [DynamoStyleClass],
  template: `
    <button
      type="button"
      dgStyleClass="#p2"
      toggleClass="open"
      [hideOnOutsideClick]="true"
      data-testid="btn"
    >
      Open
    </button>
    <div id="p2" data-testid="p2">panel</div>
    <div data-testid="elsewhere">elsewhere</div>
  `,
})
class OutsideClickHostComponent {}

describe('DynamoStyleClass', () => {
  it('toggleClass: toggles the class on the CSS-selected target across clicks', async () => {
    const { container } = renderDynamoComponent(StyleClassHostComponent);
    const btn = within(container).getByTestId('toggle-btn');
    const panel = within(container).getByTestId('panel');

    await userEvent.click(btn);
    expect(panel.classList.contains('hidden')).toBe(true);
    await userEvent.click(btn);
    expect(panel.classList.contains('hidden')).toBe(false);
  });

  it('enterClass/leaveClass: swaps them on alternating clicks; @next resolves the sibling', async () => {
    const { container } = renderDynamoComponent(StyleClassHostComponent);
    const btn = within(container).getByTestId('enter-btn');
    const sibling = within(container).getByTestId('sibling');

    await userEvent.click(btn);
    expect(sibling.classList.contains('is-open')).toBe(true);
    expect(sibling.classList.contains('is-closed')).toBe(false);

    await userEvent.click(btn);
    expect(sibling.classList.contains('is-open')).toBe(false);
    expect(sibling.classList.contains('is-closed')).toBe(true);
  });

  it('hideOnOutsideClick: a click outside the host and target hides it', async () => {
    const { container } = renderDynamoComponent(OutsideClickHostComponent);
    const btn = within(container).getByTestId('btn');
    const panel = within(container).getByTestId('p2');

    await userEvent.click(btn);
    expect(panel.classList.contains('open')).toBe(true);

    // let the deferred document listener attach
    await new Promise((r) => setTimeout(r, 0));
    await userEvent.click(within(container).getByTestId('elsewhere'));
    expect(panel.classList.contains('open')).toBe(false);
  });

  it('hideOnOutsideClick: a click on the target itself does not hide it', async () => {
    const { container } = renderDynamoComponent(OutsideClickHostComponent);
    const btn = within(container).getByTestId('btn');
    const panel = within(container).getByTestId('p2');

    await userEvent.click(btn);
    await new Promise((r) => setTimeout(r, 0));
    await userEvent.click(panel);
    expect(panel.classList.contains('open')).toBe(true);
  });

  it('resolves the relative keywords @prev / @parent / @grandparent', async () => {
    @Component({
      selector: 'dg-sc-kw-host',
      standalone: true,
      imports: [DynamoStyleClass],
      template: `
        <div data-testid="grandparent">
          <div data-testid="parent">
            <span data-testid="prev">prev</span>
            <button type="button" dgStyleClass="@prev" toggleClass="a" data-testid="p">p</button>
            <button type="button" dgStyleClass="@parent" toggleClass="b" data-testid="par">par</button>
            <button type="button" dgStyleClass="@grandparent" toggleClass="c" data-testid="gp">gp</button>
          </div>
        </div>
      `,
    })
    class KwHost {}

    const { container } = renderDynamoComponent(KwHost);
    await userEvent.click(within(container).getByTestId('p'));
    expect(within(container).getByTestId('prev').classList.contains('a')).toBe(true);
    await userEvent.click(within(container).getByTestId('par'));
    expect(within(container).getByTestId('parent').classList.contains('b')).toBe(true);
    await userEvent.click(within(container).getByTestId('gp'));
    expect(
      within(container).getByTestId('grandparent').classList.contains('c'),
    ).toBe(true);
  });

  it('is a no-op when the target selector matches nothing', async () => {
    @Component({
      selector: 'dg-sc-miss-host',
      standalone: true,
      imports: [DynamoStyleClass],
      template: `<button type="button" dgStyleClass="#nope" toggleClass="x" data-testid="b">b</button>`,
    })
    class MissHost {}

    const { container } = renderDynamoComponent(MissHost);
    await expect(
      userEvent.click(within(container).getByTestId('b')),
    ).resolves.not.toThrow();
  });

  it('hideOnOutsideClick works with enterClass/leaveClass too', async () => {
    @Component({
      selector: 'dg-sc-el-outside-host',
      standalone: true,
      imports: [DynamoStyleClass],
      template: `
        <button
          type="button"
          dgStyleClass="#p3"
          enterClass="shown"
          leaveClass="gone"
          [hideOnOutsideClick]="true"
          data-testid="b"
        >b</button>
        <div id="p3" data-testid="p3">panel</div>
        <div data-testid="away">away</div>
      `,
    })
    class ElOutsideHost {}

    const { container } = renderDynamoComponent(ElOutsideHost);
    const panel = within(container).getByTestId('p3');

    await userEvent.click(within(container).getByTestId('b'));
    expect(panel.classList.contains('shown')).toBe(true);

    await new Promise((r) => setTimeout(r, 0));
    await userEvent.click(within(container).getByTestId('away'));
    expect(panel.classList.contains('shown')).toBe(false);
    expect(panel.classList.contains('gone')).toBe(true);
  });

  it('has no axe violations', async () => {
    const { container } = renderDynamoComponent(StyleClassHostComponent);
    await expect(expectNoA11yViolations(container)).resolves.toBeUndefined();
  });
});
