/** Prefix runtime public assets for GitHub Pages project subdirectories. */
export function assetPath(path: string) {
  return `${import.meta.env.BASE_URL}${path.replace(/^\/+/, '')}`;
}
