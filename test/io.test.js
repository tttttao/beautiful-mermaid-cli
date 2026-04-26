import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readInput, writeOutput } from '../src/io.js';
import { readFile, unlink, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

describe('io', () => {
  describe('readInput', () => {
    it('reads an existing file', async () => {
      const content = await readInput('test/fixtures/simple.mmd');
      assert.ok(content.includes('graph TD'));
      assert.ok(content.includes('A-->B'));
    });

    it('throws on missing file', async () => {
      await assert.rejects(
        () => readInput('test/fixtures/nonexistent.mmd'),
        { message: /File not found/ }
      );
    });

    it('throws on directory path', async () => {
      await assert.rejects(
        () => readInput('test/fixtures'),
        { message: /Cannot read file/ }
      );
    });
  });

  describe('writeOutput', () => {
    it('writes content to a new file', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
      const filePath = join(dir, 'output.svg');
      const content = '<svg>test</svg>';

      await writeOutput(filePath, content);
      const written = await readFile(filePath, 'utf8');
      assert.equal(written, content);

      await rm(dir, { recursive: true });
    });

    it('overwrites existing file', async () => {
      const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
      const filePath = join(dir, 'output.svg');

      await writeOutput(filePath, 'first');
      await writeOutput(filePath, 'second');
      const written = await readFile(filePath, 'utf8');
      assert.equal(written, 'second');

      await rm(dir, { recursive: true });
    });

    it('throws on non-existent parent directory', async () => {
      await assert.rejects(
        () => writeOutput('/nonexistent/dir/output.svg', 'test'),
        { message: /Cannot write to/ }
      );
    });
  });
});
