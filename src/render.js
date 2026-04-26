import { renderMermaidSVG } from 'beautiful-mermaid';

const SYNTAX_RE = /invalid mermaid|Expected|parse error/i;

export function render(mermaidCode, theme) {
  if (!mermaidCode.trim()) {
    throw new Error('No Mermaid code provided');
  }

  try {
    return renderMermaidSVG(mermaidCode, theme);
  } catch (e) {
    if (SYNTAX_RE.test(e.message)) {
      throw new Error(`Invalid mermaid syntax: ${e.message}`);
    }
    throw new Error(`Render failed: ${e.message}`);
  }
}
