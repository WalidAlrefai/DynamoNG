/**
 * The shared semantic-color vocabulary used across every DynamoNG component that
 * exposes a `severity` input (buttons, messages, badges, ...). Kept as a single
 * union so every component's `.styles.ts` maps the same set of names onto tokens.
 */
export type DynamoSeverity = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'danger';

export type DynamoSize = 'sm' | 'md' | 'lg';
