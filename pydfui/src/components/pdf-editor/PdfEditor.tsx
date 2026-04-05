import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { PDFDocumentProxy } from 'pdfjs-dist';
import { loadPDF, Annotation, annotationsToEdits, generateId } from '../../lib/pdf-utils';
import PdfPreview from './PdfPreview';
import TopToolbar from './TopToolbar';
import ToolOptions from './ToolOptions';
import PageThumbnails from './PageThumbnails';
import AnnotationList from './AnnotationList';
import SignaturePad from './SignaturePad';
import StampPicker, { StampConfig } from './StampPicker';
import { API_BASE_URL } from '../../config';

export type ToolType =
  | 'select' | 'pen' | 'text' | 'rectangle' | 'circle' | 'line' | 'arrow'
  | 'highlight' | 'strikethrough' | 'whiteout' | 'comment' | 'eraser' | 'image' | 'checkmark';

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
    color: '#ff0000', strokeWidth: 2, opacity: 1, fontSize: 16,
    fontFamily: 'sans-serif', fontWeight: 'normal', fontStyle: 'normal',
    textDecoration: 'none', fill: false,
  });
  const [history, setHistory] = useState<Annotation[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [showStampPicker, setShowStampPicker] = useState(false);
  const [showAnnotationList, setShowAnnotationList] = useState(false);
  const [showAllPagesInList, setShowAllPagesInList] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const addPagesInputRef = useRef<HTMLInputElement>(null);

  const annotationCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (const ann of annotations) counts[ann.pageNum] = (counts[ann.pageNum] || 0) + 1;
    return counts;
  }, [annotations]);

  // === FILE LOADING ===
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
      setError(err instanceof Error ? err.message : 'Failed to load PDF.');
    }
  }, []);

  useEffect(() => {
    if (initialFile && !pdfDoc) handleFileUpload(initialFile);
  }, [initialFile, pdfDoc, handleFileUpload]);

  // === HISTORY ===
  const pushHistory = useCallback((next: Annotation[]) => {
    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      trimmed.push(next);
      setHistoryIndex(trimmed.length - 1);
      return trimmed;
    });
  }, [historyIndex]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) { setHistoryIndex(historyIndex - 1); setAnnotations(history[historyIndex - 1]); setSelectedAnnotationId(null); }
  }, [historyIndex, history]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) { setHistoryIndex(historyIndex + 1); setAnnotations(history[historyIndex + 1]); setSelectedAnnotationId(null); }
  }, [historyIndex, history]);

  // === ANNOTATION CRUD ===
  const addAnnotation = useCallback((ann: Annotation) => {
    setAnnotations((prev) => { const next = [...prev, ann]; pushHistory(next); return next; });
  }, [pushHistory]);

  const updateAnnotation = useCallback((id: string, updates: Partial<Annotation>) => {
    setAnnotations((prev) => { const next = prev.map((a) => a.id === id ? { ...a, ...updates } : a); pushHistory(next); return next; });
  }, [pushHistory]);

  const deleteAnnotation = useCallback((id: string) => {
    setAnnotations((prev) => { const next = prev.filter((a) => a.id !== id); pushHistory(next); return next; });
    if (selectedAnnotationId === id) setSelectedAnnotationId(null);
  }, [pushHistory, selectedAnnotationId]);

  const clearPage = useCallback(() => {
    setAnnotations((prev) => { const next = prev.filter((a) => a.pageNum !== currentPage); pushHistory(next); return next; });
    setSelectedAnnotationId(null);
  }, [currentPage, pushHistory]);

  // === NAVIGATION ===
  const handleZoomIn = useCallback(() => setZoom((z) => Math.min(z + 0.25, 4)), []);
  const handleZoomOut = useCallback(() => setZoom((z) => Math.max(z - 0.25, 0.5)), []);
  const handleFitPage = useCallback(() => setZoom(1.2), []);
  const handleRotate = useCallback(() => setRotation((r) => (r + 90) % 360), []);
  const handleNextPage = useCallback(() => { setCurrentPage((p) => Math.min(p + 1, totalPages)); setSelectedAnnotationId(null); }, [totalPages]);
  const handlePrevPage = useCallback(() => { setCurrentPage((p) => Math.max(p - 1, 1)); setSelectedAnnotationId(null); }, []);
  const handleGoToPage = useCallback((page: number) => { setCurrentPage(Math.max(1, Math.min(page, totalPages))); setSelectedAnnotationId(null); }, [totalPages]);

  // === IMAGE INSERTION ===
  const handleInsertImage = useCallback(() => imageInputRef.current?.click(), []);
  const handleImageSelected = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const img = new Image();
      img.onload = () => {
        const ratio = Math.min(200 / img.width, 200 / img.height, 1);
        const ann: Annotation = {
          id: generateId(), type: 'image', pageNum: currentPage,
          x: 50, y: 50, width: img.width * ratio, height: img.height * ratio,
          color: 'transparent', opacity: 1, imageData: dataUrl, imageElement: img, timestamp: Date.now(),
        };
        addAnnotation(ann);
        setSelectedTool('select');
        setSelectedAnnotationId(ann.id);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  }, [currentPage, addAnnotation]);

  // === SIGNATURE ===
  const handleSignatureSave = useCallback((dataUrl: string) => {
    const img = new Image();
    img.onload = () => {
      const ratio = Math.min(180 / img.width, 1);
      const ann: Annotation = {
        id: generateId(), type: 'image', pageNum: currentPage,
        x: 100, y: 400, width: img.width * ratio, height: img.height * ratio,
        color: 'transparent', opacity: 1, imageData: dataUrl, imageElement: img, timestamp: Date.now(),
      };
      addAnnotation(ann);
      setSelectedTool('select');
      setSelectedAnnotationId(ann.id);
    };
    img.src = dataUrl;
    setShowSignaturePad(false);
  }, [currentPage, addAnnotation]);

  // === STAMP ===
  const handleStampSelect = useCallback((stamp: StampConfig) => {
    const canvas = document.createElement('canvas');
    canvas.width = 220; canvas.height = 60;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = stamp.bgColor;
    ctx.fillRect(0, 0, 220, 60);
    ctx.strokeStyle = stamp.borderColor;
    ctx.lineWidth = 3;
    ctx.strokeRect(2, 2, 216, 56);
    ctx.fillStyle = stamp.color;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(stamp.text, 110, 30);
    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      const ann: Annotation = {
        id: generateId(), type: 'image', pageNum: currentPage,
        x: 150, y: 100, width: 220, height: 60,
        color: 'transparent', opacity: 0.85, imageData: dataUrl, imageElement: img, timestamp: Date.now(),
      };
      addAnnotation(ann);
      setSelectedTool('select');
      setSelectedAnnotationId(ann.id);
    };
    img.src = dataUrl;
    setShowStampPicker(false);
  }, [currentPage, addAnnotation]);

  // === CHECKMARK ===
  const handleToolSelect = useCallback((tool: ToolType) => {
    if (tool === 'checkmark') {
      // Place a checkmark at center of current view
      const ann: Annotation = {
        id: generateId(), type: 'text', pageNum: currentPage,
        x: 200, y: 300, color: '#00aa00', opacity: 1,
        content: '\u2713', fontSize: 28, fontFamily: 'sans-serif',
        fontWeight: 'bold', fontStyle: 'normal', textDecoration: 'none',
        timestamp: Date.now(),
      };
      addAnnotation(ann);
      setSelectedTool('select');
      setSelectedAnnotationId(ann.id);
    } else {
      setSelectedTool(tool);
    }
  }, [currentPage, addAnnotation]);

  // === IN-EDITOR PDF OPERATIONS ===
  const reloadPdfFromBlob = useCallback(async (blob: Blob, name: string) => {
    const file = new File([blob], name, { type: 'application/pdf' });
    await handleFileUpload(file);
  }, [handleFileUpload]);

  const handleAddPages = useCallback(() => {
    addPagesInputRef.current?.click();
  }, []);

  const handleAddPagesSelected = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !pdfFile) return;
    e.target.value = '';
    setIsProcessing('Merging pages...');
    try {
      const formData = new FormData();
      formData.append('files', pdfFile);
      formData.append('files', file);
      const resp = await fetch(`${API_BASE_URL}/merge_pdfs`, { method: 'POST', body: formData });
      if (resp.ok) {
        const blob = await resp.blob();
        await reloadPdfFromBlob(blob, pdfFile.name);
      } else { setError('Failed to merge pages'); }
    } catch { setError('Network error'); }
    finally { setIsProcessing(null); }
  }, [pdfFile, reloadPdfFromBlob]);

  const handleDeletePage = useCallback(async () => {
    if (!pdfFile || totalPages <= 1) { setError('Cannot delete the only page'); return; }
    setIsProcessing(`Deleting page ${currentPage}...`);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('pages', currentPage.toString());
      const resp = await fetch(`${API_BASE_URL}/extract`, { method: 'POST', body: formData });
      if (resp.ok) {
        // The extract endpoint returns selected pages — we need the opposite
        // Use organize endpoint to skip a page
        const allPages = Array.from({ length: totalPages }, (_, i) => i + 1).filter(p => p !== currentPage);
        const formData2 = new FormData();
        formData2.append('file', pdfFile);
        formData2.append('pages_to_organize', allPages.join(','));
        const resp2 = await fetch(`${API_BASE_URL}/organize`, { method: 'POST', body: formData2 });
        if (resp2.ok) {
          const blob = await resp2.blob();
          await reloadPdfFromBlob(blob, pdfFile.name);
          if (currentPage > totalPages - 1) setCurrentPage(Math.max(1, totalPages - 1));
        } else { setError('Failed to delete page'); }
      } else { setError('Failed to delete page'); }
    } catch { setError('Network error'); }
    finally { setIsProcessing(null); }
  }, [pdfFile, currentPage, totalPages, reloadPdfFromBlob]);

  const handleCompressPdf = useCallback(async () => {
    if (!pdfFile) return;
    setIsProcessing('Compressing PDF...');
    try {
      const formData = new FormData();
      formData.append('files', pdfFile);
      formData.append('compression_level', '2');
      const resp = await fetch(`${API_BASE_URL}/compress`, { method: 'POST', body: formData });
      if (resp.ok) {
        const blob = await resp.blob();
        const origSize = pdfFile.size;
        const newSize = blob.size;
        await reloadPdfFromBlob(blob, pdfFile.name);
        const pct = Math.round((1 - newSize / origSize) * 100);
        setError(pct > 0 ? `Compressed! Reduced by ${pct}% (${(origSize / 1024).toFixed(0)}KB → ${(newSize / 1024).toFixed(0)}KB)` : 'PDF is already optimized');
      } else { setError('Compression failed'); }
    } catch { setError('Network error'); }
    finally { setIsProcessing(null); }
  }, [pdfFile, reloadPdfFromBlob]);

  const handleAddWatermark = useCallback(async () => {
    if (!pdfFile) return;
    const text = prompt('Enter watermark text:');
    if (!text) return;
    setIsProcessing('Adding watermark...');
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('watermark_text', text);
      formData.append('opacity', '0.3');
      formData.append('position', 'center');
      const resp = await fetch(`${API_BASE_URL}/add_watermark`, { method: 'POST', body: formData });
      if (resp.ok) {
        const blob = await resp.blob();
        await reloadPdfFromBlob(blob, pdfFile.name);
      } else { setError('Failed to add watermark'); }
    } catch { setError('Network error'); }
    finally { setIsProcessing(null); }
  }, [pdfFile, reloadPdfFromBlob]);

  const handleAddPageNumbers = useCallback(async () => {
    if (!pdfFile) return;
    setIsProcessing('Adding page numbers...');
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('position', 'bottom-center');
      formData.append('start_number', '1');
      const resp = await fetch(`${API_BASE_URL}/add_page_numbers`, { method: 'POST', body: formData });
      if (resp.ok) {
        const blob = await resp.blob();
        await reloadPdfFromBlob(blob, pdfFile.name);
      } else { setError('Failed to add page numbers'); }
    } catch { setError('Network error'); }
    finally { setIsProcessing(null); }
  }, [pdfFile, reloadPdfFromBlob]);

  // === DRAG & DROP ===
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file?.type === 'application/pdf') handleFileUpload(file);
  }, [handleFileUpload]);

  // === SAVE ===
  const handleSave = useCallback(async () => {
    if (!pdfFile || annotations.length === 0) return;
    setIsSaving(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('file', pdfFile);
      formData.append('edits_json', JSON.stringify(annotationsToEdits(annotations)));
      const response = await fetch(`${API_BASE_URL}/edit_pdf`, { method: 'POST', body: formData });
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `edited_${pdfFile.name}`;
        a.click();
        window.URL.revokeObjectURL(url);
      } else {
        const err = await response.json().catch(() => ({ detail: 'Save failed' }));
        setError(err.detail || 'Failed to save');
      }
    } catch { setError('Network error.'); }
    finally { setIsSaving(false); }
  }, [pdfFile, annotations]);

  const handleExportImage = useCallback(() => {
    const canvas = document.querySelector('canvas[style*="display: block"]') as HTMLCanvasElement;
    if (canvas) { const a = document.createElement('a'); a.href = canvas.toDataURL('image/png'); a.download = `page-${currentPage}.png`; a.click(); }
  }, [currentPage]);

  // === KEYBOARD SHORTCUTS ===
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); handleUndo(); }
      else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); handleRedo(); }
      else if (mod && e.key === 's') { e.preventDefault(); handleSave(); }
      else if ((e.key === 'Delete' || e.key === 'Backspace') && selectedAnnotationId) { e.preventDefault(); deleteAnnotation(selectedAnnotationId); }
      else if (e.key === 'Escape') { setSelectedAnnotationId(null); setSelectedTool('select'); }
      else if (e.key === 'v') setSelectedTool('select');
      else if (e.key === 'p') setSelectedTool('pen');
      else if (e.key === 't') setSelectedTool('text');
      else if (e.key === 'r') setSelectedTool('rectangle');
      else if (e.key === 'h') setSelectedTool('highlight');
      else if (e.key === 'e') setSelectedTool('eraser');
      else if (e.key === 'a') setSelectedTool('arrow');
      else if (e.key === 'l') setSelectedTool('line');
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleUndo, handleRedo, handleSave, deleteAnnotation, selectedAnnotationId]);

  // === AUTO-SAVE ===
  useEffect(() => {
    if (pdfFile && annotations.length > 0) {
      try {
        localStorage.setItem(
          `pdf-editor-${pdfFile.name}-${pdfFile.size}`,
          JSON.stringify(annotations.map(({ imageElement, ...rest }) => rest))
        );
      } catch { /* quota */ }
    }
  }, [annotations, pdfFile]);

  // === RENDER ===
  return (
    <div className="flex flex-col h-screen bg-slate-900">
      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept=".pdf" onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])} className="hidden" />
      <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageSelected} className="hidden" />
      <input ref={addPagesInputRef} type="file" accept=".pdf" onChange={handleAddPagesSelected} className="hidden" />

      {/* Error banner */}
      {error && (
        <div className="bg-red-900/50 border-b border-red-700 px-4 py-2 text-red-200 text-xs flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-200 ml-4">Dismiss</button>
        </div>
      )}

      {/* Processing overlay */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 border border-slate-600 rounded-xl px-8 py-6 flex items-center gap-4 shadow-2xl">
            <svg className="animate-spin h-6 w-6 text-blue-400" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-white text-sm font-medium">{isProcessing}</span>
          </div>
        </div>
      )}

      {/* Top Toolbar */}
      {pdfDoc && (
        <TopToolbar
          selectedTool={selectedTool}
          onSelectTool={handleToolSelect}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onFitPage={handleFitPage}
          onRotate={handleRotate}
          onClearPage={clearPage}
          onInsertImage={handleInsertImage}
          onOpenSignature={() => setShowSignaturePad(true)}
          onOpenStamp={() => setShowStampPicker(true)}
          onSave={handleSave}
          onUpload={() => fileInputRef.current?.click()}
          onExportImage={handleExportImage}
          onPrevPage={handlePrevPage}
          onNextPage={handleNextPage}
          onToggleAnnotationList={() => setShowAnnotationList(!showAnnotationList)}
          onAddPages={handleAddPages}
          onDeletePage={handleDeletePage}
          onCompressPdf={handleCompressPdf}
          onAddWatermark={handleAddWatermark}
          onAddPageNumbers={handleAddPageNumbers}
          currentPage={currentPage}
          totalPages={totalPages}
          zoom={zoom}
          canUndo={historyIndex > 0}
          canRedo={historyIndex < history.length - 1}
          isSaving={isSaving}
          annotationCount={annotations.length}
          showAnnotationList={showAnnotationList}
        />
      )}

      {/* Main content area */}
      <div className="flex-1 flex flex-col md:flex-row min-h-0">
        {/* Page Thumbnails (left) */}
        {pdfDoc && totalPages > 1 && (
          <div className="hidden md:flex">
            <PageThumbnails
              pdfDoc={pdfDoc}
              totalPages={totalPages}
              currentPage={currentPage}
              onGoToPage={handleGoToPage}
              annotationCounts={annotationCounts}
            />
          </div>
        )}

        {/* PDF Preview (center) */}
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
          <div
            className={`flex-1 flex items-center justify-center border-2 border-dashed transition-colors m-3 rounded-lg ${
              isDragOver ? 'bg-blue-900/30 border-blue-500' : 'bg-slate-800 border-slate-600'
            }`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
          >
            <div className="text-center max-w-md">
              {isDragOver ? (
                <>
                  <div className="text-5xl mb-4 animate-bounce">📥</div>
                  <p className="text-blue-300 text-lg font-medium">Drop PDF here</p>
                </>
              ) : (
                <>
                  <div className="text-5xl mb-6">📄</div>
                  <p className="text-slate-200 text-xl mb-2 font-semibold">PDF Editor</p>
                  <p className="text-slate-400 text-sm mb-8 leading-relaxed">
                    Draw, add text, shapes, images, signatures, stamps, and more.
                    <br />Drag & drop a PDF or click the button below.
                  </p>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-all hover:shadow-lg hover:shadow-blue-500/20"
                  >
                    Open PDF File
                  </button>
                  <p className="text-slate-600 text-xs mt-6">Supports any PDF up to 15MB</p>
                </>
              )}
            </div>
          </div>
        )}

        {/* Right panel: Tool Options + Annotation List */}
        {pdfDoc && (
          <div className="w-full md:w-56 flex flex-col flex-shrink-0 border-t md:border-t-0 md:border-l max-h-[40vh] md:max-h-none overflow-y-auto md:overflow-y-visible border-slate-700 bg-slate-800">
            {/* Tool Options (always visible when a tool is selected) */}
            <ToolOptions
              selectedTool={selectedTool}
              toolState={toolState}
              onToolStateChange={setToolState}
            />

            {/* Annotation List (togglable) */}
            {showAnnotationList && (
              <div className="flex-1 min-h-0 border-t border-slate-700 overflow-hidden flex flex-col">
                <AnnotationList
                  annotations={annotations}
                  currentPage={currentPage}
                  selectedId={selectedAnnotationId}
                  onSelect={setSelectedAnnotationId}
                  onDelete={deleteAnnotation}
                  onGoToPage={handleGoToPage}
                  showAllPages={showAllPagesInList}
                  onToggleAllPages={() => setShowAllPagesInList(!showAllPagesInList)}
                />
              </div>
            )}

            {/* Keyboard shortcuts (bottom) */}
            <div className="p-2 border-t border-slate-700 text-[9px] text-slate-500 space-y-0.5 mt-auto">
              <div><kbd className="bg-slate-700 px-1 rounded">Ctrl+Z</kbd> Undo <kbd className="bg-slate-700 px-1 rounded">Ctrl+Y</kbd> Redo <kbd className="bg-slate-700 px-1 rounded">Ctrl+S</kbd> Save</div>
              <div><kbd className="bg-slate-700 px-1 rounded">V</kbd> Select <kbd className="bg-slate-700 px-1 rounded">P</kbd> Pen <kbd className="bg-slate-700 px-1 rounded">T</kbd> Text <kbd className="bg-slate-700 px-1 rounded">R</kbd> Rect <kbd className="bg-slate-700 px-1 rounded">H</kbd> Hi-lite</div>
              <div><kbd className="bg-slate-700 px-1 rounded">A</kbd> Arrow <kbd className="bg-slate-700 px-1 rounded">L</kbd> Line <kbd className="bg-slate-700 px-1 rounded">E</kbd> Eraser <kbd className="bg-slate-700 px-1 rounded">Del</kbd> Delete</div>
            </div>
          </div>
        )}
      </div>

      {/* Status bar */}
      {pdfDoc && (
        <div className="bg-slate-800 border-t border-slate-700 px-4 py-1 text-[10px] text-slate-500 flex justify-between">
          <span>Page {currentPage} of {totalPages} &bull; Zoom {Math.round(zoom * 100)}%{rotation > 0 ? ` \u2022 ${rotation}\u00b0` : ''}</span>
          <span>{annotations.filter((a) => a.pageNum === currentPage).length} annotations on this page &bull; {annotations.length} total</span>
        </div>
      )}

      {/* Modals */}
      {showSignaturePad && <SignaturePad onSave={handleSignatureSave} onClose={() => setShowSignaturePad(false)} />}
      {showStampPicker && <StampPicker onSelect={handleStampSelect} onClose={() => setShowStampPicker(false)} />}
    </div>
  );
}
