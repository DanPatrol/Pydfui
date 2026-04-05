import React, { useState, useRef, useCallback, useEffect } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPDF, Annotation, annotationsToEdits } from '../../lib/pdf-utils';
import PdfPreview from './PdfPreview';
import PdfToolbar from './PdfToolbar';
import PageNavigator from './PageNavigator';
import ToolOptions from './ToolOptions';
import { Download, Upload, FileDown } from 'lucide-react';
import { API_BASE_URL } from '../../config';

export type ToolType =
  | 'select' | 'pen' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow'
  | 'highlight' | 'strikethrough' | 'whiteout' | 'comment' | 'eraser' | 'image';

export interface ToolState {
  color: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  textDecoration: 'none' | 'underline';
  fill: boolean;
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
  const [selectedTool, setSelectedTool] = useState<ToolType>('select');
  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [toolState, setToolState] = useState<ToolState>({
    color: '#ff0000',
    strokeWidth: 2,
    opacity: 1,
    fontSize: 16,
    fontFamily: 'sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textDecoration: 'none',
    fill: false,
  });
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Load PDF
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
      setSelectedAnnotationId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load PDF file.');
    }
  }, []);

  useEffect(() => {
    if (initialFile && !pdfDoc) handleFileUpload(initialFile);
  }, [initialFile, pdfDoc, handleFileUpload]);

  // History helpers
  const pushHistory = useCallback((newAnnotations: Annotation[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      trimmed.push(newAnnotations);
      setHistoryIndex(trimmed.length - 1);
      return trimmed;
    });
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
      setSelectedAnnotationId(null);
    }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setAnnotations(history[newIndex]);
      setSelectedAnnotationId(null);
    }
  }, [historyIndex, history]);

  // Annotation CRUD
  const addAnnotation = useCallback((annotation: Annotation) => {
    setAnnotations((prev) => {
      const next = [...prev, annotation];
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => {
      const next = prev.map((ann) => ann.id === id ? { ...ann, ...updates } : ann);
      pushHistory(next);
      return next;
    });
  }, [pushHistory]);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => {
      const next = prev.filter((ann) => ann.id !== id);
      pushHistory(next);
      return next;
    });
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  }, [pushHistory, selectedAnnotationId]);

  const clearPage = useCallback(() => {
    setAnnotations((prev) => {
      const next = prev.filter((ann) => ann.pageNum !== currentPage);
      pushHistory(next);
      return next;
    });
    setSelectedAnnotationId(null);
  }, [currentPage, pushHistory]);

  const clearAll = useCallback(() => {
    setAnnotations([]);
    pushHistory([]);
    setSelectedAnnotationId(null);
  }, [pushHistory]);

  // Zoom/Nav
  const handleZoomIn = useCallback(() => setZoom((prev) => Math.min(prev + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setZoom((prev) => Math.max(prev - 0.25, 0.5)), []);
  const handleRotate = useCallback(() => setRotation((prev) => (prev + 90) % 360), []);
  const handleNextPage = useCallback(() => { setCurrentPage((p) => Math.min(p + 1, totalPages)); setSelectedAnnotationId(null); }, [totalPages]);
  const handlePrevPage = useCallback(() => { setCurrentPage((p) => Math.max(p - 1, 1)); setSelectedAnnotationId(null); }, []);
  const handleGoToPage = useCallback((page: number) => { setCurrentPage(Math.max(1, Math.min(page, totalPages))); setSelectedAnnotationId(null); }, [totalPages]);

  // Image insertion
  const handleInsertImage = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleImageSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        // Scale to reasonable size
        const maxDim = 200;
        const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
        const annotation: Annotation = {
          id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type: 'image',
          pageNum: currentPage,
          x: 50,
          y: 50,
          width: img.width * ratio,
          height: img.height * ratio,
          color: 'transparent',
          opacity: 1,
          imageData: dataUrl,
          imageElement: img,
          timestamp: Date.now(),
        };
        addAnnotation(annotation);
        setSelectedTool('select');
        setSelectedAnnotationId(annotation.id);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [currentPage, addAnnotation]);

  // Save — convert annotations to backend format
  const handleSave = useCallback(async () => {
    if (!pdfFile || annotations.length === 0) return;
    setIsSaving(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('edits_json', JSON.stringify(annotationsToEdits(annotations)));

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
        setError(errData.detail || 'Failed to save');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsSaving(false);
    }
  }, [pdfFile, annotations]);

  // Export page as image
  const handleExportImage = useCallback(() => {
    const canvas = document.querySelector('canvas[style*="display: block"]') as HTMLCanvasElement;
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `page-${currentPage}.png`;
      link.click();
    }
  }, [currentPage]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture when typing in inputs
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedAnnotationId) {
          e.preventDefault();
          deleteAnnotation(selectedAnnotationId);
        }
      } else if (e.key === 'Escape') {
        setSelectedAnnotationId(null);
        setSelectedTool('select');
      } else if (e.key === 'v') { setSelectedTool('select'); }
      else if (e.key === 'p') { setSelectedTool('pen'); }
      else if (e.key === 't') { setSelectedTool('text'); }
      else if (e.key === 'r') { setSelectedTool('rectangle'); }
      else if (e.key === 'h') { setSelectedTool('highlight'); }
      else if (e.key === 'e') { setSelectedTool('eraser'); }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleSave, deleteAnnotation, selectedAnnotationId]);

  // Auto-save to localStorage
  useEffect(() => {
    if (pdfFile && annotations.length > 0) {
      try {
        const key = `pdf-editor-${pdfFile.name}-${pdfFile.size}`;
        const data = annotations.map(({ imageElement, ...rest }) => rest);
        localStorage.setItem(key, JSON.stringify(data));
      } catch { /* ignore quota errors */ }
    }
  }, [annotations, pdfFile]);

  return (
    <div className="flex h-screen gap-3 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-3">
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />

      {/* Left Sidebar */}
      <div className="flex flex-col w-60 bg-slate-800 rounded-lg border border-slate-700 overflow-hidden flex-shrink-0">
        <div className="p-3 border-b border-slate-700 bg-slate-900 flex items-center justify-between">
          <h1 className="text-sm font-bold text-white">PDF Editor</h1>
          {pdfDoc && <span className="text-[10px] text-slate-400">{annotations.length} edits</span>}
        </div>

        {/* File actions */}
        <div className="p-3 border-b border-slate-700 space-y-1.5">
          {error && (
            <div className="p-2 bg-red-900/30 border border-red-500/50 rounded text-red-300 text-[10px]">
              {error}
            </div>
          )}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <Upload size={14} /> {pdfDoc ? 'Change PDF' : 'Upload PDF'}
          </button>
          {pdfDoc && (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving || annotations.length === 0}
                className={`w-full px-3 py-1.5 rounded text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                  isSaving || annotations.length === 0
                    ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <Download size={14} /> {isSaving ? 'Saving...' : 'Save & Download'}
              </button>
              <button
                onClick={handleExportImage}
                className="w-full px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-[10px] font-medium transition flex items-center justify-center gap-1.5"
              >
                <FileDown size={12} /> Export Page as Image
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
            onInsertImage={handleInsertImage}
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

        {/* Keyboard shortcuts hint */}
        {pdfDoc && (
          <div className="p-2 border-t border-slate-700 text-[9px] text-slate-500 space-y-0.5">
            <div><kbd className="bg-slate-700 px-1 rounded">Ctrl+Z</kbd> Undo <kbd className="bg-slate-700 px-1 rounded">Ctrl+Y</kbd> Redo</div>
            <div><kbd className="bg-slate-700 px-1 rounded">Ctrl+S</kbd> Save <kbd className="bg-slate-700 px-1 rounded">Del</kbd> Delete</div>
            <div><kbd className="bg-slate-700 px-1 rounded">V</kbd> Select <kbd className="bg-slate-700 px-1 rounded">P</kbd> Pen <kbd className="bg-slate-700 px-1 rounded">T</kbd> Text <kbd className="bg-slate-700 px-1 rounded">R</kbd> Rect</div>
          </div>
        )}
      </div>

      {/* Main Preview */}
      {pdfDoc ? (
        <PdfPreview
          pdfDoc={pdfDoc}
          currentPage={currentPage}
          zoom={zoom}
          rotation={rotation}
          annotations={annotations}
          selectedTool={selectedTool}
          toolState={toolState}
          selectedAnnotationId={selectedAnnotationId}
          onAddAnnotation={addAnnotation}
          onUpdateAnnotation={updateAnnotation}
          onSelectAnnotation={setSelectedAnnotationId}
          onDeleteAnnotation={deleteAnnotation}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-slate-800 rounded-lg border-2 border-dashed border-slate-600">
          <div className="text-center max-w-md">
            <div className="text-4xl mb-4">📄</div>
            <p className="text-slate-300 text-lg mb-2 font-medium">Upload a PDF to start editing</p>
            <p className="text-slate-500 text-sm mb-6">
              Draw, add text, shapes, images, highlights, and annotations.
              <br />All edits are saved directly into the PDF.
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Choose PDF File
            </button>
            <p className="text-slate-600 text-xs mt-4">Supports any PDF file up to 15MB</p>
          </div>
        </div>
      )}
    </div>
  );
}
