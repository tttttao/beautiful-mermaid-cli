#!/usr/bin/env node
import { extname } from 'node:path';
import { Command } from 'commander';
import { resolveTheme, listThemes } from './theme.js';
import { readStdin, readInput, writeOutput } from './io.js';
import { render } from './render.js';
import { convert } from './convert.js';

const EXT_FORMAT = { '.svg': 'svg', '.png': 'png', '.jpg': 'jpg', '.jpeg': 'jpg' };

function detectFormat(output, formatFlag) {
  if (formatFlag) return formatFlag;
  if (output) {
    const ext = extname(output).toLowerCase();
    if (EXT_FORMAT[ext]) return EXT_FORMAT[ext];
  }
  return 'svg';
}

const program = new Command();

program
  .name('bmm')
  .description('Convert Mermaid diagrams to beautiful themed SVGs, PNGs, or JPGs')
  .version('1.0.0')
  .option('-i, --input <file>', 'Input Mermaid file path')
  .option('-o, --output <file>', 'Output file path')
  .option('-t, --theme <name>', 'Preset theme name', 'tokyo-night')
  .option('--format <type>', 'Output format: svg, png, jpg (auto-detected from -o extension)')
  .option('--scale <number>', 'Scale factor for png/jpg (default: 2)', parseFloat)
  .option('--quality <1-100>', 'JPG quality, 1-100 (default: 90)', Number)
  .option('--bg <color>', 'Custom background color (hex #rrggbb)')
  .option('--fg <color>', 'Custom foreground color (hex #rrggbb)')
  .option('--list-themes', 'List all preset themes')
  .action(async (opts) => {
    if (opts.listThemes) {
      console.log(listThemes());
      return;
    }

    let code;
    if (opts.input) {
      if (opts.input === '-') {
        code = await readStdin();
      } else {
        code = await readInput(opts.input);
      }
    } else if (!process.stdin.isTTY) {
      code = await readStdin();
    } else {
      program.help();
    }

    const theme = resolveTheme({ theme: opts.theme, bg: opts.bg, fg: opts.fg });
    const svg = render(code, theme);
    const format = detectFormat(opts.output, opts.format);

    if (format === 'svg') {
      if (opts.output) {
        await writeOutput(opts.output, svg);
      } else {
        await new Promise((resolve, reject) => {
          process.stdout.write(svg, (err) => err ? reject(err) : resolve());
        });
      }
    } else {
      const buffer = await convert(svg, format, {
        scale: opts.scale,
        quality: opts.quality,
      });
      if (opts.output) {
        await writeOutput(opts.output, buffer);
      } else {
        await new Promise((resolve, reject) => {
          process.stdout.write(buffer, (err) => err ? reject(err) : resolve());
        });
      }
    }
  });

program.exitOverride();

try {
  await program.parseAsync();
  process.exit(0);
} catch (e) {
  if (e.code === 'commander.help' || e.code === 'commander.version' || e.code === 'commander.helpDisplayed') {
    process.exit(0);
  }
  process.stderr.write(`Error: ${e.message}\n`);
  process.exit(1);
}
