import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parse } from 'yaml';
import { appConfigSchema } from './config.js';

describe('appConfigSchema', () => {
  it('should validate project config.yaml successfully', () => {
    const raw = readFileSync(join(process.cwd(), 'config.yaml'), 'utf-8');
    const parsed = parse(raw);
    const result = appConfigSchema.safeParse(parsed);
    expect(result.success).toBe(true);
  });

  it('should reject empty object', () => {
    const result = appConfigSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('should reject config missing nested section', () => {
    const raw = readFileSync(join(process.cwd(), 'config.yaml'), 'utf-8');
    const parsed = parse(raw);
    delete parsed.llm;
    const result = appConfigSchema.safeParse(parsed);
    expect(result.success).toBe(false);
  });

  it('should reject config with wrong type', () => {
    const raw = readFileSync(join(process.cwd(), 'config.yaml'), 'utf-8');
    const parsed = parse(raw);
    parsed.concurrency = 'not-a-number';
    const result = appConfigSchema.safeParse(parsed);
    expect(result.success).toBe(false);
  });
});
