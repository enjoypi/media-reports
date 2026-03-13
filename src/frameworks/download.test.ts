/**
 * @module frameworks/download.test
 * @description download 命令单元测试
 */

import { describe, it, expect } from 'vitest';
import { sanitize } from '../entities/sanitize.js';

// 测试 sanitize 函数在目录名和文件名中的一致性
describe('sanitize', () => {
  it('should convert to lowercase', () => {
    expect(sanitize('Hello World', 100)).toBe('hello-world');
  });

  it('should replace special characters with hyphen', () => {
    expect(sanitize('a:b|c*d?', 100)).toBe('a-b-c-d');
  });

  it('should collapse multiple hyphens', () => {
    expect(sanitize('hello   world', 100)).toBe('hello-world');
  });

  it('should trim leading and trailing hyphens', () => {
    expect(sanitize('-hello-world-', 100)).toBe('hello-world');
  });

  it('should handle course names with numbers and special chars', () => {
    const courseName = 'Supervised Machine Learning: Regression & Classification';
    expect(sanitize(courseName, 200)).toBe('supervised-machine-learning-regression-classification');
  });

  it('should respect max length', () => {
    const longName = 'a'.repeat(300);
    expect(sanitize(longName, 200)).toHaveLength(200);
  });
});

// 测试目录名生成逻辑
describe('directory naming', () => {
  it('should generate consistent names for spec and course', () => {
    const specName = 'Machine Learning Specialization';
    const courseName = 'Supervised Machine Learning: Regression & Classification';
    const index = 1;

    const safeSpecName = sanitize(specName, 200);
    const safeCourseName = sanitize(courseName, 200);
    const dirName = `${String(index).padStart(2, '0')}-${safeCourseName}`;

    expect(safeSpecName).toBe('machine-learning-specialization');
    expect(safeCourseName).toBe('supervised-machine-learning-regression-classification');
    expect(dirName).toBe('01-supervised-machine-learning-regression-classification');
  });
});

// 测试 extractSiteName 逻辑
describe('extractSiteName', () => {
  it('should extract site name from URL', () => {
    const extractSiteName = (url: string): string => {
      try {
        const hostname = new URL(url).hostname;
        return hostname.replace(/^www\./, '') || 'unknown';
      } catch {
        return 'unknown';
      }
    };

    expect(extractSiteName('https://www.coursera.org/learn/test')).toBe('coursera.org');
    expect(extractSiteName('https://coursera.org/learn/test')).toBe('coursera.org');
    expect(extractSiteName('invalid-url')).toBe('unknown');
  });
});
