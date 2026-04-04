import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString();
}

export interface Annotation {
  id: string;
  type: 'drawing' | 'text' | 'shape' | 'highlight' | 'strikethrough' | 'comment';
  pageNum: number;
  x: number;
  y: number;
  color: string;
  opacity: number;
  strokeWidth?: number;
  content?: string;
  points?: Array<{ x: number; y: number }>;
  width?: number;
  height?: number;
  shapeType?: 'rectangle' | 'circle' | 'line';
  timestamp: number;
}

export async function loadPDF(file: File): Promise<pdfjsLib.PDFDocumentProxy> {
  const arrayBuffer = await file.arrayBuffer();
  return pdfjsLib.getDocument({ data: arrayBuffer }).promise;
}

export async function renderPDFPage(
  pdf: pdfjsLib.PDFDocumentProxy,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale: number = 1.5
): Promise<void> {
  const page = await pdf.getPage(pageNum);
  const viewport = page.getViewport({ scale });

  canvas.width = viewport.width;
  canvas.height = viewport.height;

  const context = canvas.getContext('2d');
  if (!context) throw new Error('Failed to get canvas context');

  await page.render({
    canvasContext: context,
    viewport: viewport,
    canvas: canvas,
  } as any).promise;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  scale: number = 1.5
): void {
  ctx.globalAlpha = annotation.opacity;
  ctx.fillStyle = annotation.color;
  ctx.strokeStyle = annotation.color;
  ctx.lineWidth = (annotation.strokeWidth || 2) * scale;

  switch (annotation.type) {
    case 'drawing':
      if (annotation.points && annotation.points.length > 0) {
        ctx.beginPath();
        ctx.moveTo(annotation.points[0].x * scale, annotation.points[0].y * scale);
        for (let i = 1; i < annotation.points.length; i++) {
          ctx.lineTo(annotation.points[i].x * scale, annotation.points[i].y * scale);
        }
        ctx.stroke();
      }
      break;

    case 'shape': {
      const x = annotation.x * scale;
      const y = annotation.y * scale;
      const width = (annotation.width || 50) * scale;
      const height = (annotation.height || 50) * scale;

      if (annotation.shapeType === 'rectangle') {
        ctx.strokeRect(x, y, width, height);
      } else if (annotation.shapeType === 'circle') {
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, width / 2, 0, Math.PI * 2);
        ctx.stroke();
      } else if (annotation.shapeType === 'line') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
      }
      break;
    }

    case 'text':
      ctx.fillStyle = annotation.color;
      ctx.font = `${16 * scale}px sans-serif`;
      ctx.fillText(annotation.content || '', annotation.x * scale, annotation.y * scale);
      break;

    case 'highlight':
      ctx.fillStyle = annotation.color;
      ctx.fillRect(
        annotation.x * scale,
        annotation.y * scale,
        (annotation.width || 100) * scale,
        (annotation.height || 20) * scale
      );
      break;

    case 'strikethrough':
      ctx.strokeStyle = annotation.color;
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.moveTo(annotation.x * scale, (annotation.y + (annotation.height || 10) / 2) * scale);
      ctx.lineTo((annotation.x + (annotation.width || 100)) * scale, (annotation.y + (annotation.height || 10) / 2) * scale);
      ctx.stroke();
      break;

    case 'comment':
      ctx.fillStyle = '#ffeb3b';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(annotation.x * scale, annotation.y * scale, 120 * scale, 80 * scale);
      ctx.strokeStyle = '#fbc02d';
      ctx.lineWidth = 2;
      ctx.strokeRect(annotation.x * scale, annotation.y * scale, 120 * scale, 80 * scale);
      ctx.fillStyle = '#333';
      ctx.globalAlpha = 1;
      ctx.font = `${12 * scale}px sans-serif`;
      ctx.fillText(annotation.content || '', (annotation.x + 5) * scale, (annotation.y + 15) * scale);
      break;
  }

  ctx.globalAlpha = 1;
}

export function redrawAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  currentPage: number,
  scale: number = 1.5
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  annotations
    .filter((ann) => ann.pageNum === currentPage)
    .forEach((ann) => drawAnnotation(ctx, ann, scale));
}
