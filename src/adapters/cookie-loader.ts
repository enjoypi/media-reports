import { readFileSync, existsSync } from 'node:fs';
import { CookieJar, Cookie } from 'tough-cookie';
import { info, warn } from './logger.js';

const NETSCAPE_COOKIE_FIELDS = 7;
const HTTP_ONLY_PREFIX = '#HttpOnly_';

export function loadCookies(filePath: string): CookieJar | null {
  if (!existsSync(filePath)) return null;

  info(`加载 Cookie: ${filePath}`);
  const jar = new CookieJar();
  const lines = readFileSync(filePath, 'utf-8').split('\n');

  for (const line of lines) {
    let trimmed = line.trim();
    if (!trimmed || (trimmed.startsWith('#') && !trimmed.startsWith(HTTP_ONLY_PREFIX))) continue;
    if (trimmed.startsWith(HTTP_ONLY_PREFIX)) trimmed = trimmed.slice(HTTP_ONLY_PREFIX.length);

    const parts = trimmed.split('\t');
    if (parts.length < NETSCAPE_COOKIE_FIELDS) continue;

    const [domain, , path, secure, , name, value] = parts;
    const isSecure = secure === 'TRUE';
    try {
      const cookie = new Cookie({
        key: name,
        value,
        domain: domain.startsWith('.') ? domain : `.${domain}`,
        path,
        secure: isSecure,
        httpOnly: true,
      });
      const url = `http${isSecure ? 's' : ''}://${domain.replace(/^\./, '')}${path}`;
      jar.setCookieSync(cookie.toString(), url);
    } catch {
      warn(`跳过无效 Cookie 行: ${name}`);
    }
  }

  return jar;
}
