import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPDFPage, Annotation } from '../../lib/pdf-utils';
import { ToolType, ToolState } from './PdfEditor';
import DrawingCanvas from './DrawingCanvas';

interface PdfPreviewProps {
  pdfDoc: PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  rotation: number;
  annotations: Annotation[];
  selectedTool: ToolType;
  toolState: ToolState;
  selectedAnnotationId: string | null;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onSelectAnnotation: (id: string | null) => void;
  onDeleteAnnotation: (id: string) => void;
}

export default function PdfPreview({
  pdfDoc,
  currentPage,
  zoom,
  rotation,
  annotations,
  selectedTool,
  toolState,
  selectedAnnotationId,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  onDeleteAnnotation,
}: PdfPreviewProps) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const renderPage = async () => {
      if (pdfCanvasRef.current) {
        setIsLoading(true);
        try {
          await renderPDFPage(pdfDoc, currentPage, pdfCanvasRef.current, zoom);
        } catch (error) {
          console.error('Failed to render PDF page:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    renderPage();
  }, [pdfDoc, currentPage, zoom]);

  return (
    <div className="flex-1 flex flex-col gap-3">
      <div className="flex-1 bg-slate-900 rounded-lg border border-slate-700 overflow-auto flex items-start justify-center p-8 relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-20 rounded-lg">
            <div className="flex items-center gap-3 text-white">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading page...
            </div>
          </div>
        )}
        <div className="relative inline-block" style={{ transform: `rotate(${rotation}deg)` }}>
          <canvas
            ref={pdfCanvasRef}
            className="shadow-2xl"
            style={{ display: 'block' }}
          />
          {!isLoading && (
            <DrawingCanvas
              canvasWidth={pdfCanvasRef.current?.width || 600}
              canvasHeight={pdfCanvasRef.current?.height || 800}
              selectedTool={selectedTool}
              toolState={toolState}
              annotations={annotations}
              currentPage={currentPage}
              zoom={zoom}
              selectedAnnotationId={selectedAnnotationId}
              onAddAnnotation={onAddAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
              onSelectAnnotation={onSelectAnnotation}
              onDeleteAnnotation={onDeleteAnnotation}
            />
          )}
        </div>
      </div>

      <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-xs text-slate-400 flex justify-between">
        <span>Page {currentPage} &bull; Zoom: {Math.round(zoom * 100)}%{rotation > 0 ? ` \u2022 Rotation: ${rotation}\u00b0` : ''}</span>
        <span>{annotations.filter(a => a.pageNum === currentPage).length} annotations on this page</span>
      </div>
    </div>
  );
}
