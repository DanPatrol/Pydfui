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
  type: 'drawing' | 'text' | 'shape' | 'highlight' | 'strikethrough' | 'comment' | 'image' | 'whiteout';
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
  shapeType?: 'rectangle' | 'circle' | 'line' | 'arrow';
  fill?: boolean;
  // Text properties
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline';
  // Image properties
  imageData?: string; // base64 data URL
  imageElement?: HTMLImageElement;
  timestamp: number;
}

// Hit-test: is a point inside an annotation's bounds?
export function hitTestAnnotation(
  ann: Annotation,
  px: number,
  py: number,
  tolerance: number = 8
): boolean {
  if (ann.type === 'drawing' && ann.points && ann.points.length > 1) {
    for (let i = 1; i < ann.points.length; i++) {
      const dx = ann.points[i].x - ann.points[i - 1].x;
      const dy = ann.points[i].y - ann.points[i - 1].y;
      const len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) continue;
      const t = Math.max(0, Math.min(1, ((px - ann.points[i - 1].x) * dx + (py - ann.points[i - 1].y) * dy) / (len * len)));
      const closestX = ann.points[i - 1].x + t * dx;
      const closestY = ann.points[i - 1].y + t * dy;
      const dist = Math.sqrt((px - closestX) ** 2 + (py - closestY) ** 2);
      if (dist < tolerance + (ann.strokeWidth || 2)) return true;
    }
    return false;
  }

  // For shapes, text, images, highlights etc — bounding box test
  const w = ann.width || (ann.type === 'text' ? estimateTextWidth(ann) : 50);
  const h = ann.height || (ann.type === 'text' ? (ann.fontSize || 16) * 1.5 : 50);
  const x = Math.min(ann.x, ann.x + (ann.width || 0));
  const y = Math.min(ann.y, ann.y + (ann.height || 0));
  const bw = Math.abs(w);
  const bh = Math.abs(h);

  return px >= x - tolerance && px <= x + bw + tolerance &&
         py >= y - tolerance && py <= y + bh + tolerance;
}

function estimateTextWidth(ann: Annotation): number {
  const text = ann.content || '';
  const fontSize = ann.fontSize || 16;
  return text.length * fontSize * 0.6;
}

// Get bounding box for resize handles
export function getAnnotationBounds(ann: Annotation): { x: number; y: number; w: number; h: number } {
  if (ann.type === 'drawing' && ann.points && ann.points.length > 0) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const p of ann.points) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
  }
  const w = ann.width || (ann.type === 'text' ? estimateTextWidth(ann) : 50);
  const h = ann.height || (ann.type === 'text' ? (ann.fontSize || 16) * 1.5 : 50);
  return { x: ann.x, y: ann.y, w, h };
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
  }).promise;
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function drawAnnotation(
  ctx: CanvasRenderingContext2D,
  annotation: Annotation,
  scale: number = 1.5,
  isSelected: boolean = false
): void {
  ctx.save();
  ctx.globalAlpha = annotation.opacity;
  ctx.fillStyle = annotation.color;
  ctx.strokeStyle = annotation.color;
  ctx.lineWidth = (annotation.strokeWidth || 2) * scale;

  switch (annotation.type) {
    case 'drawing':
      if (annotation.points && annotation.points.length > 0) {
        ctx.beginPath();
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
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
        if (annotation.fill) {
          ctx.fillRect(x, y, width, height);
        }
        ctx.strokeRect(x, y, width, height);
      } else if (annotation.shapeType === 'circle') {
        ctx.beginPath();
        ctx.arc(x + width / 2, y + height / 2, Math.abs(width) / 2, 0, Math.PI * 2);
        if (annotation.fill) ctx.fill();
        ctx.stroke();
      } else if (annotation.shapeType === 'line') {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + width, y + height);
        ctx.stroke();
      } else if (annotation.shapeType === 'arrow') {
        const endX = x + width;
        const endY = y + height;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(endX, endY);
        ctx.stroke();
        // Arrowhead
        const angle = Math.atan2(height, width);
        const headLen = 12 * scale;
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(angle - Math.PI / 6), endY - headLen * Math.sin(angle - Math.PI / 6));
        ctx.moveTo(endX, endY);
        ctx.lineTo(endX - headLen * Math.cos(angle + Math.PI / 6), endY - headLen * Math.sin(angle + Math.PI / 6));
        ctx.stroke();
      }
      break;
    }

    case 'text': {
      const fontSize = (annotation.fontSize || 16) * scale;
      const weight = annotation.fontWeight || 'normal';
      const style = annotation.fontStyle || 'normal';
      const family = annotation.fontFamily || 'sans-serif';
      ctx.font = `${style} ${weight} ${fontSize}px ${family}`;
      ctx.fillStyle = annotation.color;
      const lines = (annotation.content || '').split('\n');
      const lineHeight = fontSize * 1.3;
      for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], annotation.x * scale, (annotation.y + (annotation.fontSize || 16) * 0.8) * scale + i * lineHeight);
      }
      if (annotation.textDecoration === 'underline') {
        ctx.strokeStyle = annotation.color;
        ctx.lineWidth = 1 * scale;
        for (let i = 0; i < lines.length; i++) {
          const textWidth = ctx.measureText(lines[i]).width;
          const baseY = (annotation.y + (annotation.fontSize || 16)) * scale + i * lineHeight;
          ctx.beginPath();
          ctx.moveTo(annotation.x * scale, baseY);
          ctx.lineTo(annotation.x * scale + textWidth, baseY);
          ctx.stroke();
        }
      }
      break;
    }

    case 'highlight':
      ctx.fillStyle = annotation.color;
      ctx.globalAlpha = annotation.opacity * 0.4;
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

    case 'whiteout':
      ctx.fillStyle = '#ffffff';
      ctx.globalAlpha = 1;
      ctx.fillRect(
        annotation.x * scale,
        annotation.y * scale,
        (annotation.width || 50) * scale,
        (annotation.height || 20) * scale
      );
      break;

    case 'comment':
      ctx.fillStyle = '#ffeb3b';
      ctx.globalAlpha = 0.9;
      ctx.fillRect(annotation.x * scale, annotation.y * scale, 150 * scale, 80 * scale);
      ctx.strokeStyle = '#fbc02d';
      ctx.lineWidth = 2;
      ctx.strokeRect(annotation.x * scale, annotation.y * scale, 150 * scale, 80 * scale);
      ctx.fillStyle = '#333';
      ctx.globalAlpha = 1;
      ctx.font = `${12 * scale}px sans-serif`;
      const commentLines = (annotation.content || '').split('\n');
      for (let i = 0; i < Math.min(commentLines.length, 4); i++) {
        ctx.fillText(commentLines[i].slice(0, 25), (annotation.x + 5) * scale, (annotation.y + 15) * scale + i * 14 * scale);
      }
      break;

    case 'image':
      if (annotation.imageElement && annotation.imageElement.complete) {
        ctx.globalAlpha = annotation.opacity;
        ctx.drawImage(
          annotation.imageElement,
          annotation.x * scale,
          annotation.y * scale,
          (annotation.width || 100) * scale,
          (annotation.height || 100) * scale
        );
      }
      break;
  }

  // Draw selection outline
  if (isSelected) {
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#2563eb';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    const bounds = getAnnotationBounds(annotation);
    ctx.strokeRect(
      (bounds.x - 4) * scale,
      (bounds.y - 4) * scale,
      (bounds.w + 8) * scale,
      (bounds.h + 8) * scale
    );
    ctx.setLineDash([]);

    // Resize handles
    const handleSize = 6;
    ctx.fillStyle = '#2563eb';
    const corners = [
      { x: bounds.x - 4, y: bounds.y - 4 },
      { x: bounds.x + bounds.w + 4, y: bounds.y - 4 },
      { x: bounds.x - 4, y: bounds.y + bounds.h + 4 },
      { x: bounds.x + bounds.w + 4, y: bounds.y + bounds.h + 4 },
    ];
    for (const c of corners) {
      ctx.fillRect(
        c.x * scale - handleSize / 2,
        c.y * scale - handleSize / 2,
        handleSize,
        handleSize
      );
    }
  }

  ctx.restore();
}

export function redrawAnnotations(
  ctx: CanvasRenderingContext2D,
  annotations: Annotation[],
  currentPage: number,
  scale: number = 1.5,
  selectedId?: string | null
): void {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  annotations
    .filter((ann) => ann.pageNum === currentPage)
    .forEach((ann) => drawAnnotation(ctx, ann, scale, ann.id === selectedId));
}

// Convert frontend annotations to backend edit format
export function annotationsToEdits(annotations: Annotation[]): { edits: any[] } {
  const edits: any[] = [];

  for (const ann of annotations) {
    const pageNum = ann.pageNum - 1; // Backend uses 0-indexed pages

    if (ann.type === 'text') {
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
      };
      edits.push({
        edit_type: 'text',
        page_num: pageNum,
        data: {
          text: ann.content || '',
          x: ann.x,
          y: ann.y,
          font: ann.fontFamily === 'serif' ? 'tiro' : ann.fontFamily === 'monospace' ? 'cour' : 'helv',
          font_size: ann.fontSize || 16,
          color: hexToRgb(ann.color),
        },
      });
    } else if (ann.type === 'shape') {
      const hexToRgb = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255;
        const g = parseInt(hex.slice(3, 5), 16) / 255;
        const b = parseInt(hex.slice(5, 7), 16) / 255;
        return { r, g, b };
      };
      edits.push({
        edit_type: 'shape',
        page_num: pageNum,
        data: {
          shape_type: ann.shapeType || 'rectangle',
          coordinates: [ann.x, ann.y, ann.x + (ann.width || 50), ann.y + (ann.height || 50)],
          color: hexToRgb(ann.color),
          fill: ann.fill || false,
          width: ann.strokeWidth || 2,
        },
      });
    } else if (ann.type === 'drawing' && ann.points) {
      // Convert freehand drawing to a series of line shapes
      for (let i = 1; i < ann.points.length; i += 3) {
        const hexToRgb = (hex: string) => {
          const r = parseInt(hex.slice(1, 3), 16) / 255;
          const g = parseInt(hex.slice(3, 5), 16) / 255;
          const b = parseInt(hex.slice(5, 7), 16) / 255;
          return { r, g, b };
        };
        edits.push({
          edit_type: 'shape',
          page_num: pageNum,
          data: {
            shape_type: 'line',
            coordinates: [ann.points[i - 1].x, ann.points[i - 1].y, ann.points[i].x, ann.points[i].y],
            color: hexToRgb(ann.color),
            fill: false,
            width: ann.strokeWidth || 2,
          },
        });
      }
    } else if (ann.type === 'image' && ann.imageData) {
      // Strip data URL prefix to get raw base64
      const base64 = ann.imageData.replace(/^data:image\/\w+;base64,/, '');
      edits.push({
        edit_type: 'image',
        page_num: pageNum,
        data: {
          x: ann.x,
          y: ann.y,
          width: ann.width || 100,
          height: ann.height || 100,
          image_data: base64,
        },
      });
    } else if (ann.type === 'whiteout') {
      edits.push({
        edit_type: 'shape',
        page_num: pageNum,
        data: {
          shape_type: 'rectangle',
          coordinates: [ann.x, ann.y, ann.x + (ann.width || 50), ann.y + (ann.height || 20)],
          color: { r: 1, g: 1, b: 1 },
          fill: true,
          width: 0,
        },
      });
    } else if (ann.type === 'highlight') {
      edits.push({
        edit_type: 'shape',
        page_num: pageNum,
        data: {
          shape_type: 'rectangle',
          coordinates: [ann.x, ann.y, ann.x + (ann.width || 100), ann.y + (ann.height || 20)],
          color: { r: 1, g: 1, b: 0 },
          fill: true,
          width: 0,
        },
      });
    }
  }

  return { edits };
}
