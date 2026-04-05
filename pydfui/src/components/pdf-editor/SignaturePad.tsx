import React, { useRef, useState, useCallback, useEffect } from 'react';
import { X, Trash2, Check, PenTool, Type as TypeIcon } from 'lucide-react';

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onClose: () => void;
}

type SignatureMode = 'draw' | 'type';

const SIGNATURE_FONTS = [
  { name: 'Cursive', value: 'cursive' },
  { name: 'Brush Script', value: '"Brush Script MT", cursive' },
  { name: 'Georgia', value: 'Georgia, serif' },
  { name: 'Palatino', value: '"Palatino Linotype", serif' },
];

export default function SignaturePad({ onSave, onClose }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [mode, setMode] = useState<SignatureMode>('draw');
  const [typedName, setTypedName] = useState('');
  const [selectedFont, setSelectedFont] = useState(SIGNATURE_FONTS[0].value);
  const [penColor, setPenColor] = useState('#000000');

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = penColor;
    ctx.lineWidth = 2.5;
  }, [penColor]);

  const getPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
    }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (mode !== 'draw') return;
    e.preventDefault();
    setIsDrawing(true);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.beginPath();
    ctx.moveTo(pos.x, pos.y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || mode !== 'draw') return;
    e.preventDefault();
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const pos = getPos(e);
    ctx.strokeStyle = penColor;
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
    setHasContent(true);
  };

  const endDraw = () => setIsDrawing(false);

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasContent(false);
    setTypedName('');
  };

  const renderTypedSignature = useCallback(() => {
    if (mode !== 'type' || !typedName.trim()) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = penColor;
    ctx.font = `36px ${selectedFont}`;
    ctx.textBaseline = 'middle';
    ctx.fillText(typedName, 20, canvas.height / 2);
    setHasContent(true);
  }, [mode, typedName, selectedFont, penColor]);

  useEffect(() => {
    renderTypedSignature();
  }, [renderTypedSignature]);

  const handleSave = () => {
    const canvas = canvasRef.current;
    if (!canvas || !hasContent) return;
    // Export with transparency (trim white)
    const dataUrl = canvas.toDataURL('image/png');
    onSave(dataUrl);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-800 rounded-xl border border-slate-700 shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-700">
          <h2 className="text-white font-semibold">Add Signature</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition">
            <X size={20} />
          </button>
        </div>

        {/* Mode tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => { setMode('draw'); clearCanvas(); }}
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition ${
              mode === 'draw' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <PenTool size={16} /> Draw
          </button>
          <button
            onClick={() => { setMode('type'); clearCanvas(); }}
            className={`flex-1 p-3 text-sm font-medium flex items-center justify-center gap-2 transition ${
              mode === 'type' ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <TypeIcon size={16} /> Type
          </button>
        </div>

        {/* Canvas area */}
        <div className="p-4">
          {mode === 'type' && (
            <div className="mb-3 space-y-2">
              <input
                type="text"
                value={typedName}
                onChange={(e) => setTypedName(e.target.value)}
                placeholder="Type your name..."
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 text-white rounded text-sm focus:outline-none focus:border-blue-500"
                autoFocus
              />
              <div className="flex gap-2">
                {SIGNATURE_FONTS.map((font) => (
                  <button
                    key={font.value}
                    onClick={() => setSelectedFont(font.value)}
                    className={`flex-1 px-2 py-1.5 rounded text-xs transition ${
                      selectedFont === font.value ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                    style={{ fontFamily: font.value }}
                  >
                    {font.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg overflow-hidden border-2 border-dashed border-slate-400">
            <canvas
              ref={canvasRef}
              width={460}
              height={150}
              onMouseDown={startDraw}
              onMouseMove={draw}
              onMouseUp={endDraw}
              onMouseLeave={endDraw}
              onTouchStart={startDraw}
              onTouchMove={draw}
              onTouchEnd={endDraw}
              className={mode === 'draw' ? 'cursor-crosshair' : 'cursor-default'}
              style={{ touchAction: 'none' }}
            />
          </div>

          {mode === 'draw' && (
            <div className="flex items-center gap-3 mt-3">
              <span className="text-xs text-slate-400">Color:</span>
              {['#000000', '#0000ff', '#ff0000'].map((c) => (
                <button
                  key={c}
                  onClick={() => setPenColor(c)}
                  className={`w-6 h-6 rounded-full border-2 transition ${penColor === c ? 'border-white' : 'border-slate-600'}`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 p-4 border-t border-slate-700">
          <button
            onClick={clearCanvas}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-medium transition flex items-center gap-1.5"
          >
            <Trash2 size={14} /> Clear
          </button>
          <div className="flex-1" />
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded text-sm font-medium transition">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!hasContent}
            className={`px-4 py-2 rounded text-sm font-medium transition flex items-center gap-1.5 ${
              hasContent ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            <Check size={14} /> Place Signature
          </button>
        </div>
      </div>
    </div>
  );
}
