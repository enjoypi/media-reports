import type { SanitizeConfig } from './config.js';

export function sanitize(name: string, maxLength: number, config: SanitizeConfig): string {
  return name
    .toLowerCase()
    .replace(new RegExp(config.invalid_chars_pattern, 'g'), config.replacement_char)
    .replace(new RegExp(config.whitespace_pattern, 'g'), config.replacement_char)
    .replace(new RegExp(config.multiple_dash_pattern, 'g'), config.replacement_char)
    .replace(new RegExp(config.leading_trailing_dash_pattern, 'g'), '')
    .slice(0, maxLength);
}
