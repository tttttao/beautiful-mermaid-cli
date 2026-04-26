# beautiful-mermaid-cli Design

CLI tool that converts Mermaid diagram code to themed SVG output, built on top of the `beautiful-mermaid` library.

## Core Use Case

Pipe Mermaid code in, get themed SVG out. Designed for skill/automation integration via stdin/stdout.

```bash
echo 'graph TD\n  A-->B' | bmm > diagram.svg
```

## CLI Interface

```
bmm [options]

Options:
  -i, --input <file>      Input Mermaid file path
  -o, --output <file>     Output SVG file path (default: stdout)
  -t, --theme <name>      Preset theme name (default: tokyo-night)
  --bg <color>            Custom background color (hex only), overrides theme bg
  --fg <color>            Custom foreground color (hex only), overrides theme fg
  --list-themes           List all preset themes
  -h, --help              Help
  -V, --version           Version
```

### Input Modes

Priority order (first wins):

1. **stdin pipe**: `echo 'graph TD...' | bmm` — detected by `process.stdin.isTTY === false` or `-i -`
2. **file path**: `bmm -i diagram.mmd` — reads file via `fs.readFile`
3. **no input**: if no stdin data and no `-i`, print help and exit 0

When stdin has data AND `-i` is specified, `-i` takes priority (explicit argument over implicit pipe). This avoids silent data loss from accidental pipe attachment.

### Output

- Default: SVG string to stdout
- With `-o`: write SVG to file (parent directory must exist, existing file overwritten)
- Errors to stderr (exit code 1), SVG to stdout (exit code 0)

## Error Contract

All errors go to stderr with prefix `Error: `, exit code 1.

| Scenario | stderr message | Exit code |
|----------|---------------|-----------|
| No input provided | prints help | 0 |
| Input file not found | `Error: File not found: <path>` | 1 |
| Invalid theme name | `Error: Unknown theme "<name>". Available: tokyo-night, catppuccin, ...` | 1 |
| Invalid color format | `Error: Invalid color "<value>". Expected hex format: #rrggbb` | 1 |
| Mermaid syntax error | `Error: Invalid mermaid syntax: <library message>` | 1 |
| Render failure | `Error: Render failed: <library message>` | 1 |
| Output write failure | `Error: Cannot write to <path>: <system message>` | 1 |

## Theming

### Dual-Color Theme System (v1 scope)

v1 uses only `bg` and `fg` colors. The `beautiful-mermaid` library outputs SVG with CSS `color-mix()` to auto-derive element colors (lines, borders, surfaces) from these two base colors. This happens in the **SVG stylesheet layer** — the SVG viewer/renderer (browser, VS Code, etc.) interprets `color-mix()`. No server-side computation needed.

Enrichment colors (`line`, `accent`, `muted`, `surface`, `border`) are **not exposed** in v1 CLI to keep the interface minimal. May be added in future versions.

### Preset Themes

Six built-in themes:

| Name | Style | bg | fg |
|------|-------|----|----|
| `tokyo-night` | Dark, blue-purple | `#1a1b26` | `#a9b1d6` |
| `catppuccin` | Dark, soft pastel | `#1e1e2e` | `#cdd6f4` |
| `nord` | Dark, cool blue | `#2e3440` | `#d8dee9` |
| `solarized-dark` | Dark, warm yellow | `#002b36` | `#839496` |
| `solarized-light` | Light, warm tones | `#fdf6e3` | `#657b83` |
| `github-light` | Light, clean | `#ffffff` | `#24292f` |

### Custom Colors

`--bg` and `--fg` accept hex colors only (`#rrggbb`). They override the corresponding preset value. Partial override is valid: `--theme tokyo-night --fg '#ffffff'` keeps the preset `bg` but replaces `fg`.

```bash
bmm -i diagram.mmd --bg '#1e1e2e' --fg '#cdd6f4'
```

### `--list-themes` Behavior

Outputs one theme per line in `<name>: bg=<hex>, fg=<hex>` format, exits 0. All other options are ignored.

```
tokyo-night: bg=#1a1b26, fg=#a9b1d6
catppuccin: bg=#1e1e2e, fg=#cdd6f4
...
```

## Architecture

```
stdin/file → read Mermaid code → resolve theme colors → renderMermaidSVG() → stdout/file
```

Single-flow pipeline. No intermediate state, no config files, no interactive mode.

### Module Boundaries

| Module | Responsibility |
|--------|---------------|
| `src/cli.js` | Commander setup, argv parsing, orchestration |
| `src/io.js` | stdin reading, file read/write |
| `src/theme.js` | Preset definitions, theme resolution, color validation |
| `src/render.js` | `beautiful-mermaid` adapter, error wrapping |

## Technical Stack

- **Runtime**: Node.js >= 18 (ESM)
- **CLI framework**: `commander`
- **Rendering**: `beautiful-mermaid` v1.1.3+ (zero DOM deps, confirmed working in pure Node.js)
- **Package type**: ESM module
- **Bin shebang**: `#!/usr/bin/env node`

## Project Structure

```
src/
  cli.js          # CLI entry, commander setup, orchestration
  io.js           # stdin/file input, file output
  theme.js        # Preset themes, color validation, theme resolution
  render.js       # beautiful-mermaid adapter
test/
  fixtures/       # Sample .mmd files for testing
  cli.test.js     # Integration tests
  theme.test.js   # Theme resolution tests
package.json      # bin field → src/cli.js
```

## Skill Integration Contract

For automated/skill usage:

- **Input**: Mermaid code via stdin
- **Output**: Raw SVG string on stdout (no extra formatting)
- **Errors**: `Error: <message>` on stderr, exit code 1
- **Success**: SVG on stdout, exit code 0
- **Invocation**: `echo "${mermaid}" | bmm [theme-flags] > output.svg`

## Distribution

npm global package: `npm install -g beautiful-mermaid-cli`

Binary name: `bmm`

## Cross-Platform

Target platforms: macOS, Linux, Windows (Node.js >= 18).

No platform-specific code. Uses only:
- Node.js built-in `fs` for file I/O
- `process.stdin` / `process.stdout` for streaming
- No shell-specific features

## Out of Scope (v1)

- PNG output
- Interactive mode / live preview
- Config file (`~/.bmmrc`)
- Enrichment color CLI flags (`--line`, `--accent`, etc.)
- Custom theme files
- Mermaid syntax validation (delegated to library)
- `--watch` mode
