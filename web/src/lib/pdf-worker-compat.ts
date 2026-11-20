import { installPdfCompatibility } from './pdf-compat';

installPdfCompatibility();

// Must be dynamic: the compatibility layer has to run before PDF.js is evaluated.
await import('pdfjs-dist/legacy/build/pdf.worker.min.mjs');
