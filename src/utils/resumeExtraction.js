import * as pdfjs from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';
import mammoth from 'mammoth/mammoth.browser';

pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

export const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10MB

// -------------------------------------------------------------
// FILE VALIDATION — magic-byte / real-type check, not just extension
// -------------------------------------------------------------
export const detectFileType = async (file) => {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const hex = Array.from(head).map(b => b.toString(16).padStart(2, '0')).join('');

  if (hex.startsWith('25504446')) return 'pdf';                      // %PDF
  if (hex.startsWith('504b0304')) return 'docx';                     // ZIP → docx (OOXML)
  if (hex.startsWith('7b') || hex.startsWith('5b')) return 'json';   // { or [
  if (hex.startsWith('89504e47') || hex.startsWith('ffd8ff') || hex.startsWith('47494638') || hex.startsWith('52494646')) return 'image'; // PNG, JPG, GIF, WEBP
  return 'unknown';
};

export const validateResumeFile = async (file) => {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error('File is larger than 10MB. Please upload a smaller resume.');
  }
  const type = await detectFileType(file);
  const ext = file.name.toLowerCase().split('.').pop();

  // JSON resumes (the wizard already accepted .json exports)
  if (ext === 'json' || type === 'json') return 'json';

  const imgExts = ['png', 'jpg', 'jpeg', 'webp', 'bmp'];
  if (imgExts.includes(ext) || type === 'image' || file.type.startsWith('image/')) return 'image';

  const allowed = ['pdf', 'docx', 'txt'];
  const extOk = ['pdf', 'docx', 'doc', 'txt'].includes(ext);
  const typeOk = type === 'pdf' || type === 'docx' || file.type === 'text/plain';

  if (!(extOk && (typeOk || type === 'unknown'))) {
    throw new Error('Unsupported file. Please upload a PDF, DOCX, image (PNG/JPG), or plain-text resume.');
  }
  return allowed.includes(type) ? type : (ext === 'doc' ? 'docx' : ext);
};

// -------------------------------------------------------------
// TEXT NORMALIZATION — shared by every input path
// -------------------------------------------------------------
export const normalizeText = (raw) => {
  return (raw || '')
    // unicode bullets/dashes → ascii, keeps LLM parsing stable
    .replace(/[\u2022\u25CF\u25AA\u2023\u2043]/g, '-')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    // tabs → spaces
    .replace(/\t/g, '  ')
    // collapse >2 blank lines, trim trailing space per line
    .split('\n').map(l => l.replace(/\s+$/, '')).join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
};

// -------------------------------------------------------------
// PDF — extract text layer; OCR fallback if scanned
// -------------------------------------------------------------
const extractPdfText = async (file, onProgress) => {
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const pages = [];
  const maxPages = Math.min(pdf.numPages, 10); // resumes don't need more

  for (let i = 1; i <= maxPages; i++) {
    onProgress && onProgress(i, maxPages);
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    // group items into lines by y-coordinate to preserve reading order
    const lines = new Map();
    for (const item of content.items) {
      if (!item.str) continue;
      const y = Math.round(item.transform[5]);
      const key = Math.round(y / 4) * 4; // 4pt tolerance bucket
      if (!lines.has(key)) lines.set(key, []);
      lines.get(key).push({ x: item.transform[4], str: item.str });
    }
    const sorted = [...lines.entries()].sort((a, b) => b[0] - a[0]);
    const pageText = sorted
      .map(([, parts]) => parts.sort((a, b) => a.x - b.x).map(p => p.str).join(' '))
      .join('\n');
    pages.push(pageText);
  }

  const text = normalizeText(pages.join('\n\n'));
  // A text-layer PDF yields meaningful words; scanned ones yield near-nothing
  const wordCount = text.split(/\s+/).filter(w => w.length > 1).length;
  const needsOcr = wordCount < 40;
  return { text, needsOcr, pages: pdf.numPages };
};

const extractPdfOcr = async (file, onProgress) => {
  const { createWorker } = await import('tesseract.js');
  const buf = await file.arrayBuffer();
  const pdf = await pdfjs.getDocument({ data: buf }).promise;
  const chunks = [];
  const maxPages = Math.min(pdf.numPages, 5);

  const worker = await createWorker('eng');
  try {
    for (let i = 1; i <= maxPages; i++) {
      onProgress && onProgress(i, maxPages);
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x for OCR accuracy
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      const { data } = await worker.recognize(canvas);
      chunks.push(data.text || '');
      canvas.width = 0; canvas.height = 0; // free memory
    }
  } finally {
    await worker.terminate();
  }
  return normalizeText(chunks.join('\n\n'));
};

// -------------------------------------------------------------
// DOCX — mammoth preserves headings/bullets structure
// -------------------------------------------------------------
const extractDocxText = async (file) => {
  const buf = await file.arrayBuffer();
  const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
  return normalizeText(value);
};

const extractImageOcr = async (file, onProgress) => {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('eng');
  try {
    onProgress && onProgress(1, 1);
    const { data } = await worker.recognize(file);
    return normalizeText(data.text || '');
  } finally {
    await worker.terminate();
  }
};

// -------------------------------------------------------------
// MAIN ENTRY
// -------------------------------------------------------------
export const extractResumeText = async (file, onStage) => {
  const type = await validateResumeFile(file);

  if (type === 'json') {
    onStage && onStage('reading');
    const raw = await file.text();
    return { text: normalizeText(raw), kind: 'json', confidence: 'high', needsOcr: false };
  }

  if (type === 'image') {
    onStage && onStage('ocr');
    const ocrText = await extractImageOcr(file, (i, n) => onStage && onStage('ocr', i, n));
    if (ocrText.split(/\s+/).filter(w => w.length > 1).length < 15) {
      throw new Error('This image did not yield readable text. Try a clearer image, a PDF/DOCX file, or paste your text.');
    }
    return { text: ocrText, kind: 'image-ocr', confidence: 'low', needsOcr: true };
  }

  if (type === 'pdf') {
    onStage && onStage('reading');
    const { text, needsOcr } = await extractPdfText(file);
    if (needsOcr) {
      onStage && onStage('ocr');
      const ocrText = await extractPdfOcr(file, (i, n) => onStage && onStage('ocr', i, n));
      if (ocrText.split(/\s+/).filter(w => w.length > 1).length < 20) {
        throw new Error('This PDF appears to be a scanned image we could not read. Try a text-based PDF or paste your resume text.');
      }
      return { text: ocrText, kind: 'pdf-ocr', confidence: 'low', needsOcr: true };
    }
    return { text, kind: 'pdf', confidence: 'high', needsOcr: false };
  }

  if (type === 'docx') {
    onStage && onStage('reading');
    const text = await extractDocxText(file);
    return { text, kind: 'docx', confidence: 'high', needsOcr: false };
  }

  // plain text
  onStage && onStage('reading');
  const raw = await file.text();
  return { text: normalizeText(raw), kind: 'txt', confidence: 'high', needsOcr: false };
};

// -------------------------------------------------------------
// CLIENT-SIDE SANITIZER — defense-in-depth against stored XSS from
// resume content (rendered on public pages). Strips tags/protocols.
// -------------------------------------------------------------
export const sanitizeText = (s, maxLen = 2000) => {
  if (typeof s !== 'string') return '';
  return s
    .replace(/<[^>]*>/g, '')                    // strip html tags
    .replace(/javascript:/gi, '')
    .replace(/data:(?!image\/)/gi, '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
    .slice(0, maxLen)
    .trim();
};

export const sanitizeUrl = (s) => {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  if (/^(https?:\/\/)/i.test(t)) return t.slice(0, 500);
  if (/^mailto:/i.test(t)) return t;
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(t)) return `https://${t.slice(0, 480)}`;
  return '';
};
