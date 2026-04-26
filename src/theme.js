const HEX_RE = /^#[0-9a-fA-F]{6}$/;

export const presets = {
  'tokyo-night':     { bg: '#1a1b26', fg: '#a9b1d6' },
  'catppuccin':      { bg: '#1e1e2e', fg: '#cdd6f4' },
  'nord':            { bg: '#2e3440', fg: '#d8dee9' },
  'solarized-dark':  { bg: '#002b36', fg: '#839496' },
  'solarized-light': { bg: '#fdf6e3', fg: '#657b83' },
  'github-light':    { bg: '#ffffff', fg: '#24292f' },
};

export function resolveTheme({ theme = 'tokyo-night', bg, fg }) {
  if (!(theme in presets)) {
    const names = Object.keys(presets).join(', ');
    throw new Error(`Unknown theme "${theme}". Available: ${names}`);
  }

  const resolved = { ...presets[theme] };

  if (bg !== undefined) {
    if (!HEX_RE.test(bg)) {
      throw new Error(`Invalid color "${bg}". Expected hex format: #rrggbb`);
    }
    resolved.bg = bg;
  }
  if (fg !== undefined) {
    if (!HEX_RE.test(fg)) {
      throw new Error(`Invalid color "${fg}". Expected hex format: #rrggbb`);
    }
    resolved.fg = fg;
  }

  return resolved;
}

export function listThemes() {
  return Object.entries(presets)
    .map(([name, { bg, fg }]) => `${name}: bg=${bg}, fg=${fg}`)
    .join('\n');
}
