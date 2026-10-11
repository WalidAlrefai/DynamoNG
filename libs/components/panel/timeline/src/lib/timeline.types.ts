export type DynamoTimelinePart = 'root';
export type DynamoTimelineOrientation = 'vertical' | 'horizontal';
// 'left'/'top' are the same underlying (non-reversed) state, and
// 'right'/'bottom' are the same underlying (reversed) state — spelled
// per-orientation for a template author's own clarity, not independent
// values. See timeline.ts's own doc comment for the full reasoning.
export type DynamoTimelineAlign =
  'left' | 'right' | 'top' | 'bottom' | 'alternate';

export type DynamoTimelineItemPart =
  'root' | 'marker' | 'connector' | 'content';
