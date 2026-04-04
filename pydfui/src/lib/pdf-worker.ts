import { pdfjs } from 'react-pdf';

// Centralized PDF.js worker initialization - import this once in any component that uses react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();
