import React from 'react';
import { ToolType, ToolState } from './PdfEditor';

interface ToolOptionsProps {
  selectedTool: ToolType;
  toolState: ToolState;
  onToolStateChange: (state: ToolState) => void;
}

export default function ToolOptions({
  selectedTool,
  toolState,
  onToolStateChange,
}: ToolOptionsProps) {
  const handleColorChange = (color: string) => {
    onToolStateChange({ ...toolState, color });
  };

  const handleStrokeWidthChange = (strokeWidth: number) => {
    onToolStateChange({ ...toolState, strokeWidth });
  };

  const handleOpacityChange = (opacity: number) => {
    onToolStateChange({ ...toolState, opacity });
  };

  const handleFontSizeChange = (fontSize: number) => {
    onToolStateChange({ ...toolState, fontSize });
  };

  const showStrokeWidth = ['pen', 'rectangle', 'circle', 'line', 'highlight', 'strikethrough'].includes(selectedTool);
  const showFontSize = selectedTool === 'text';

  return (
    <div className="p-4 border-b border-slate-700 space-y-4">
      <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tool Options</h3>

      <div>
        <label className="text-xs text-slate-400 mb-2 block">Color</label>
        <div className="flex gap-2 flex-wrap">
          {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff', '#000000'].map(
            (color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded-md border-2 transition ${
                  toolState.color === color ? 'border-white' : 'border-slate-600 hover:border-slate-500'
                }`}
                style={{ backgroundColor: color }}
                title={color}
              />
            )
          )}
        </div>
        <div className="mt-2 flex gap-2">
          <input
            type="color"
            value={toolState.color}
            onChange={(e) => handleColorChange(e.target.value)}
            className="flex-1 h-8 rounded cursor-pointer"
          />
          <span className="text-xs text-slate-400 py-1">{toolState.color}</span>
        </div>
      </div>

      {showStrokeWidth && (
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Stroke Width</label>
          <input
            type="range"
            min="1"
            max="20"
            value={toolState.strokeWidth}
            onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value, 10))}
            className="w-full"
          />
          <div className="text-xs text-slate-400 mt-1">{toolState.strokeWidth}px</div>
        </div>
      )}

      <div>
        <label className="text-xs text-slate-400 mb-2 block">Opacity</label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={toolState.opacity}
          onChange={(e) => handleOpacityChange(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="text-xs text-slate-400 mt-1">{Math.round(toolState.opacity * 100)}%</div>
      </div>

      {showFontSize && (
        <div>
          <label className="text-xs text-slate-400 mb-2 block">Font Size</label>
          <input
            type="range"
            min="10"
            max="48"
            value={toolState.fontSize}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value, 10))}
            className="w-full"
          />
          <div className="text-xs text-slate-400 mt-1">{toolState.fontSize}px</div>
        </div>
      )}

      <div className="mt-4 p-3 rounded-md bg-slate-700 flex items-center gap-3">
        <div
          className="w-12 h-12 rounded-md border-2 border-slate-600"
          style={{ backgroundColor: toolState.color, opacity: toolState.opacity }}
        />
        <div className="text-xs text-slate-400">
          <div>Current Color</div>
          <div className="font-mono">{toolState.color}</div>
        </div>
      </div>
    </div>
  );
}
