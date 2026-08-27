import type { DynamoSeverity } from '@dynamong/core/api';
import type { DynamoPasswordStrength, DynamoPasswordStrengthLabel } from './password.types';

// Score 0-4: 1 point per length threshold crossed (>=8, >=12) + up to 2 points
// for character-class variety (lower/upper/digit/symbol), capped at 4. This is
// intentionally crude (no dictionary/pattern checks) — a rough visual nudge,
// not a security control.
export function calculatePasswordStrength(value: string): DynamoPasswordStrength {
  if (!value) {
    return { score: 0, percent: 0, label: 'weak', severity: 'danger' };
  }

  let score = 0;
  if (value.length >= 8) score++;
  if (value.length >= 12) score++;

  const classes = [/[a-z]/, /[A-Z]/, /[0-9]/, /[^a-zA-Z0-9]/].filter((re) =>
    re.test(value),
  ).length;
  score += Math.min(2, Math.max(0, classes - 1));
  score = Math.min(4, score);

  const percent = (score / 4) * 100;
  const label: DynamoPasswordStrengthLabel =
    score <= 1 ? 'weak' : score <= 2 ? 'medium' : 'strong';
  const severity: DynamoSeverity =
    label === 'weak' ? 'danger' : label === 'medium' ? 'warning' : 'success';

  return { score, percent, label, severity };
}
