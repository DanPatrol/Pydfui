// SEO metadata for every /upload/:action landing page.
//
// These are the pages listed in sitemap.xml and crawled by Google. Each one
// MUST have a unique title, description and a self-referencing canonical URL,
// otherwise Search Console reports "Alternative page with proper canonical tag"
// and the pages never get indexed.
//
// Keep the keys in sync with the action list in UploadFile.tsx and sitemap.xml.

export const SITE_URL = 'https://www.pdfworkshop.sbs';

export interface UploadSeoEntry {
  title: string;
  description: string;
}

export const uploadSeo: Record<string, UploadSeoEntry> = {
  editpdf: {
    title: 'Edit PDF Online Free - Add Text, Draw & Annotate | PDF Workshop',
    description: 'Edit PDF files online for free. Add text, draw, highlight, and annotate your PDF. No signup, fast and secure.',
  },
  merge: {
    title: 'Merge PDF Files Online Free - Combine PDFs | PDF Workshop',
    description: 'Merge multiple PDF files into one document online for free. Reorder pages, no registration, fast and secure.',
  },
  split: {
    title: 'Split PDF Online Free - Separate PDF Pages | PDF Workshop',
    description: 'Split a PDF into multiple files or extract page ranges online for free. Fast, secure, no signup required.',
  },
  compress: {
    title: 'Compress PDF Online Free - Reduce PDF File Size | PDF Workshop',
    description: 'Compress PDF files to reduce file size while keeping quality. Free, fast and secure PDF compressor.',
  },
  removepages: {
    title: 'Remove Pages from PDF Online Free | PDF Workshop',
    description: 'Delete unwanted pages from a PDF online for free. Select pages to remove, no signup, fast and secure.',
  },
  extract: {
    title: 'Extract PDF Pages Online Free - Save Selected Pages | PDF Workshop',
    description: 'Extract and save selected pages from a PDF as a new file online for free. Fast, secure, no registration.',
  },
  organize: {
    title: 'Organize PDF Pages Online Free - Reorder Pages | PDF Workshop',
    description: 'Reorder, rotate and organize PDF pages online for free with drag and drop. Fast, secure, no signup.',
  },
  rotate: {
    title: 'Rotate PDF Online Free - Rotate PDF Pages | PDF Workshop',
    description: 'Rotate PDF pages 90, 180 or 270 degrees online for free. Permanently save the rotation, no signup.',
  },
  addwatermark: {
    title: 'Add Watermark to PDF Online Free | PDF Workshop',
    description: 'Add text or image watermarks to your PDF online for free. Adjust opacity and position, no registration.',
  },
  croppdf: {
    title: 'Crop PDF Online Free - Trim PDF Margins | PDF Workshop',
    description: 'Crop PDF pages and trim white margins online for free. Fast, secure, no signup required.',
  },
  redactpdf: {
    title: 'Redact PDF Online Free - Hide Sensitive Information | PDF Workshop',
    description: 'Redact and permanently remove sensitive text or areas from a PDF online for free. Secure, no signup.',
  },
  grayscale: {
    title: 'Convert PDF to Grayscale Online Free | PDF Workshop',
    description: 'Convert a color PDF to grayscale (black and white) online for free. Reduce size, no registration.',
  },
  reverse: {
    title: 'Reverse PDF Page Order Online Free | PDF Workshop',
    description: 'Reverse the order of pages in a PDF online for free. Fast, secure, no signup required.',
  },
  resizepdf: {
    title: 'Resize PDF Pages Online Free - Change Page Size | PDF Workshop',
    description: 'Change PDF page size to A4, Letter or Legal online for free. Fast, secure, no registration.',
  },
  headerfooter: {
    title: 'Add Header and Footer to PDF Online Free | PDF Workshop',
    description: 'Add custom headers and footers to your PDF online for free. Page numbers, text, dates, no signup.',
  },
  pagenumbers: {
    title: 'Add Page Numbers to PDF Online Free | PDF Workshop',
    description: 'Add page numbers to your PDF online for free. Choose position and style, no registration required.',
  },
  removeblank: {
    title: 'Remove Blank Pages from PDF Online Free | PDF Workshop',
    description: 'Automatically detect and remove blank pages from a PDF online for free. Fast, secure, no signup.',
  },
  flatten: {
    title: 'Flatten PDF Online Free - Flatten Forms & Layers | PDF Workshop',
    description: 'Flatten PDF forms, annotations and layers into static content online for free. Fast, secure, no signup.',
  },
  metadata: {
    title: 'Edit PDF Metadata Online Free - Title, Author | PDF Workshop',
    description: 'View and edit PDF metadata such as title, author, subject and keywords online for free. No signup.',
  },
  weboptimize: {
    title: 'Web-Optimize PDF Online Free - Fast Loading PDFs | PDF Workshop',
    description: 'Linearize and web-optimize a PDF for fast online loading, free. Fast, secure, no registration.',
  },
  ocrpdf: {
    title: 'OCR PDF Online Free - Make Scanned PDF Searchable | PDF Workshop',
    description: 'Run OCR on scanned PDFs to make them searchable and selectable online for free. Secure, no signup.',
  },
  protect: {
    title: 'Protect PDF with Password Online Free | PDF Workshop',
    description: 'Add a password and encrypt your PDF online for free. Protect sensitive documents, no registration.',
  },
  unlock: {
    title: 'Unlock PDF Online Free - Remove PDF Password | PDF Workshop',
    description: 'Remove password protection from a PDF you own online for free. Fast, secure, no signup required.',
  },
  signpdf: {
    title: 'Sign PDF Online Free - Add Digital Signature | PDF Workshop',
    description: 'Sign PDF documents online for free. Draw, type or upload your signature, no registration required.',
  },
  comparepdf: {
    title: 'Compare PDF Files Online Free - Find Differences | PDF Workshop',
    description: 'Compare two PDF files and highlight the differences online for free. Fast, secure, no signup.',
  },
  wtpdf: {
    title: 'Word to PDF Converter Online Free - DOCX to PDF | PDF Workshop',
    description: 'Convert Word documents (DOC, DOCX) to PDF online for free. Keep formatting, no registration.',
  },
  jpegtopdf: {
    title: 'JPG to PDF Converter Online Free - Images to PDF | PDF Workshop',
    description: 'Convert JPG and JPEG images to a PDF online for free. Combine multiple images, no signup.',
  },
  exceltopdf: {
    title: 'Excel to PDF Converter Online Free - XLSX to PDF | PDF Workshop',
    description: 'Convert Excel spreadsheets (XLS, XLSX) to PDF online for free. Keep layout, no registration.',
  },
  pptxtopdf: {
    title: 'PowerPoint to PDF Converter Online Free - PPTX to PDF | PDF Workshop',
    description: 'Convert PowerPoint presentations (PPT, PPTX) to PDF online for free. No signup required.',
  },
  repair: {
    title: 'Repair PDF Online Free - Fix Corrupted PDF Files | PDF Workshop',
    description: 'Repair and recover damaged or corrupted PDF files online for free. Fast, secure, no signup.',
  },
  pdftopptx: {
    title: 'PDF to PowerPoint Converter Online Free - PDF to PPTX | PDF Workshop',
    description: 'Convert PDF files to editable PowerPoint presentations online for free. No registration required.',
  },
  pdftoimage: {
    title: 'PDF to Images Converter Online Free - PDF to Image | PDF Workshop',
    description: 'Convert every page of a PDF to images online for free. High quality, no signup required.',
  },
  pdftojpg: {
    title: 'PDF to JPG Converter Online Free - PDF to JPEG | PDF Workshop',
    description: 'Convert PDF pages to JPG images online for free. High quality, no registration required.',
  },
  pdftopng: {
    title: 'PDF to PNG Converter Online Free | PDF Workshop',
    description: 'Convert PDF pages to PNG images online for free. Transparent, high quality, no signup.',
  },
  pdftotext: {
    title: 'PDF to Text Converter Online Free - Extract Text | PDF Workshop',
    description: 'Extract all text from a PDF to a plain text file online for free. Fast, secure, no signup.',
  },
  pdftohtml: {
    title: 'PDF to HTML Converter Online Free | PDF Workshop',
    description: 'Convert PDF files to HTML web pages online for free. Keep layout, no registration required.',
  },
  pdftocsv: {
    title: 'PDF to CSV Converter Online Free - Extract Tables | PDF Workshop',
    description: 'Extract tables from a PDF to CSV online for free. Fast, secure, no signup required.',
  },
  pdftopdf_a: {
    title: 'PDF to PDF/A Converter Online Free - Archival PDF | PDF Workshop',
    description: 'Convert PDF to the PDF/A archival format for long-term storage online for free. No signup.',
  },
  extractimages: {
    title: 'Extract Images from PDF Online Free | PDF Workshop',
    description: 'Extract and download all embedded images from a PDF online for free. Fast, secure, no signup.',
  },
};

const DEFAULT_TITLE = 'PDF Tools Online Free | PDF Workshop';
const DEFAULT_DESCRIPTION =
  'Free online PDF tools - merge, split, compress, convert, edit and protect PDFs. No registration required.';

/** Returns the SEO entry for an /upload/:action page, with a sensible fallback. */
export function getUploadSeo(action: string | undefined): UploadSeoEntry & { url: string } {
  const key = (action ?? '').toLowerCase();
  const entry = uploadSeo[key];
  return {
    title: entry?.title ?? DEFAULT_TITLE,
    description: entry?.description ?? DEFAULT_DESCRIPTION,
    url: `${SITE_URL}/upload/${key}`,
  };
}
