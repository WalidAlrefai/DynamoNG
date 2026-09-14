import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';
import { DynamoBaseComponent } from '@dynamong/core/base';
import type { DynamoSize } from '@dynamong/core/api';
import { cn } from '@dynamong/utils/class-merge';
import { avatarRootStyles } from './avatar.styles';
import type { DynamoAvatarPart, DynamoAvatarShape } from './avatar.types';

/**
 * Derives initials from a display name: first + last token's first
 * character for multi-word names, first two characters (or one, if the
 * name is a single character) for a single-word name. Returns `null` for an
 * empty/whitespace-only name so callers can fall through to the icon
 * fallback tier.
 */
function deriveInitials(name: string): string | null {
  const tokens = name.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) {
    return null;
  }
  if (tokens.length === 1) {
    const token = tokens[0] ?? '';
    return (token.length >= 2 ? token.slice(0, 2) : token).toUpperCase();
  }
  const first = tokens[0]?.charAt(0) ?? '';
  const last = tokens[tokens.length - 1]?.charAt(0) ?? '';
  return (first + last).toUpperCase();
}

@Component({
  selector: 'dg-avatar',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './avatar.html',
})
export class DynamoAvatar extends DynamoBaseComponent<DynamoAvatarPart> {
  readonly src = input<string | undefined>(undefined);
  /** Drives derived initials and the default alt text when `alt` is unset. */
  readonly name = input<string | undefined>(undefined);
  /**
   * A literal override rendered instead of `name`-derived initials — for
   * content the initials heuristic can't produce (a status glyph, an
   * emoji, "+3", ...). Still ranks below `src`: an image, once loaded,
   * always wins. Sits alongside `name` rather than replacing it.
   */
  readonly label = input<string | undefined>(undefined);
  /** Overrides the derived alt text (`name`, or `'Avatar'` if neither is set). */
  readonly alt = input<string | undefined>(undefined);
  readonly ariaLabelledBy = input<string | undefined>(undefined);
  readonly size = input<DynamoSize>('md');
  /** `'circle'` (default, today's only look) or `'square'`. */
  readonly shape = input<DynamoAvatarShape>('circle');
  /** Fires when `src` fails to load — the component already falls back to `label`/initials/icon on its own; this is for a consumer that also wants to react (e.g. logging, retrying with a different URL). */
  readonly imageError = output<Event>();

  private readonly imageFailed = signal(false);

  protected readonly initials = computed(() => {
    const name = this.name();
    return name ? deriveInitials(name) : null;
  });
  protected readonly showImage = computed(
    () => !!this.src() && !this.imageFailed(),
  );
  /** Fallback priority once there's no showable image: a literal `label` override, then `name`-derived initials, then the projected/default icon. */
  protected readonly displayLabel = computed(
    () => this.label() ?? this.initials(),
  );
  protected readonly altText = computed(
    () => this.alt() ?? this.name() ?? 'Avatar',
  );

  protected readonly rootClasses = computed(() =>
    this.unstyled()
      ? this.styleClass()
      : cn(
          avatarRootStyles({ size: this.size(), shape: this.shape() }),
          this.styleClass(),
        ),
  );

  protected onImageError(event: Event): void {
    this.imageFailed.set(true);
    this.imageError.emit(event);
  }
}
