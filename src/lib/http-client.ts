import { CookieJar } from 'tough-cookie';
import { HttpError } from './retry.js';

let cookieJar: CookieJar | null = null;

export function setCookieJar(jar: CookieJar): void {
  cookieJar = jar;
}

export function throwOnAuthError(status: number): void {
  if (status === 401) throw new HttpError(401, 'Cookie 无效或已过期');
  if (status === 403) throw new HttpError(403, '无权访问（未 Enroll 或需要付费）');
}

export async function httpGet(
  url: string,
  timeout: number,
  userAgent: string,
): Promise<{ status: number; body: string }> {
  const headers: Record<string, string> = { 'User-Agent': userAgent };

  if (cookieJar) {
    const cookieStr = await cookieJar.getCookieString(url);
    if (cookieStr) headers['Cookie'] = cookieStr;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout * 1000);

  try {
    const res = await fetch(url, { headers, signal: controller.signal, redirect: 'follow' });
    const body = await res.text();
    return { status: res.status, body };
  } finally {
    clearTimeout(timer);
  }
}
