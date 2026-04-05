import React from 'react';
import { ToolType, ToolState } from './PdfEditor';
import { Bold, Italic, Underline } from 'lucide-react';

interface ToolOptionsProps {
  selectedTool: ToolType;
  toolState: ToolState;
  onToolStateChange: (state: ToolState) => void;
}

const FONT_FAMILIES = [
  { label: 'Sans-serif', value: 'sans-serif' },
  { label: 'Serif', value: 'serif' },
  { label: 'Monospace', value: 'monospace' },
  { label: 'Arial', value: 'Arial, sans-serif' },
  { label: 'Georgia', value: 'Georgia, serif' },
  { label: 'Courier', value: 'Courier New, monospace' },
];

export default function ToolOptions({
  selectedTool,
  toolState,
  onToolStateChange,
}: ToolOptionsProps) {
  const update = (partial: Partial<ToolState>) => onToolStateChange({ ...toolState, ...partial });

  const showColor = selectedTool !== 'select' && selectedTool !== 'eraser' && selectedTool !== 'whiteout';
  const showStroke = ['pen', 'rectangle', 'circle', 'line', 'arrow'].includes(selectedTool);
  const showOpacity = showColor;
  const showFont = selectedTool === 'text';
  const showFill = ['rectangle', 'circle'].includes(selectedTool);

  if (selectedTool === 'select' || selectedTool === 'eraser') {
    return (
      <div className="p-3 border-b border-slate-700">
        <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
          {selectedTool === 'select' ? 'Select & Move' : 'Eraser'}
        </h3>
        <p className="text-xs text-slate-500">
          {selectedTool === 'select'
            ? 'Click to select, drag to move. Press Delete to remove.'
            : 'Click on any annotation to erase it.'}
        </p>
      </div>
    );
  }

  return (
    <div className="p-3 border-b border-slate-700 space-y-3 overflow-y-auto" style={{ maxHeight: '40vh' }}>
      <h3 className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Options</h3>

      {/* Color */}
      {showColor && (
        <div>
          <label className="text-[10px] text-slate-400 mb-1 block">Color</label>
          <div className="flex gap-1.5 flex-wrap">
            {['#ff0000', '#0000ff', '#00aa00', '#ffff00', '#ff00ff', '#00cccc', '#000000', '#ffffff'].map(
              (color) => (
                <button
                  key={color}
                  onClick={() => update({ color })}
                  className={`w-6 h-6 rounded border transition ${
                    toolState.color === color ? 'border-white ring-1 ring-blue-400' : 'border-slate-600'
                  }`}
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
          <input
            type="color"
            value={toolState.color}
            onChange={(e) => update({ color: e.target.value })}
            className="w-full h-7 mt-1.5 rounded cursor-pointer bg-transparent"
          />
        </div>
      )}

      {/* Stroke Width */}
      {showStroke && (
        <div>
          <label className="text-[10px] text-slate-400 mb-1 block">Stroke: {toolState.strokeWidth}px</label>
          <input
            type="range" min="1" max="20" value={toolState.strokeWidth}
            onChange={(e) => update({ strokeWidth: parseInt(e.target.value) })}
            className="w-full h-1.5"
          />
        </div>
      )}

      {/* Fill */}
      {showFill && (
        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={toolState.fill || false}
            onChange={(e) => update({ fill: e.target.checked })}
            className="rounded"
          />
          Fill shape
        </label>
      )}

      {/* Opacity */}
      {showOpacity && (
        <div>
          <label className="text-[10px] text-slate-400 mb-1 block">Opacity: {Math.round((toolState.opacity || 1) * 100)}%</label>
          <input
            type="range" min="0.1" max="1" step="0.1" value={toolState.opacity}
            onChange={(e) => update({ opacity: parseFloat(e.target.value) })}
            className="w-full h-1.5"
          />
        </div>
      )}

      {/* Font options for text tool */}
      {showFont && (
        <>
          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Font</label>
            <select
              value={toolState.fontFamily || 'sans-serif'}
              onChange={(e) => update({ fontFamily: e.target.value })}
              className="w-full bg-slate-700 border border-slate-600 text-slate-200 rounded px-2 py-1 text-xs"
            >
              {FONT_FAMILIES.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] text-slate-400 mb-1 block">Size: {toolState.fontSize || 16}px</label>
            <input
              type="range" min="8" max="72" value={toolState.fontSize || 16}
              onChange={(e) => update({ fontSize: parseInt(e.target.value) })}
              className="w-full h-1.5"
            />
          </div>

          <div className="flex gap-1.5">
            <button
              onClick={() => update({ fontWeight: toolState.fontWeight === 'bold' ? 'normal' : 'bold' })}
              className={`flex-1 p-1.5 rounded text-xs flex items-center justify-center gap-1 transition ${
                toolState.fontWeight === 'bold' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Bold size={14} />
            </button>
            <button
              onClick={() => update({ fontStyle: toolState.fontStyle === 'italic' ? 'normal' : 'italic' })}
              className={`flex-1 p-1.5 rounded text-xs flex items-center justify-center gap-1 transition ${
                toolState.fontStyle === 'italic' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Italic size={14} />
            </button>
            <button
              onClick={() => update({ textDecoration: toolState.textDecoration === 'underline' ? 'none' : 'underline' })}
              className={`flex-1 p-1.5 rounded text-xs flex items-center justify-center gap-1 transition ${
                toolState.textDecoration === 'underline' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
              }`}
            >
              <Underline size={14} />
            </button>
          </div>
        </>
      )}

      {/* Color preview */}
      {showColor && (
        <div className="p-2 rounded bg-slate-700 flex items-center gap-2">
          <div
            className="w-8 h-8 rounded border border-slate-600"
            style={{ backgroundColor: toolState.color, opacity: toolState.opacity }}
          />
          <span className="text-[10px] text-slate-400 font-mono">{toolState.color}</span>
        </div>
      )}
    </div>
  );
}
