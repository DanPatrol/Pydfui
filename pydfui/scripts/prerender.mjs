// Post-build static SEO prerender.
//
// The app is a client-side React SPA. Without this step every route is served
// the same dist/index.html, so Googlebot sees an identical (or homepage)
// canonical for every URL -> "Alternative page with proper canonical tag" and
// the pages never get indexed.
//
// This script does NOT need a headless browser. For every URL in sitemap.xml it
// writes dist/<path>/index.html based on the built index.html with a correct,
// self-referencing <link rel="canonical">, <title>, description and Open Graph
// tags injected. React still hydrates normally on top of it.
//
// Requires the static server to resolve `/foo` -> `/foo/index.html`
// (nginx: `try_files $uri $uri/ /index.html;`). See SEO note at the bottom.

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const distDir = join(root, 'dist');
const SITE_URL = 'https://www.pdfworkshop.sbs';

const indexPath = join(distDir, 'index.html');
const sitemapPath = join(distDir, 'sitemap.xml');

if (!existsSync(indexPath)) {
  console.error('[prerender] dist/index.html not found - run `vite build` first.');
  process.exit(1);
}
if (!existsSync(sitemapPath)) {
  console.error('[prerender] dist/sitemap.xml not found - cannot determine routes.');
  process.exit(1);
}

const template = readFileSync(indexPath, 'utf8');
const sitemap = readFileSync(sitemapPath, 'utf8');

// Per-path title/description. Keep landing pages in sync with src/seo/uploadSeo.ts
// and the page components. Anything not listed falls back to a sensible default
// (the React app still sets a precise title on hydration).
const DEFAULT = {
  title: 'PDF Tools Online Free | PDF Workshop',
  description:
    'Free online PDF tools - merge, split, compress, convert, edit and protect PDFs. No registration required.',
};

const PAGE_SEO = {
  '/': {
    title: 'PDF Workshop - Free Online PDF Tools',
    description:
      'Free online PDF tools - merge, split, compress, watermark, protect, convert and edit PDFs. No registration required.',
  },
  '/upload/editpdf': { title: 'Edit PDF Online Free - Add Text, Draw & Annotate | PDF Workshop', description: 'Edit PDF files online for free. Add text, draw, highlight and annotate your PDF. No signup.' },
  '/upload/merge': { title: 'Merge PDF Files Online Free - Combine PDFs | PDF Workshop', description: 'Merge multiple PDF files into one document online for free. No registration, fast and secure.' },
  '/upload/split': { title: 'Split PDF Online Free - Separate PDF Pages | PDF Workshop', description: 'Split a PDF into multiple files or extract page ranges online for free. No signup required.' },
  '/upload/compress': { title: 'Compress PDF Online Free - Reduce PDF File Size | PDF Workshop', description: 'Compress PDF files to reduce file size while keeping quality. Free, fast and secure.' },
  '/upload/removepages': { title: 'Remove Pages from PDF Online Free | PDF Workshop', description: 'Delete unwanted pages from a PDF online for free. No signup, fast and secure.' },
  '/upload/extract': { title: 'Extract PDF Pages Online Free | PDF Workshop', description: 'Extract and save selected pages from a PDF as a new file online for free.' },
  '/upload/organize': { title: 'Organize PDF Pages Online Free - Reorder Pages | PDF Workshop', description: 'Reorder, rotate and organize PDF pages online for free with drag and drop.' },
  '/upload/rotate': { title: 'Rotate PDF Online Free - Rotate PDF Pages | PDF Workshop', description: 'Rotate PDF pages 90, 180 or 270 degrees online for free and save permanently.' },
  '/upload/addwatermark': { title: 'Add Watermark to PDF Online Free | PDF Workshop', description: 'Add text or image watermarks to your PDF online for free. Adjust opacity and position.' },
  '/upload/croppdf': { title: 'Crop PDF Online Free - Trim PDF Margins | PDF Workshop', description: 'Crop PDF pages and trim white margins online for free. Fast, secure, no signup.' },
  '/upload/redactpdf': { title: 'Redact PDF Online Free - Hide Sensitive Information | PDF Workshop', description: 'Redact and permanently remove sensitive text or areas from a PDF online for free.' },
  '/upload/grayscale': { title: 'Convert PDF to Grayscale Online Free | PDF Workshop', description: 'Convert a color PDF to grayscale (black and white) online for free.' },
  '/upload/reverse': { title: 'Reverse PDF Page Order Online Free | PDF Workshop', description: 'Reverse the order of pages in a PDF online for free. Fast, secure, no signup.' },
  '/upload/resizepdf': { title: 'Resize PDF Pages Online Free - Change Page Size | PDF Workshop', description: 'Change PDF page size to A4, Letter or Legal online for free.' },
  '/upload/headerfooter': { title: 'Add Header and Footer to PDF Online Free | PDF Workshop', description: 'Add custom headers and footers to your PDF online for free.' },
  '/upload/pagenumbers': { title: 'Add Page Numbers to PDF Online Free | PDF Workshop', description: 'Add page numbers to your PDF online for free. Choose position and style.' },
  '/upload/removeblank': { title: 'Remove Blank Pages from PDF Online Free | PDF Workshop', description: 'Automatically detect and remove blank pages from a PDF online for free.' },
  '/upload/flatten': { title: 'Flatten PDF Online Free - Flatten Forms & Layers | PDF Workshop', description: 'Flatten PDF forms, annotations and layers into static content online for free.' },
  '/upload/metadata': { title: 'Edit PDF Metadata Online Free | PDF Workshop', description: 'View and edit PDF metadata such as title, author, subject and keywords online for free.' },
  '/upload/weboptimize': { title: 'Web-Optimize PDF Online Free | PDF Workshop', description: 'Linearize and web-optimize a PDF for fast online loading, free.' },
  '/upload/ocrpdf': { title: 'OCR PDF Online Free - Make Scanned PDF Searchable | PDF Workshop', description: 'Run OCR on scanned PDFs to make them searchable and selectable online for free.' },
  '/upload/protect': { title: 'Protect PDF with Password Online Free | PDF Workshop', description: 'Add a password and encrypt your PDF online for free. Protect sensitive documents.' },
  '/upload/unlock': { title: 'Unlock PDF Online Free - Remove PDF Password | PDF Workshop', description: 'Remove password protection from a PDF you own online for free.' },
  '/upload/signpdf': { title: 'Sign PDF Online Free - Add Digital Signature | PDF Workshop', description: 'Sign PDF documents online for free. Draw, type or upload your signature.' },
  '/upload/comparepdf': { title: 'Compare PDF Files Online Free - Find Differences | PDF Workshop', description: 'Compare two PDF files and highlight the differences online for free.' },
  '/upload/wtpdf': { title: 'Word to PDF Converter Online Free - DOCX to PDF | PDF Workshop', description: 'Convert Word documents (DOC, DOCX) to PDF online for free. Keep formatting.' },
  '/upload/jpegtopdf': { title: 'JPG to PDF Converter Online Free | PDF Workshop', description: 'Convert JPG and JPEG images to a PDF online for free. Combine multiple images.' },
  '/upload/exceltopdf': { title: 'Excel to PDF Converter Online Free | PDF Workshop', description: 'Convert Excel spreadsheets (XLS, XLSX) to PDF online for free. Keep layout.' },
  '/upload/pptxtopdf': { title: 'PowerPoint to PDF Converter Online Free | PDF Workshop', description: 'Convert PowerPoint presentations (PPT, PPTX) to PDF online for free.' },
  '/upload/repair': { title: 'Repair PDF Online Free - Fix Corrupted PDF Files | PDF Workshop', description: 'Repair and recover damaged or corrupted PDF files online for free.' },
  '/upload/pdftopptx': { title: 'PDF to PowerPoint Converter Online Free | PDF Workshop', description: 'Convert PDF files to editable PowerPoint presentations online for free.' },
  '/upload/pdftoimage': { title: 'PDF to Images Converter Online Free | PDF Workshop', description: 'Convert every page of a PDF to images online for free. High quality.' },
  '/upload/pdftojpg': { title: 'PDF to JPG Converter Online Free | PDF Workshop', description: 'Convert PDF pages to JPG images online for free. High quality.' },
  '/upload/pdftopng': { title: 'PDF to PNG Converter Online Free | PDF Workshop', description: 'Convert PDF pages to PNG images online for free. Transparent, high quality.' },
  '/upload/pdftotext': { title: 'PDF to Text Converter Online Free - Extract Text | PDF Workshop', description: 'Extract all text from a PDF to a plain text file online for free.' },
  '/upload/pdftohtml': { title: 'PDF to HTML Converter Online Free | PDF Workshop', description: 'Convert PDF files to HTML web pages online for free. Keep layout.' },
  '/upload/pdftocsv': { title: 'PDF to CSV Converter Online Free - Extract Tables | PDF Workshop', description: 'Extract tables from a PDF to CSV online for free.' },
  '/upload/pdftopdf_a': { title: 'PDF to PDF/A Converter Online Free - Archival PDF | PDF Workshop', description: 'Convert PDF to the PDF/A archival format for long-term storage online for free.' },
  '/upload/extractimages': { title: 'Extract Images from PDF Online Free | PDF Workshop', description: 'Extract and download all embedded images from a PDF online for free.' },
  '/htmltopdf': { title: 'HTML to PDF Converter Online Free | PDF Workshop', description: 'Convert HTML web pages or files to PDF online for free.' },
  '/pngtopdf': { title: 'PNG to PDF Converter Online Free | PDF Workshop', description: 'Convert PNG images to a PDF online for free. Combine multiple images.' },
  '/txttopdf': { title: 'Text to PDF Converter Online Free | PDF Workshop', description: 'Convert plain text (TXT) files to PDF online for free.' },
  '/markdowntopdf': { title: 'Markdown to PDF Converter Online Free | PDF Workshop', description: 'Convert Markdown (MD) files to a formatted PDF online for free.' },
  '/pdftoword': { title: 'PDF to Word Converter Online Free - PDF to DOCX | PDF Workshop', description: 'Convert PDF files to editable Word documents (DOCX) online for free.' },
  '/pdftoexcel': { title: 'PDF to Excel Converter Online Free - PDF to XLSX | PDF Workshop', description: 'Extract tables from a PDF to an Excel spreadsheet (XLSX) online for free.' },
  '/blog': { title: 'PDF Tips & Guides Blog | PDF Workshop', description: 'Guides and tutorials on merging, compressing, converting and editing PDF files.' },
};

// Extract every <loc> from the sitemap as the canonical route list.
const locs = [...sitemap.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/g)].map((m) => m[1]);
if (locs.length === 0) {
  console.error('[prerender] no <loc> entries found in sitemap.xml');
  process.exit(1);
}

const escapeHtml = (s) =>
  s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

function renderPage(canonicalUrl, pathname) {
  const seo = PAGE_SEO[pathname] || {
    ...DEFAULT,
    // Derive a usable title for any page not explicitly listed.
    title:
      pathname === '/'
        ? DEFAULT.title
        : `${pathname.split('/').filter(Boolean).pop()} | PDF Workshop`,
  };
  const title = escapeHtml(seo.title);
  const description = escapeHtml(seo.description);
  const url = escapeHtml(canonicalUrl);

  let html = template;

  // Replace <title>
  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${title}</title>`);

  // Replace meta description
  html = html.replace(
    /<meta\s+name="description"\s+content="[\s\S]*?"\s*\/?>/,
    `<meta name="description" content="${description}" />`,
  );

  // Inject canonical + Open Graph just before </head> (index.html no longer
  // hardcodes a canonical, so there is exactly one per page).
  const headTags = [
    `<link rel="canonical" href="${url}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="PDF Workshop" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ].join('\n    ');
  html = html.replace('</head>', `    ${headTags}\n  </head>`);

  return html;
}

let count = 0;
for (const loc of locs) {
  let pathname;
  try {
    pathname = new URL(loc).pathname.replace(/\/+$/, '') || '/';
  } catch {
    console.warn(`[prerender] skipping invalid URL in sitemap: ${loc}`);
    continue;
  }
  const canonicalUrl = pathname === '/' ? `${SITE_URL}/` : `${SITE_URL}${pathname}`;
  const outHtml = renderPage(canonicalUrl, pathname);

  const outFile =
    pathname === '/' ? indexPath : join(distDir, pathname, 'index.html');
  mkdirSync(dirname(outFile), { recursive: true });
  writeFileSync(outFile, outHtml, 'utf8');
  count++;
}

console.log(`[prerender] wrote ${count} static HTML pages with per-route canonical tags.`);
