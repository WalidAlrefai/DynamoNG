import axe from 'axe-core';

/**
 * Runs axe-core against `element` and throws with a readable summary of any
 * accessibility violations found. Intended for use in every component's
 * "accessibility" describe block (see the DynamoNG testing checklist).
 */
export async function expectNoA11yViolations(element: Element): Promise<void> {
  const results = await axe.run(element);

  if (results.violations.length === 0) {
    return;
  }

  const summary = results.violations
    .map((violation) => {
      const targets = violation.nodes.map((node) => node.target.join(' ')).join(', ');
      return `- [${violation.impact ?? 'unknown'}] ${violation.id}: ${violation.help} (${targets})`;
    })
    .join('\n');

  throw new Error(`Found ${results.violations.length} accessibility violation(s):\n${summary}`);
}
