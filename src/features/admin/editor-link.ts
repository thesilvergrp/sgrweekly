/** Deep link into a specific panel of the content editor. */
export function editorHref(panel: string): string {
  return `/?admin&panel=${encodeURIComponent(panel)}`;
}
