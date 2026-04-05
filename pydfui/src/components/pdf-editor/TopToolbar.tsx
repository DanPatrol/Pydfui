import React, { useState } from 'react';
import {
  MousePointer2, Pencil, Type, Square, Circle, Minus, ArrowUpRight,
  Highlighter, X, RectangleHorizontal, MessageSquare, EraserIcon,
  ImagePlus, PenTool, Stamp, CheckSquare,
  Undo2, Redo2, ZoomIn, ZoomOut, Maximize, RotateCw,
  Download, Upload, FileDown, Trash2,
  ChevronLeft, ChevronRight, List,
  FilePlus, FileX, Minimize2, Droplets, Hash, Wrench,
} from 'lucide-react';
import { ToolType } from './PdfEditor';

interface TopToolbarProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitPage: () => void;
  onRotate: () => void;
  onClearPage: () => void;
  onInsertImage: () => void;
  onOpenSignature: () => void;
  onOpenStamp: () => void;
  onSave: () => void;
  onUpload: () => void;
  onExportImage: () => void;
  onPrevPage: () => void;
  onNextPage: () => void;
  onToggleAnnotationList: () => void;
  onAddPages: () => void;
  onDeletePage: () => void;
  onCompressPdf: () => void;
  onAddWatermark: () => void;
  onAddPageNumbers: () => void;
  currentPage: number;
  totalPages: number;
  zoom: number;
  canUndo: boolean;
  canRedo: boolean;
  isSaving: boolean;
  annotationCount: number;
  showAnnotationList: boolean;
}

interface ToolDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
}

const drawingTools: ToolDef[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2 size={16} />, shortcut: 'V' },
  { id: 'pen', label: 'Pen', icon: <Pencil size={16} />, shortcut: 'P' },
  { id: 'text', label: 'Text', icon: <Type size={16} />, shortcut: 'T' },
  { id: 'rectangle', label: 'Rectangle', icon: <Square size={16} />, shortcut: 'R' },
  { id: 'circle', label: 'Circle', icon: <Circle size={16} /> },
  { id: 'line', label: 'Line', icon: <Minus size={16} /> },
  { id: 'arrow', label: 'Arrow', icon: <ArrowUpRight size={16} /> },
];

const markupTools: ToolDef[] = [
  { id: 'highlight', label: 'Highlight', icon: <Highlighter size={16} />, shortcut: 'H' },
  { id: 'strikethrough', label: 'Strikethrough', icon: <X size={16} /> },
  { id: 'whiteout', label: 'Whiteout', icon: <RectangleHorizontal size={16} /> },
  { id: 'comment', label: 'Comment', icon: <MessageSquare size={16} /> },
  { id: 'checkmark', label: 'Checkmark', icon: <CheckSquare size={16} /> },
  { id: 'eraser', label: 'Eraser', icon: <EraserIcon size={16} />, shortcut: 'E' },
];

const insertTools: ToolDef[] = [
  { id: 'image', label: 'Image', icon: <ImagePlus size={16} /> },
  { id: 'signature', label: 'Signature', icon: <PenTool size={16} /> },
  { id: 'stamp', label: 'Stamp', icon: <Stamp size={16} /> },
];

function ToolButton({ tool, isActive, onClick }: { tool: ToolDef; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition-all ${
        isActive
          ? 'bg-blue-600 text-white shadow-md'
          : 'text-slate-300 hover:bg-slate-700 hover:text-white'
      }`}
      title={`${tool.label}${tool.shortcut ? ` (${tool.shortcut})` : ''}`}
    >
      {tool.icon}
      <span className="hidden xl:inline">{tool.label}</span>
    </button>
  );
}

function Divider() {
  return <div className="w-px h-5 bg-slate-600 mx-0.5 flex-shrink-0" />;
}

export default function TopToolbar({
  selectedTool, onSelectTool,
  onUndo, onRedo, onZoomIn, onZoomOut, onFitPage, onRotate,
  onClearPage, onInsertImage, onOpenSignature, onOpenStamp,
  onSave, onUpload, onExportImage,
  onPrevPage, onNextPage, onToggleAnnotationList,
  onAddPages, onDeletePage, onCompressPdf, onAddWatermark, onAddPageNumbers,
  currentPage, totalPages, zoom,
  canUndo, canRedo, isSaving, annotationCount, showAnnotationList,
}: TopToolbarProps) {
  const [showMoreMarkup, setShowMoreMarkup] = useState(false);
  const [showPdfTools, setShowPdfTools] = useState(false);

  const handleToolClick = (toolId: string) => {
    if (toolId === 'image') onInsertImage();
    else if (toolId === 'signature') onOpenSignature();
    else if (toolId === 'stamp') onOpenStamp();
    else onSelectTool(toolId as ToolType);
    setShowMoreMarkup(false);
  };

  return (
    <div className="bg-slate-800 border-b border-slate-700 px-2 py-1.5 flex items-center gap-0.5 sm:gap-1 overflow-x-auto scrollbar-hide">
      {/* File actions */}
      <button onClick={onUpload} className="flex items-center gap-1 px-2 py-1.5 text-slate-300 hover:bg-slate-700 rounded text-xs transition flex-shrink-0" title="Upload PDF">
        <Upload size={15} />
      </button>
      <button
        onClick={onSave}
        disabled={isSaving || annotationCount === 0}
        className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs transition flex-shrink-0 ${
          isSaving || annotationCount === 0 ? 'text-slate-600 cursor-not-allowed' : 'text-green-400 hover:bg-slate-700'
        }`}
        title="Save & Download (Ctrl+S)"
      >
        <Download size={15} />
        <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save'}</span>
      </button>
      <button onClick={onExportImage} className="flex items-center gap-1 px-2 py-1.5 text-slate-300 hover:bg-slate-700 rounded text-xs transition flex-shrink-0" title="Export Page as Image">
        <FileDown size={15} />
      </button>

      <Divider />

      {/* Undo/Redo */}
      <button onClick={onUndo} disabled={!canUndo} className={`p-1.5 rounded transition ${canUndo ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`} title="Undo (Ctrl+Z)">
        <Undo2 size={15} />
      </button>
      <button onClick={onRedo} disabled={!canRedo} className={`p-1.5 rounded transition ${canRedo ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 cursor-not-allowed'}`} title="Redo (Ctrl+Y)">
        <Redo2 size={15} />
      </button>

      <Divider />

      {/* Drawing tools */}
      {drawingTools.map((tool) => (
        <ToolButton key={tool.id} tool={tool} isActive={selectedTool === tool.id} onClick={() => handleToolClick(tool.id)} />
      ))}

      <Divider />

      {/* Markup tools (first 3 visible, rest in dropdown) */}
      {markupTools.slice(0, 3).map((tool) => (
        <ToolButton key={tool.id} tool={tool} isActive={selectedTool === tool.id} onClick={() => handleToolClick(tool.id)} />
      ))}
      <div className="relative">
        <button
          onClick={() => setShowMoreMarkup(!showMoreMarkup)}
          className="px-1.5 py-1.5 text-slate-400 hover:bg-slate-700 rounded text-xs transition"
          title="More markup tools"
        >
          ...
        </button>
        {showMoreMarkup && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowMoreMarkup(false)} />
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 py-1 min-w-[140px]">
              {markupTools.slice(3).map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs transition ${
                    selectedTool === tool.id ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {tool.icon} {tool.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <Divider />

      {/* Insert tools */}
      {insertTools.map((tool) => (
        <ToolButton key={tool.id} tool={tool} isActive={false} onClick={() => handleToolClick(tool.id)} />
      ))}

      <Divider />

      {/* Clear */}
      <button onClick={onClearPage} className="p-1.5 text-red-400/60 hover:text-red-400 hover:bg-slate-700 rounded transition" title="Clear page annotations">
        <Trash2 size={15} />
      </button>

      <Divider />

      {/* PDF Tools dropdown */}
      <div className="relative">
        <button
          onClick={() => setShowPdfTools(!showPdfTools)}
          className={`flex items-center gap-1 px-2 py-1.5 rounded text-xs font-medium transition ${
            showPdfTools ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-700'
          }`}
          title="PDF Tools"
        >
          <Wrench size={15} />
          <span className="hidden sm:inline">Tools</span>
        </button>
        {showPdfTools && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setShowPdfTools(false)} />
            <div className="absolute top-full left-0 mt-1 bg-slate-800 border border-slate-600 rounded-lg shadow-xl z-50 py-1 min-w-[180px]">
              <button onClick={() => { onAddPages(); setShowPdfTools(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition">
                <FilePlus size={14} /> Add Pages from PDF
              </button>
              <button onClick={() => { onDeletePage(); setShowPdfTools(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition">
                <FileX size={14} /> Delete Current Page
              </button>
              <div className="border-t border-slate-700 my-1" />
              <button onClick={() => { onCompressPdf(); setShowPdfTools(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition">
                <Minimize2 size={14} /> Compress PDF
              </button>
              <button onClick={() => { onAddWatermark(); setShowPdfTools(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition">
                <Droplets size={14} /> Add Watermark
              </button>
              <button onClick={() => { onAddPageNumbers(); setShowPdfTools(false); }} className="w-full flex items-center gap-2 px-3 py-2 text-xs text-slate-300 hover:bg-slate-700 transition">
                <Hash size={14} /> Add Page Numbers
              </button>
            </div>
          </>
        )}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Zoom controls */}
      <button onClick={onZoomOut} className="p-1.5 text-slate-300 hover:bg-slate-700 rounded transition" title="Zoom Out">
        <ZoomOut size={15} />
      </button>
      <span className="text-[10px] text-slate-400 w-10 text-center">{Math.round(zoom * 100)}%</span>
      <button onClick={onZoomIn} className="p-1.5 text-slate-300 hover:bg-slate-700 rounded transition" title="Zoom In">
        <ZoomIn size={15} />
      </button>
      <button onClick={onFitPage} className="p-1.5 text-slate-300 hover:bg-slate-700 rounded transition" title="Fit to Page">
        <Maximize size={15} />
      </button>
      <button onClick={onRotate} className="p-1.5 text-slate-300 hover:bg-slate-700 rounded transition" title="Rotate">
        <RotateCw size={15} />
      </button>

      <Divider />

      {/* Page navigation */}
      <button onClick={onPrevPage} disabled={currentPage <= 1} className={`p-1 rounded transition ${currentPage <= 1 ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-700'}`}>
        <ChevronLeft size={16} />
      </button>
      <span className="text-xs text-slate-300 min-w-[50px] text-center">{currentPage}/{totalPages}</span>
      <button onClick={onNextPage} disabled={currentPage >= totalPages} className={`p-1 rounded transition ${currentPage >= totalPages ? 'text-slate-600' : 'text-slate-300 hover:bg-slate-700'}`}>
        <ChevronRight size={16} />
      </button>

      <Divider />

      {/* Annotation list toggle */}
      <button
        onClick={onToggleAnnotationList}
        className={`p-1.5 rounded transition ${showAnnotationList ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-700'}`}
        title="Annotation List"
      >
        <List size={15} />
      </button>
    </div>
  );
}
