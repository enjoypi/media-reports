/**
 * @module adapters/node-file-system
 * @description Node.js 文件系统实现
 * @layer Adapters
 */

import { existsSync, writeFileSync, readFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { FileSystem } from '../usecases/ports.js';

export class NodeFileSystem implements FileSystem {
  exists(path: string): boolean {
    return existsSync(path);
  }

  write(path: string, content: string): void {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, content, 'utf-8');
  }

  read(path: string): string {
    return readFileSync(path, 'utf-8');
  }
}
