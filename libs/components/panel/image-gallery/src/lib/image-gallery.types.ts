export type DynamoImageGalleryPart =
  | 'root'
  | 'viewport'
  | 'mainImage'
  | 'arrow'
  | 'thumbnails'
  | 'thumbnail'
  | 'lightbox'
  | 'lightboxImage'
  | 'lightboxCloseButton';

export type DynamoImageGalleryAspectRatio = 'square' | 'video' | 'wide';

export interface DynamoGalleryImage {
  /** The full-size image, shown in the main viewport and the lightbox. */
  src: string;
  /** A smaller image for the thumbnail strip. Falls back to `src` when omitted. */
  thumbnailSrc?: string;
  alt: string;
  /** Optional caption shown under the lightbox's large image. */
  caption?: string;
}
