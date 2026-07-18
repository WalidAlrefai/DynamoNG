/** Extra DOM attributes/classes a consumer can inject onto one internal "part" of a component. */
export type DynamoPassThroughAttrs = Record<string, unknown> & { class?: string };

/**
 * Maps each named internal part of a component (e.g. `'root' | 'label' | 'icon'`) to the
 * extra attributes/classes that should be merged onto it. This is DynamoNG's passthrough
 * API: an escape hatch for DOM-level customization that doesn't require overriding the
 * component's template.
 */
export type DynamoPassThrough<Part extends string> = Partial<Record<Part, DynamoPassThroughAttrs>>;
