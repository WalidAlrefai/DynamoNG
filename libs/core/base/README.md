# @dynamong/core/base

Secondary entry point of `@dynamong/core`. It can be used by importing from `@dynamong/core/base`.

Exports `DynamoBaseComponent` (the `styleClass`/`pt`/`unstyled` inputs every DynamoNG component
shares) and `DynamoPassThroughDirective` (`[dgPt]`) — the general-purpose half of the `pt` escape
hatch, applying arbitrary non-`class` attributes from a `DynamoPassThroughAttrs` object onto its host
element. A component wires it in per named part it wants to expose, e.g.
`<button [dgPt]="ptFor('root')">`, and merges `ptFor(part).class` into its own `cn(...)`-computed
classes separately.
