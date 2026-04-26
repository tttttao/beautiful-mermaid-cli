import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { render } from '../src/render.js';

describe('render', () => {
  const defaultTheme = { bg: '#1a1b26', fg: '#a9b1d6' };

  it('renders a simple flowchart', () => {
    const svg = render('graph TD\n  A-->B', defaultTheme);
    assert.ok(svg.startsWith('<svg'));
    assert.ok(svg.includes('</svg>'));
  });

  it('renders a sequence diagram', () => {
    const svg = render('sequenceDiagram\n  participant A\n  A->>B: Hi', defaultTheme);
    assert.ok(svg.startsWith('<svg'));
  });

  it('includes theme colors in SVG', () => {
    const svg = render('graph TD\n  A-->B', { bg: '#000000', fg: '#ffffff' });
    assert.ok(svg.includes('#000000'));
    assert.ok(svg.includes('#ffffff'));
  });

  it('renders with different themes', () => {
    const themes = [
      { bg: '#1a1b26', fg: '#a9b1d6' },
      { bg: '#fdf6e3', fg: '#657b83' },
      { bg: '#ffffff', fg: '#24292f' },
    ];
    for (const theme of themes) {
      const svg = render('graph TD\n  X-->Y', theme);
      assert.ok(svg.includes(theme.bg), `SVG should contain ${theme.bg}`);
    }
  });

  it('throws on empty input', () => {
    assert.throws(
      () => render('', defaultTheme),
      { message: /No Mermaid code provided/ }
    );
  });

  it('throws on whitespace-only input', () => {
    assert.throws(
      () => render('   \n  ', defaultTheme),
      { message: /No Mermaid code provided/ }
    );
  });

  it('wraps mermaid syntax errors', () => {
    assert.throws(
      () => render('this is not valid mermaid', defaultTheme),
      { message: /^Invalid mermaid syntax:/ }
    );
  });

  it('returns a string', () => {
    const svg = render('graph TD\n  A-->B', defaultTheme);
    assert.equal(typeof svg, 'string');
  });

  it('produces valid SVG with xmlns', () => {
    const svg = render('graph TD\n  A-->B', defaultTheme);
    assert.ok(svg.includes('xmlns="http://www.w3.org/2000/svg"'));
  });
});
