import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { convert } from '../src/convert.js';

const SAMPLE_SVG = '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="100"><rect width="200" height="100" fill="red"/></svg>';

describe('convert', () => {
  it('converts SVG to PNG buffer', async () => {
    const buf = await convert(SAMPLE_SVG, 'png');
    assert.ok(Buffer.isBuffer(buf));
    assert.equal(buf[0], 0x89);
    assert.ok(buf.slice(1, 4).equals(Buffer.from('PNG')));
  });

  it('converts SVG to JPG buffer', async () => {
    const buf = await convert(SAMPLE_SVG, 'jpg');
    assert.ok(Buffer.isBuffer(buf));
    assert.equal(buf[0], 0xff);
    assert.equal(buf[1], 0xd8);
    assert.equal(buf[2], 0xff);
  });

  it('respects scale option', async () => {
    const buf1 = await convert(SAMPLE_SVG, 'png', { scale: 1 });
    const buf2 = await convert(SAMPLE_SVG, 'png', { scale: 3 });
    assert.ok(buf2.length > buf1.length, 'Higher scale should produce larger file');
  });

  it('respects quality option for JPG', async () => {
    const bufHigh = await convert(SAMPLE_SVG, 'jpg', { quality: 95, scale: 1 });
    const bufLow = await convert(SAMPLE_SVG, 'jpg', { quality: 10, scale: 1 });
    assert.ok(bufHigh.length > bufLow.length, 'Higher quality should produce larger file');
  });

  it('uses default scale=2 when not specified', async () => {
    const buf = await convert(SAMPLE_SVG, 'png');
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 0);
  });

  it('throws on empty SVG', async () => {
    await assert.rejects(
      () => convert('', 'png'),
      { message: /No SVG content/ }
    );
  });

  it('throws on whitespace-only SVG', async () => {
    await assert.rejects(
      () => convert('   \n  ', 'png'),
      { message: /No SVG content/ }
    );
  });

  it('handles SVG with viewBox but no width/height', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 150"><rect width="300" height="150"/></svg>';
    const buf = await convert(svg, 'png');
    assert.ok(Buffer.isBuffer(buf));
    assert.ok(buf.length > 0);
  });

  it('throws on unsupported format', async () => {
    await assert.rejects(
      () => convert(SAMPLE_SVG, 'gif'),
      { message: /Unsupported format.*gif/ }
    );
  });

  it('throws on invalid scale', async () => {
    await assert.rejects(
      () => convert(SAMPLE_SVG, 'png', { scale: 0 }),
      { message: /Invalid scale/ }
    );
    await assert.rejects(
      () => convert(SAMPLE_SVG, 'png', { scale: -1 }),
      { message: /Invalid scale/ }
    );
  });

  it('throws on invalid quality', async () => {
    await assert.rejects(
      () => convert(SAMPLE_SVG, 'jpg', { quality: 0 }),
      { message: /Invalid quality/ }
    );
    await assert.rejects(
      () => convert(SAMPLE_SVG, 'jpg', { quality: 200 }),
      { message: /Invalid quality/ }
    );
  });

  it('throws on output dimensions exceeding maximum', async () => {
    const hugeSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="6000" height="6000"><rect/></svg>';
    await assert.rejects(
      () => convert(hugeSvg, 'png', { scale: 2 }),
      { message: /exceed maximum/ }
    );
  });
});
