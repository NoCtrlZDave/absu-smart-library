import QRCode from 'qrcode';
import { encode, layout } from 'code128.js';

const toSvgUri = (svg) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;

const renderBarsSvg = (value) => {
  const encoded = encode(value);
  const layoutResult = layout(encoded);
  const height = Number(layoutResult.height) || 50;
  const bars = layoutResult.bars || [];
  const rects = bars
    .map((bar) => {
      const barWidth = bar.width > 1 ? bar.width : 2;
      const y = (height - barWidth) / 2;
      return `<rect x="${bar.x}" y="${y}" width="${barWidth}" height="${barWidth}" fill="#000000"/>`;
    })
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${layoutResult.width}" height="${height}" viewBox="0 0 ${layoutResult.width} ${height}" role="img" aria-label="Barcode ${value}">
  <rect width="${layoutResult.width}" height="${height}" fill="#ffffff"/>
  <g fill="#000000">${rects}</g>
</svg>`;

  return toSvgUri(svg);
};

export const generateBarcodeSvg = (code) => {
  const value = String(code || '');
  if (!value) return null;
  return renderBarsSvg(value);
};

export const generateBarcodeDataUrl = (code) => {
  const value = String(code || '');
  if (!value) return null;
  return renderBarsSvg(value);
};

export const generateQrDataUrl = async (text, options = {}) => {
  const payload = String(text || '');
  return QRCode.toDataURL(payload, {
    width: options.width || 256,
    margin: options.margin ?? 1,
    color: { dark: options.dark || '#000000', light: options.light || '#ffffff' },
  });
};

export const generateQrSvg = async (text, options = {}) => {
  const payload = String(text || '');
  return QRCode.toString(payload, {
    errorCorrectionLevel: options.errorCorrectionLevel || 'M',
    margin: options.margin ?? 1,
    width: options.width || 256,
    color: { dark: options.dark || '#000000', light: options.light || '#ffffff' },
  });
};

export default { generateBarcodeSvg, generateBarcodeDataUrl, generateQrDataUrl, generateQrSvg };
