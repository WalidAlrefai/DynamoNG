# @dynamong/utils/styles

Secondary entry point of `@dynamong/utils`. Import from `@dynamong/utils/styles`.

Shared style recipes — reusable `class-variance-authority` variant fragments and
class-string constants — so cross-component conventions (the control-size scale,
the focus ring, section headings, overlay-panel chrome) live in one place instead
of being copy-pasted into every component's `*.styles.ts`.

Zero runtime dependencies; every export is a plain string or a frozen object.
