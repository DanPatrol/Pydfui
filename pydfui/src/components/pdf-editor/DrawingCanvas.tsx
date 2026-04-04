import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Annotation, generateId, redrawAnnotations, drawAnnotation } from '../../lib/pdf-utils';
import { ToolType, ToolState } from './PdfEditor';

interface DrawingCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  selectedTool: ToolType;
  toolState: ToolState;
  annotations: Annotation[];
  currentPage: number;
  zoom: number;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
}

export default function DrawingCanvas({
  canvasWidth,
  canvasHeight,
  selectedTool,
  toolState,
  annotations,
  currentPage,
  zoom,
  onAddAnnotation,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentDrawing, setCurrentDrawing] = useState<Annotation | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    redrawAnnotations(ctx, annotations, currentPage, zoom);
  }, [annotations, currentPage, zoom]);

  const getCanvasPos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      return {
        x: (e.clientX - rect.left) / zoom,
        y: (e.clientY - rect.top) / zoom,
      };
    },
    [zoom]
  );

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (selectedTool === 'text') {
      const pos = getCanvasPos(e);
      setTextPos(pos);
      setTextInput('');
      return;
    }

    const pos = getCanvasPos(e);
    setIsDrawing(true);

    if (selectedTool === 'pen') {
      const annotation: Annotation = {
        id: generateId(),
        type: 'drawing',
        pageNum: currentPage,
        x: pos.x,
        y: pos.y,
        color: toolState.color,
        opacity: toolState.opacity,
        strokeWidth: toolState.strokeWidth,
        points: [pos],
        timestamp: Date.now(),
      };
      setCurrentDrawing(annotation);
    } else if (selectedTool === 'highlight' || selectedTool === 'strikethrough') {
      const annotation: Annotation = {
        id: generateId(),
        type: selectedTool,
        pageNum: currentPage,
        x: pos.x,
        y: pos.y,
        color: toolState.color,
        opacity: toolState.opacity,
        width: 0,
        height: selectedTool === 'highlight' ? 20 : 10,
        timestamp: Date.now(),
      };
      setCurrentDrawing(annotation);
    } else if (['rectangle', 'circle', 'line'].includes(selectedTool)) {
      const annotation: Annotation = {
        id: generateId(),
        type: 'shape',
        pageNum: currentPage,
        x: pos.x,
        y: pos.y,
        color: toolState.color,
        opacity: toolState.opacity,
        strokeWidth: toolState.strokeWidth,
        width: 0,
        height: 0,
        shapeType: selectedTool as 'rectangle' | 'circle' | 'line',
        timestamp: Date.now(),
      };
      setCurrentDrawing(annotation);
    } else if (selectedTool === 'comment') {
      setTextInput('');
      setTextPos(pos);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !currentDrawing) return;

    const pos = getCanvasPos(e);
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (selectedTool === 'pen') {
      const updated = {
        ...currentDrawing,
        points: [...(currentDrawing.points || []), pos],
      };
      setCurrentDrawing(updated);
      redrawAnnotations(ctx, annotations, currentPage, zoom);
      drawAnnotation(ctx, updated, zoom);
    } else if (selectedTool === 'highlight' || selectedTool === 'strikethrough') {
      const updated = {
        ...currentDrawing,
        width: pos.x - currentDrawing.x,
        height: currentDrawing.height,
      };
      setCurrentDrawing(updated);
      redrawAnnotations(ctx, annotations, currentPage, zoom);
      drawAnnotation(ctx, updated, zoom);
    } else if (['rectangle', 'circle', 'line'].includes(selectedTool)) {
      const updated = {
        ...currentDrawing,
        width: pos.x - currentDrawing.x,
        height: pos.y - currentDrawing.y,
      };
      setCurrentDrawing(updated);
      redrawAnnotations(ctx, annotations, currentPage, zoom);
      drawAnnotation(ctx, updated, zoom);
    }
  };

  const handleMouseUp = () => {
    if (selectedTool !== 'text' && selectedTool !== 'comment' && currentDrawing) {
      onAddAnnotation(currentDrawing);
    }
    setIsDrawing(false);
    setCurrentDrawing(null);
  };

  const handleTextSubmit = () => {
    if (textPos && textInput.trim()) {
      const annotation: Annotation = {
        id: generateId(),
        type: selectedTool === 'comment' ? 'comment' : 'text',
        pageNum: currentPage,
        x: textPos.x,
        y: textPos.y,
        color: selectedTool === 'comment' ? '#ffeb3b' : toolState.color,
        opacity: toolState.opacity,
        content: textInput,
        timestamp: Date.now(),
      };
      onAddAnnotation(annotation);
      setTextInput('');
      setTextPos(null);
    } else {
      setTextInput('');
      setTextPos(null);
    }
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`absolute top-0 left-0 ${
          selectedTool === 'text' ? 'cursor-text' :
          selectedTool === 'comment' ? 'cursor-pointer' :
          'cursor-crosshair'
        }`}
        style={{ zIndex: 10 }}
      />

      {textPos && (
        <input
          autoFocus
          type="text"
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleTextSubmit();
            if (e.key === 'Escape') setTextPos(null);
          }}
          onBlur={handleTextSubmit}
          className="absolute bg-white border border-gray-400 rounded px-2 py-1 text-sm text-gray-900"
          style={{
            left: `${textPos.x * zoom}px`,
            top: `${textPos.y * zoom}px`,
            zIndex: 20,
          }}
          placeholder={selectedTool === 'comment' ? 'Add comment...' : 'Enter text...'}
        />
      )}
    </>
  );
}
