// No 'thumb' part: unlike Slider there's no separate visual handle — the
// whole dial is the drag surface. No angle-range type either: v1 hardcodes
// a full 360deg sweep (see knob.ts), so start/end angle isn't an input yet.
export type DynamoKnobPart = 'root' | 'track' | 'fill' | 'label';
