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
  pdfDoc, currentPage, zoom, rotation, annotations,
  selectedTool, toolState, selectedAnnotationId,
  onAddAnnotation, onUpdateAnnotation, onSelectAnnotation, onDeleteAnnotation,
}: PdfPreviewProps) {
  const pdfCanvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const renderPage = async () => {
      if (!pdfCanvasRef.current) return;
      setIsLoading(true);
      try {
        await renderPDFPage(pdfDoc, currentPage, pdfCanvasRef.current, zoom);
      } catch (error) {
        if (!cancelled) console.error('Failed to render:', error);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    renderPage();
    return () => { cancelled = true; };
  }, [pdfDoc, currentPage, zoom]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Canvas area */}
      <div className="flex-1 overflow-auto bg-slate-900/80 flex items-start justify-center p-2 sm:p-4 md:p-8 relative"
        style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(30,41,59,0.5) 0%, transparent 70%)' }}
      >
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-20">
            <div className="flex items-center gap-3 bg-slate-800/90 px-4 py-2 rounded-lg">
              <svg className="animate-spin h-4 w-4 text-blue-400" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="text-slate-300 text-sm">Loading page {currentPage}...</span>
            </div>
          </div>
        )}

        <div
          className="relative inline-block transition-transform duration-200"
          style={{ transform: `rotate(${rotation}deg)` }}
        >
          <canvas
            ref={pdfCanvasRef}
            className="shadow-2xl ring-1 ring-slate-700"
            style={{ display: 'block' }}
          />
          {!isLoading && pdfCanvasRef.current && (
            <DrawingCanvas
              canvasWidth={pdfCanvasRef.current.width}
              canvasHeight={pdfCanvasRef.current.height}
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
    </div>
  );
}
