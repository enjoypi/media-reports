/**
 * @module services/specialization-parser
 * @description 解析 Coursera Specialization，返回有序课程列表
 * @depends lib/http-client
 */

import { httpGet } from '../lib/http-client.js';
import { COURSERA_API_BASE as BASE } from '../lib/constants.js';

export interface SpecializationInfo {
  name: string;
  slug: string;
  courses: { index: number; slug: string; name: string }[];
}

export function extractSpecSlug(url: string): string | null {
  const match = url.match(/coursera\.org\/specializations\/([^/?#]+)/);
  return match ? match[1] : null;
}

export async function parseSpecialization(
  slug: string,
  timeout: number,
  userAgent: string,
): Promise<SpecializationInfo | null> {
  const specUrl = `${BASE}/api/onDemandSpecializations.v1?q=slug&slug=${slug}&fields=courseIds,name`;
  const specRes = await httpGet(specUrl, timeout, userAgent);
  if (specRes.status !== 200) return null;

  let specData: { elements?: { name: string; courseIds: string[] }[] };
  try { specData = JSON.parse(specRes.body); } catch { return null; }

  const spec = specData.elements?.[0];
  if (!spec?.courseIds?.length) return null;

  const coursesUrl = `${BASE}/api/courses.v1?ids=${spec.courseIds.join(',')}&fields=slug,name`;
  const coursesRes = await httpGet(coursesUrl, timeout, userAgent);
  if (coursesRes.status !== 200) return null;

  let coursesData: { elements?: { id: string; slug: string; name: string }[] };
  try { coursesData = JSON.parse(coursesRes.body); } catch { return null; }

  const courseMap = new Map(
    (coursesData.elements ?? []).map((c) => [c.id, { slug: c.slug, name: c.name.trim() }]),
  );

  const courses = spec.courseIds
    .map((id, idx) => {
      const c = courseMap.get(id);
      return c ? { index: idx + 1, slug: c.slug, name: c.name } : null;
    })
    .filter((c): c is NonNullable<typeof c> => c !== null);

  return { name: spec.name.trim(), slug, courses };
}
