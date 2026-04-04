import React from 'react';
import {
  Pencil,
  Type,
  Square,
  Circle,
  Minus,
  Highlighter,
  X,
  MessageSquare,
  Undo2,
  Redo2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Trash2,
  Trash,
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
  canUndo: boolean;
  canRedo: boolean;
}

const tools: { id: ToolType; label: string; icon: React.ReactNode; group: string }[] = [
  { id: 'pen', label: 'Pen', icon: <Pencil size={20} />, group: 'Drawing' },
  { id: 'text', label: 'Text', icon: <Type size={20} />, group: 'Drawing' },
  { id: 'rectangle', label: 'Rectangle', icon: <Square size={20} />, group: 'Shapes' },
  { id: 'circle', label: 'Circle', icon: <Circle size={20} />, group: 'Shapes' },
  { id: 'line', label: 'Line', icon: <Minus size={20} />, group: 'Shapes' },
  { id: 'highlight', label: 'Highlight', icon: <Highlighter size={20} />, group: 'Markup' },
  { id: 'strikethrough', label: 'Strikethrough', icon: <X size={20} />, group: 'Markup' },
  { id: 'comment', label: 'Comment', icon: <MessageSquare size={20} />, group: 'Markup' },
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
  canUndo,
  canRedo,
}: PdfToolbarProps) {
  const groups = ['Drawing', 'Shapes', 'Markup'];

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {groups.map((group) => (
        <div key={group}>
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">
            {group}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {tools
              .filter((tool) => tool.group === group)
              .map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className={`flex flex-col items-center justify-center p-2 rounded-md transition ${
                    selectedTool === tool.id
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                  title={tool.label}
                >
                  {tool.icon}
                  <span className="text-xs mt-1">{tool.label}</span>
                </button>
              ))}
          </div>
        </div>
      ))}

      <div className="border-t border-slate-700 pt-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">View</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button onClick={onZoomIn} className="flex items-center justify-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition text-sm">
            <ZoomIn size={16} /> Zoom In
          </button>
          <button onClick={onZoomOut} className="flex items-center justify-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition text-sm">
            <ZoomOut size={16} /> Zoom Out
          </button>
          <button onClick={onRotate} className="flex items-center justify-center gap-2 p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-md transition col-span-2 text-sm">
            <RotateCw size={16} /> Rotate
          </button>
        </div>

        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">History</h3>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <button
            onClick={onUndo}
            disabled={!canUndo}
            className={`flex items-center justify-center gap-2 p-2 rounded-md transition text-sm ${
              canUndo ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-900 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Undo2 size={16} /> Undo
          </button>
          <button
            onClick={onRedo}
            disabled={!canRedo}
            className={`flex items-center justify-center gap-2 p-2 rounded-md transition text-sm ${
              canRedo ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-slate-900 text-slate-600 cursor-not-allowed'
            }`}
          >
            <Redo2 size={16} /> Redo
          </button>
        </div>

        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Clear</h3>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={onClearPage} className="flex items-center justify-center gap-1 p-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-md transition text-sm">
            <Trash2 size={16} /> Page
          </button>
          <button onClick={onClearAll} className="flex items-center justify-center gap-1 p-2 bg-red-900 hover:bg-red-800 text-red-100 rounded-md transition text-sm">
            <Trash size={16} /> All
          </button>
        </div>
      </div>
    </div>
  );
}
