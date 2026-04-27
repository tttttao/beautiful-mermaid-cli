const SVG_SIZE_RE = /<svg[^>]*\swidth="([\d.]+)(?:px)?"/;
const SVG_HEIGHT_RE = /<svg[^>]*\sheight="([\d.]+)(?:px)?"/;
const VIEWBOX_RE = /<svg[^>]*\sviewBox="[\d.e+-]+\s+[\d.e+-]+\s+([\d.e+-]+)\s+([\d.e+-]+)"/;

const DEFAULT_SCALE = 2;
const DEFAULT_QUALITY = 90;
const MAX_DIMENSION = 10000;

function parseSVGSize(svg) {
  const wMatch = SVG_SIZE_RE.exec(svg);
  const hMatch = SVG_HEIGHT_RE.exec(svg);
  if (wMatch && hMatch) {
    return { width: parseFloat(wMatch[1]), height: parseFloat(hMatch[1]) };
  }

  const m = VIEWBOX_RE.exec(svg);
  if (m) return { width: parseFloat(m[1]), height: parseFloat(m[2]) };

  return { width: 400, height: 300 };
}

export async function convert(svgString, format, options = {}) {
  if (!svgString.trim()) {
    throw new Error('No SVG content to convert');
  }

  if (format !== 'png' && format !== 'jpg') {
    throw new Error(`Unsupported format: "${format}". Supported: png, jpg`);
  }

  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    throw new Error(
      'Image conversion requires the "sharp" package. ' +
      'Install it with: npm install sharp'
    );
  }

  const scale = options.scale ?? DEFAULT_SCALE;
  const quality = options.quality ?? DEFAULT_QUALITY;

  if (scale <= 0) throw new Error(`Invalid scale: ${scale}. Must be > 0`);
  if (quality < 1 || quality > 100) throw new Error(`Invalid quality: ${quality}. Must be 1-100`);

  const { width, height } = parseSVGSize(svgString);
  const scaledW = Math.round(width * scale);
  const scaledH = Math.round(height * scale);

  if (scaledW > MAX_DIMENSION || scaledH > MAX_DIMENSION) {
    throw new Error(`Output dimensions ${scaledW}x${scaledH} exceed maximum ${MAX_DIMENSION}x${MAX_DIMENSION}`);
  }

  const pipeline = sharp(Buffer.from(svgString)).resize(scaledW, scaledH);

  if (format === 'jpg') {
    return pipeline.jpeg({ quality }).toBuffer();
  }

  return pipeline.png().toBuffer();
}
