import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function run(args, stdin = '') {
  return new Promise((resolve) => {
    const child = spawn('node', ['src/cli.js', ...args], {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const chunks = [];
    let stderr = '';
    child.stdout.on('data', (d) => chunks.push(d));
    child.stderr.on('data', (d) => (stderr += d));
    if (stdin) {
      child.stdin.write(stdin);
    }
    child.stdin.end();
    child.on('close', (code) => {
      const buf = Buffer.concat(chunks);
      resolve({ stdout: buf.toString('utf8'), stdoutBuf: buf, stderr, exitCode: code ?? 1 });
    });
  });
}

describe('cli integration', () => {
  it('--help exits 0', async () => {
    const { stdout, exitCode } = await run(['--help']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('Convert Mermaid diagrams'));
  });

  it('--version exits 0', async () => {
    const { stdout, exitCode } = await run(['--version']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('1.0.0'));
  });

  it('--list-themes outputs all themes', async () => {
    const { stdout, exitCode } = await run(['--list-themes']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('tokyo-night'));
    assert.ok(stdout.includes('catppuccin'));
    assert.ok(stdout.includes('github-light'));
  });

  it('reads from stdin and outputs SVG', async () => {
    const { stdout, exitCode } = await run([], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);
    assert.ok(stdout.startsWith('<svg'));
    assert.ok(stdout.includes('</svg>'));
  });

  it('reads from file with -i', async () => {
    const { stdout, exitCode } = await run(['-i', 'test/fixtures/simple.mmd']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.startsWith('<svg'));
  });

  it('writes to file with -o', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const outPath = join(dir, 'out.svg');

    const { exitCode } = await run(['-o', outPath], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);

    const content = await readFile(outPath, 'utf8');
    assert.ok(content.startsWith('<svg'));

    await rm(dir, { recursive: true });
  });

  it('reads from file and writes to file', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const outPath = join(dir, 'out.svg');

    const { exitCode } = await run([
      '-i', 'test/fixtures/simple.mmd',
      '-o', outPath,
    ]);
    assert.equal(exitCode, 0);

    const content = await readFile(outPath, 'utf8');
    assert.ok(content.startsWith('<svg'));

    await rm(dir, { recursive: true });
  });

  it('-i - reads from stdin', async () => {
    const { stdout, exitCode } = await run(['-i', '-'], 'graph TD\n  X-->Y\n');
    assert.equal(exitCode, 0);
    assert.ok(stdout.startsWith('<svg'));
  });

  it('applies theme via -t', async () => {
    const { stdout, exitCode } = await run(['-t', 'github-light'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('#ffffff'));
  });

  it('applies custom bg color', async () => {
    const { stdout, exitCode } = await run(['--bg', '#123456'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('#123456'));
  });

  it('applies custom fg color', async () => {
    const { stdout, exitCode } = await run(['--fg', '#abcdef'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);
    assert.ok(stdout.includes('#abcdef'));
  });

  it('errors on unknown theme', async () => {
    const { stderr, exitCode } = await run(['-t', 'nope'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Unknown theme "nope"'));
  });

  it('errors on invalid color format', async () => {
    const { stderr, exitCode } = await run(['--bg', 'red'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Invalid color "red"'));
  });

  it('errors on missing input file', async () => {
    const { stderr, exitCode } = await run(['-i', 'nope.mmd']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('File not found'));
  });

  it('errors on invalid mermaid syntax', async () => {
    const { stderr, exitCode } = await run(['-i', 'test/fixtures/invalid.mmd']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Invalid mermaid syntax'));
  });

  it('errors on empty input file', async () => {
    const { stderr, exitCode } = await run(['-i', 'test/fixtures/empty.mmd']);
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('No Mermaid code provided'));
  });

  it('renders sequence diagram', async () => {
    const { stdout, exitCode } = await run(['-i', 'test/fixtures/sequence.mmd']);
    assert.equal(exitCode, 0);
    assert.ok(stdout.startsWith('<svg'));
  });

  it('errors on output to non-existent directory', async () => {
    const { stderr, exitCode } = await run(
      ['-o', '/nonexistent/dir/out.svg'],
      'graph TD\n  A-->B\n'
    );
    assert.equal(exitCode, 1);
    assert.ok(stderr.includes('Cannot write to'));
  });

  it('outputs PNG with --format png', async () => {
    const { stdoutBuf, exitCode } = await run(['--format', 'png'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);
    assert.equal(stdoutBuf[0], 0x89);
    assert.ok(stdoutBuf.subarray(1, 4).equals(Buffer.from('PNG')));
  });

  it('outputs JPG with --format jpg', async () => {
    const { stdoutBuf, exitCode } = await run(['--format', 'jpg'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);
    assert.equal(stdoutBuf[0], 0xff);
    assert.equal(stdoutBuf[1], 0xd8);
  });

  it('auto-detects PNG from -o extension', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const outPath = join(dir, 'out.png');

    const { exitCode } = await run(['-o', outPath], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);

    const content = await readFile(outPath);
    assert.equal(content[0], 0x89);
    assert.ok(content.slice(1, 4).equals(Buffer.from('PNG')));

    await rm(dir, { recursive: true });
  });

  it('auto-detects JPG from -o extension', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const outPath = join(dir, 'out.jpg');

    const { exitCode } = await run(['-o', outPath], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);

    const content = await readFile(outPath);
    assert.equal(content[0], 0xff);
    assert.equal(content[1], 0xd8);

    await rm(dir, { recursive: true });
  });

  it('auto-detects JPG from .jpeg extension', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const outPath = join(dir, 'out.jpeg');

    const { exitCode } = await run(['-o', outPath], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);

    const content = await readFile(outPath);
    assert.equal(content[0], 0xff);
    assert.equal(content[1], 0xd8);

    await rm(dir, { recursive: true });
  });

  it('writes PNG with --scale option', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const out1 = join(dir, 's1.png');
    const out2 = join(dir, 's3.png');

    await run(['-o', out1, '--scale', '1'], 'graph TD\n  A-->B\n');
    await run(['-o', out2, '--scale', '3'], 'graph TD\n  A-->B\n');

    const size1 = (await readFile(out1)).length;
    const size2 = (await readFile(out2)).length;
    assert.ok(size2 > size1, 'Higher scale should produce larger file');

    await rm(dir, { recursive: true });
  });

  it('writes JPG with --quality option', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const out1 = join(dir, 'q10.jpg');
    const out2 = join(dir, 'q95.jpg');

    await run(['-o', out1, '--quality', '10'], 'graph TD\n  A-->B\n');
    await run(['-o', out2, '--quality', '95'], 'graph TD\n  A-->B\n');

    const size1 = (await readFile(out1)).length;
    const size2 = (await readFile(out2)).length;
    assert.ok(size2 > size1, 'Higher quality should produce larger file');

    await rm(dir, { recursive: true });
  });

  it('still outputs SVG by default', async () => {
    const { stdout, exitCode } = await run([], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);
    assert.ok(stdout.startsWith('<svg'));
  });

  it('--format overrides auto-detected extension', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'bmm-test-'));
    const outPath = join(dir, 'out.svg');

    const { exitCode } = await run(['-o', outPath, '--format', 'png'], 'graph TD\n  A-->B\n');
    assert.equal(exitCode, 0);

    const content = await readFile(outPath);
    assert.equal(content[0], 0x89);
    assert.ok(content.slice(1, 4).equals(Buffer.from('PNG')));

    await rm(dir, { recursive: true });
  });
});
