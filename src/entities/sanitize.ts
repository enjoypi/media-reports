export function sanitize(name: string, maxLength: number): string {
  return name
    .toLowerCase()
    .replace(/[<>\":\"/\\|?*\x00-\x1f]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}
