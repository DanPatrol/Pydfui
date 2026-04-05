import React from 'react';
import {
  Pencil, Type, Square, Circle, Minus, Highlighter, X, MessageSquare,
  Undo2, Redo2, ZoomIn, ZoomOut, RotateCw, Trash2, Trash,
  MousePointer2, ArrowUpRight, EraserIcon, RectangleHorizontal, ImagePlus,
} from 'lucide-react';
import { ToolType } from './PdfEditor';

interface PdfToolbarProps {
  selectedTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onRotate: () => void;
  onClearPage: () => void;
  onClearAll: () => void;
  onInsertImage: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { id: ToolType; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'select', label: 'Select', icon: <MousePointer2 size={18} />, group: 'General' },
  { id: 'pen', label: 'Pen', icon: <Pencil size={18} />, group: 'Drawing' },
  { id: 'text', label: 'Text', icon: <Type size={18} />, group: 'Drawing' },
  { id: 'image', label: 'Image', icon: <ImagePlus size={18} />, group: 'Drawing' },
  { id: 'rectangle', label: 'Rectangle', icon: <Square size={18} />, group: 'Shapes' },
  { id: 'circle', label: 'Circle', icon: <Circle size={18} />, group: 'Shapes' },
  { id: 'line', label: 'Line', icon: <Minus size={18} />, group: 'Shapes' },
  { id: 'arrow', label: 'Arrow', icon: <ArrowUpRight size={18} />, group: 'Shapes' },
  { id: 'highlight', label: 'Highlight', icon: <Highlighter size={18} />, group: 'Markup' },
  { id: 'strikethrough', label: 'Strike', icon: <X size={18} />, group: 'Markup' },
  { id: 'whiteout', label: 'Whiteout', icon: <RectangleHorizontal size={18} />, group: 'Markup' },
  { id: 'comment', label: 'Comment', icon: <MessageSquare size={18} />, group: 'Markup' },
  { id: 'eraser', label: 'Eraser', icon: <EraserIcon size={18} />, group: 'Markup' },
];

export default function PdfToolbar({
  selectedTool,
  onSelectTool,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onRotate,
  onClearPage,
  onClearAll,
  onInsertImage,
  canUndo,
  canRedo,
}: PdfToolbarProps) {
  const groups = ['General', 'Drawing', 'Shapes', 'Markup'];

  const handleToolClick = (toolId: ToolType) => {
    if (toolId === 'image') {
      onInsertImage();
    } else {
      onSelectTool(toolId);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-3 space-y-3">
      {groups.map((group) => (
        <div key={group}>
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
            {group}
          </h3>
          <div className="grid grid-cols-2 gap-1.5">
            {tools
              .filter((tool) => tool.group === group)
              .map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id)}
                  className={`flex flex-col items-center justify-center p-1.5 rounded-md transition text-xs ${
                    selectedTool === tool.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title={tool.label}
                >
                  {tool.icon}
                  <span className="text-[10px] mt-0.5">{tool.label}</span>
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="border-t border-slate-700 pt-3 space-y-3">
        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">View</h3>
          <div className="grid grid-cols-3 gap-1.5">
            <button onClick={onZoomIn} className="flex items-center justify-center gap-1 p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition text-[10px]">
              <ZoomIn size={14} />
            </button>
            <button onClick={onZoomOut} className="flex items-center justify-center gap-1 p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition text-[10px]">
              <ZoomOut size={14} />
            </button>
            <button onClick={onRotate} className="flex items-center justify-center gap-1 p-1.5 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition text-[10px]">
              <RotateCw size={14} />
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">History</h3>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center justify-center gap-1 p-1.5 rounded-md transition text-[10px] ${
                canUndo ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Undo2 size={14} /> Undo
            </button>
            <button
              onClick={onRedo}
              disabled={!canRedo}
              className={`flex items-center justify-center gap-1 p-1.5 rounded-md transition text-[10px] ${
                canRedo ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              <Redo2 size={14} /> Redo
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">Clear</h3>
          <div className="grid grid-cols-2 gap-1.5">
            <button onClick={onClearPage} className="flex items-center justify-center gap-1 p-1.5 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-md transition text-[10px]">
              <Trash2 size={14} /> Page
            </button>
            <button onClick={onClearAll} className="flex items-center justify-center gap-1 p-1.5 bg-red-900/50 hover:bg-red-800 text-red-200 rounded-md transition text-[10px]">
              <Trash size={14} /> All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
