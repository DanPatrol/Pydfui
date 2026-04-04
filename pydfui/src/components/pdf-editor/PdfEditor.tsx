import React, { useState, useRef, useCallback } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPDF, Annotation } from '../../lib/pdf-utils';
import PdfPreview from './PdfPreview';
import PdfToolbar from './PdfToolbar';
import PageNavigator from './PageNavigator';
import ToolOptions from './ToolOptions';
import { Download, Upload } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export type ToolType = 'pen' | 'text' | 'rectangle' | 'circle' | 'line' | 'highlight' | 'strikethrough' | 'comment' | 'eraser';

export interface ToolState {
  color: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
}

interface PdfEditorProps {
  initialFile?: File | null;
}

export default function PdfEditor({ initialFile }: PdfEditorProps) {
  const [pdfDoc, setPdfDoc] = useState<PDFDocumentProxy | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(initialFile || null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [zoom, setZoom] = useState(1.5);
  const [rotation, setRotation] = useState(0);
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedTool, setSelectedTool] = useState<ToolType>('pen');
  const [toolState, setToolState] = useState<ToolState>({
    color: '#ff0000',
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16,
  });
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = useCallback(async (file: File) => {
    try {
      setError(null);
      const pdf = await loadPDF(file);
      setPdfDoc(pdf);
      setPdfFile(file);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);
      setAnnotations([]);
      setHistory([[]]);
      setHistoryIndex(0);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load PDF file.';
      console.error('Failed to load PDF:', error);
      setError(errorMessage);
    }
  }, []);

  // Load initial file if provided
  React.useEffect(() => {
    if (initialFile && !pdfDoc) {
      handleFileUpload(initialFile);
    }
  }, [initialFile, pdfDoc, handleFileUpload]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
    }
  }, [historyIndex, history]);

  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => {
      const newAnnotations = [...prev, annotation];
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAnnotations);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newAnnotations;
    });
  }, [history, historyIndex]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => {
      const newAnnotations = prev.map((ann) =>
        ann.id === id ? { ...ann, ...updates } : ann
      );
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAnnotations);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newAnnotations;
    });
  }, [history, historyIndex]);

  const clearPage = useCallback(() => {
    setAnnotations((prev) => {
      const newAnnotations = prev.filter((ann) => ann.pageNum !== currentPage);
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(newAnnotations);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return newAnnotations;
    });
  }, [currentPage, history, historyIndex]);

  const clearAll = useCallback(() => {
    setAnnotations([]);
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const handleZoomIn = useCallback(() => setZoom((prev) => Math.min(prev + 0.2, 3)), []);
  const handleZoomOut = useCallback(() => setZoom((prev) => Math.max(prev - 0.2, 0.5)), []);
  const handleRotate = useCallback(() => setRotation((prev) => (prev + 90) % 360), []);
  const handleNextPage = useCallback(() => setCurrentPage((prev) => Math.min(prev + 1, totalPages)), [totalPages]);
  const handlePrevPage = useCallback(() => setCurrentPage((prev) => Math.max(prev - 1, 1)), []);
  const handleGoToPage = useCallback((page: number) => setCurrentPage(Math.max(1, Math.min(page, totalPages))), [totalPages]);

  const handleExportAnnotations = useCallback(() => {
    const dataStr = JSON.stringify(annotations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `annotations-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }, [annotations]);

  const handleSaveEdited = useCallback(async () => {
    if (!pdfFile) return;

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('annotations', JSON.stringify(annotations));

      const response = await fetch(`${API_BASE_URL}/edit_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited_${pdfFile.name}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const errData = await response.json().catch(() => ({ detail: 'Save failed' }));
        setError(errData.detail || 'Failed to save edited PDF');
      }
    } catch (err) {
      console.error('Save error:', err);
      setError('Network error while saving. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [pdfFile, annotations]);

  const handleExportAsImage = useCallback(() => {
    const pdfCanvas = document.querySelector('canvas.shadow-lg') as HTMLCanvasElement;
    if (pdfCanvas) {
      const link = document.createElement('a');
      link.href = pdfCanvas.toDataURL('image/png');
      link.download = `page-${currentPage}-${Date.now()}.png`;
      link.click();
    }
  }, [currentPage]);

  return (
    <div className="flex h-screen gap-4 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      {/* Left Sidebar */}
      <div className="flex flex-col w-64 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex-shrink-0">
        <div className="p-4 border-b border-slate-700 bg-slate-900">
          <h1 className="text-lg font-bold text-white">PDF Editor</h1>
        </div>

        {/* File Upload */}
        <div className="p-4 border-b border-slate-700 space-y-2">
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-md text-red-300 text-sm">
              {error}
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition flex items-center justify-center gap-2"
          >
            <Upload size={16} /> Upload PDF
          </button>
          {pdfDoc && (
            <>
              <button
                onClick={handleSaveEdited}
                disabled={isSaving}
                className={`w-full px-4 py-2 ${isSaving ? 'bg-gray-600' : 'bg-green-600 hover:bg-green-700'} text-white rounded-md text-sm font-medium transition flex items-center justify-center gap-2`}
              >
                <Download size={16} /> {isSaving ? 'Saving...' : 'Save & Download'}
              </button>
              <button
                onClick={handleExportAnnotations}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-sm font-medium transition"
              >
                Export Annotations
              </button>
              <button
                onClick={handleExportAsImage}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md text-sm font-medium transition"
              >
                Export Page as Image
              </button>
            </>
          )}
        </div>

        {/* Tool Options */}
        {pdfDoc && (
          <ToolOptions
            selectedTool={selectedTool}
            toolState={toolState}
            onToolStateChange={setToolState}
          />
        )}

        {/* Toolbar */}
        {pdfDoc && (
          <PdfToolbar
            selectedTool={selectedTool}
            onSelectTool={setSelectedTool}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onZoomIn={handleZoomIn}
            onZoomOut={handleZoomOut}
            onRotate={handleRotate}
            onClearPage={clearPage}
            onClearAll={clearAll}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
        )}

        {/* Page Navigator */}
        {pdfDoc && (
          <PageNavigator
            currentPage={currentPage}
            totalPages={totalPages}
            onPrevPage={handlePrevPage}
            onNextPage={handleNextPage}
            onGoToPage={handleGoToPage}
            zoom={zoom}
          />
        )}
      </div>

      {/* Main Preview Area */}
      {pdfDoc ? (
        <PdfPreview
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          zoom={zoom}
          rotation={rotation}
          annotations={annotations}
          selectedTool={selectedTool}
          toolState={toolState}
          onAddAnnotation={addAnnotation}
          onUpdateAnnotation={updateAnnotation}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-lg border-2 border-dashed border-slate-600">
          <div className="text-center">
            <p className="text-slate-400 text-lg mb-4">Upload a PDF to start editing</p>
            <p className="text-slate-500 text-sm mb-6">Draw, annotate, add text, shapes, highlights, and comments</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium transition"
            >
              Choose PDF File
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
