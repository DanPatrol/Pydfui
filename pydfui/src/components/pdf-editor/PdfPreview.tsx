import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { renderPDFPage, Annotation } from '../../lib/pdf-utils';
import { ToolType, ToolState } from './PdfEditor';
import DrawingCanvas from './DrawingCanvas';

interface PdfPreviewProps {
  pdfDoc: pdfjsLib.PDFDocumentProxy;
  currentPage: number;
  zoom: number;
  rotation: number;
  annotations: Annotation[];
  selectedTool: ToolType;
  toolState: ToolState;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
}

export default function PdfPreview({
  pdfDoc,
  currentPage,
  zoom,
  rotation,
  annotations,
  selectedTool,
  toolState,
  onAddAnnotation,
  onUpdateAnnotation,
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
    <div className="flex-1 flex flex-col gap-4">
      <div className="flex-1 bg-gradient-to-br from-slate-900 to-slate-800 rounded-lg border border-slate-700 overflow-auto flex items-center justify-center shadow-2xl relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-10 rounded-lg">
            <div className="text-white text-lg font-semibold">Loading PDF...</div>
          </div>
        )}
        <div className="relative" style={{ transform: `rotate(${rotation}deg)` }}>
          <canvas
            ref={pdfCanvasRef}
            className="max-w-full max-h-full shadow-lg border border-slate-600"
            style={{ filter: 'drop-shadow(0 10px 30px rgba(0,0,0,0.5))' }}
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
              onAddAnnotation={onAddAnnotation}
              onUpdateAnnotation={onUpdateAnnotation}
            />
          )}
        </div>
      </div>

      <div className="bg-slate-800 px-4 py-2 rounded-lg border border-slate-700 text-sm text-slate-400">
        <span>Page {currentPage} &bull; Zoom: {Math.round(zoom * 100)}% &bull; Rotation: {rotation}&deg;</span>
      </div>
    </div>
  );
}
