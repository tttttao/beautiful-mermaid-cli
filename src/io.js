import { readFile, writeFile } from 'node:fs/promises';

export function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', chunk => chunks.push(chunk));
    process.stdin.on('end', () => resolve(chunks.join('')));
    process.stdin.on('error', reject);
  });
}

export async function readInput(filePath) {
  try {
    return await readFile(filePath, 'utf8');
  } catch (e) {
    if (e.code === 'ENOENT') {
      throw new Error(`File not found: ${filePath}`);
    }
    throw new Error(`Cannot read file ${filePath}: ${e.message}`);
  }
}

export async function writeOutput(filePath, content) {
  try {
    await writeFile(filePath, content);
  } catch (e) {
    throw new Error(`Cannot write to ${filePath}: ${e.message}`);
  }
}
