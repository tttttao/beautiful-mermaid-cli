#!/usr/bin/env node
import { Command } from 'commander';
import { resolveTheme, listThemes } from './theme.js';
import { readStdin, readInput, writeOutput } from './io.js';
import { render } from './render.js';

const program = new Command();

program
  .name('bmm')
  .description('Convert Mermaid diagrams to beautiful themed SVGs')
  .version('1.0.0')
  .option('-i, --input <file>', 'Input Mermaid file path')
  .option('-o, --output <file>', 'Output SVG file path')
  .option('-t, --theme <name>', 'Preset theme name', 'tokyo-night')
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

    if (opts.output) {
      await writeOutput(opts.output, svg);
    } else {
      await new Promise((resolve, reject) => {
        process.stdout.write(svg, (err) => err ? reject(err) : resolve());
      });
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
