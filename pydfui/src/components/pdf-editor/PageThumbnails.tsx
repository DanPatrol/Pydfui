import React, { useEffect, useRef, useState } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPDFPage } from '../../lib/pdf-utils';

interface PageThumbnailsProps {
  pdfDoc: PDFDocumentProxy;
  totalPages: number;
  currentPage: number;
  onGoToPage: (page: number) => void;
  annotationCounts: Record<number, number>;
}

export default function PageThumbnails({
  pdfDoc,
  totalPages,
  currentPage,
  onGoToPage,
  annotationCounts,
}: PageThumbnailsProps) {
  const [thumbnails, setThumbnails] = useState<Record<number, string>>({});
  const renderingRef = useRef(false);

  useEffect(() => {
    if (renderingRef.current) return;
    renderingRef.current = true;

    const generateThumbnails = async () => {
      const canvas = document.createElement('canvas');
      const newThumbnails: Record<number, string> = {};

      for (let i = 1; i <= Math.min(totalPages, 50); i++) {
        try {
          await renderPDFPage(pdfDoc, i, canvas, 0.3);
          newThumbnails[i] = canvas.toDataURL('image/jpeg', 0.6);
        } catch {
          // Skip failed pages
        }
      }
      setThumbnails(newThumbnails);
      renderingRef.current = false;
    };

    generateThumbnails();
  }, [pdfDoc, totalPages]);

  return (
    <div className="w-24 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex flex-col flex-shrink-0">
      <div className="p-2 border-b border-slate-700 bg-slate-900">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider text-center">Pages</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onGoToPage(page)}
            className={`w-full rounded overflow-hidden border-2 transition relative ${
              page === currentPage
                ? 'border-blue-500 ring-1 ring-blue-400'
                : 'border-transparent hover:border-slate-500'
            }`}
          >
            {thumbnails[page] ? (
              <img src={thumbnails[page]} alt={`Page ${page}`} className="w-full" />
            ) : (
              <div className="w-full aspect-[3/4] bg-slate-700 flex items-center justify-center">
                <span className="text-slate-500 text-xs">{page}</span>
              </div>
            )}
            <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-center">
              <span className={`text-[9px] font-medium ${page === currentPage ? 'text-blue-300' : 'text-slate-300'}`}>
                {page}
              </span>
              {(annotationCounts[page] || 0) > 0 && (
                <span className="ml-1 text-[8px] text-yellow-400">
                  ({annotationCounts[page]})
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
