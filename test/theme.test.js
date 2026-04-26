import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme, listThemes, presets } from '../src/theme.js';

describe('theme', () => {
  describe('resolveTheme', () => {
    it('returns default theme (tokyo-night) when no overrides', () => {
      const result = resolveTheme({});
      assert.deepStrictEqual(result, presets['tokyo-night']);
    });

    it('returns specified preset theme', () => {
      const result = resolveTheme({ theme: 'catppuccin' });
      assert.deepStrictEqual(result, presets['catppuccin']);
    });

    it('supports all 6 presets', () => {
      const names = ['tokyo-night', 'catppuccin', 'nord', 'solarized-dark', 'solarized-light', 'github-light'];
      for (const name of names) {
        const result = resolveTheme({ theme: name });
        assert.ok(result.bg, `${name} should have bg`);
        assert.ok(result.fg, `${name} should have fg`);
        assert.equal(result.bg, presets[name].bg);
        assert.equal(result.fg, presets[name].fg);
      }
    });

    it('overrides bg with custom color', () => {
      const result = resolveTheme({ theme: 'tokyo-night', bg: '#000000' });
      assert.equal(result.bg, '#000000');
      assert.equal(result.fg, presets['tokyo-night'].fg);
    });

    it('overrides fg with custom color', () => {
      const result = resolveTheme({ theme: 'tokyo-night', fg: '#ffffff' });
      assert.equal(result.bg, presets['tokyo-night'].bg);
      assert.equal(result.fg, '#ffffff');
    });

    it('overrides both bg and fg', () => {
      const result = resolveTheme({ bg: '#111111', fg: '#eeeeee' });
      assert.equal(result.bg, '#111111');
      assert.equal(result.fg, '#eeeeee');
    });

    it('throws on unknown theme', () => {
      assert.throws(
        () => resolveTheme({ theme: 'nonexistent' }),
        { message: /Unknown theme "nonexistent". Available:/ }
      );
    });

    it('throws on invalid bg color format', () => {
      assert.throws(
        () => resolveTheme({ bg: 'red' }),
        { message: /Invalid color "red". Expected hex format/ }
      );
    });

    it('throws on invalid fg color format', () => {
      assert.throws(
        () => resolveTheme({ fg: '#xyz' }),
        { message: /Invalid color "#xyz". Expected hex format/ }
      );
    });

    it('rejects short hex (#rgb)', () => {
      assert.throws(
        () => resolveTheme({ bg: '#fff' }),
        { message: /Invalid color/ }
      );
    });

    it('rejects hex without # prefix', () => {
      assert.throws(
        () => resolveTheme({ fg: 'ffffff' }),
        { message: /Invalid color/ }
      );
    });

    it('accepts uppercase hex', () => {
      const result = resolveTheme({ bg: '#AABBCC' });
      assert.equal(result.bg, '#AABBCC');
    });
  });

  describe('listThemes', () => {
    it('lists all 6 themes', () => {
      const output = listThemes();
      const lines = output.split('\n');
      assert.equal(lines.length, 6);
    });

    it('formats each line as "name: bg=#hex, fg=#hex"', () => {
      const output = listThemes();
      for (const line of output.split('\n')) {
        assert.match(line, /^[\w-]+: bg=#[0-9a-fA-F]{6}, fg=#[0-9a-fA-F]{6}$/);
      }
    });

    it('includes tokyo-night as first entry', () => {
      const output = listThemes();
      assert.ok(output.startsWith('tokyo-night:'));
    });
  });
});
