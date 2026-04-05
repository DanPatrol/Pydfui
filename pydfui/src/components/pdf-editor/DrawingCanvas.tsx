import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Annotation, generateId, redrawAnnotations, drawAnnotation, hitTestAnnotation, getAnnotationBounds } from '../../lib/pdf-utils';
import { ToolType, ToolState } from './PdfEditor';

interface DrawingCanvasProps {
  canvasWidth: number;
  canvasHeight: number;
  selectedTool: ToolType;
  toolState: ToolState;
  annotations: Annotation[];
  currentPage: number;
  zoom: number;
  selectedAnnotationId: string | null;
  onAddAnnotation: (annotation: Annotation) => void;
  onUpdateAnnotation: (id: string, updates: Partial<Annotation>) => void;
  onSelectAnnotation: (id: string | null) => void;
  onDeleteAnnotation: (id: string) => void;
}

export default function DrawingCanvas({
  canvasWidth,
  canvasHeight,
  selectedTool,
  toolState,
  annotations,
  currentPage,
  zoom,
  selectedAnnotationId,
  onAddAnnotation,
  onUpdateAnnotation,
  onSelectAnnotation,
  onDeleteAnnotation,
}: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentDrawing, setCurrentDrawing] = useState<Annotation | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Redraw annotations
  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    redrawAnnotations(ctx, annotations, currentPage, zoom, selectedAnnotationId);
  }, [annotations, currentPage, zoom, selectedAnnotationId]);

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
    const pos = getCanvasPos(e);

    // SELECT tool — pick annotation or start move
    if (selectedTool === 'select') {
      const pageAnns = annotations.filter((a) => a.pageNum === currentPage);
      // Check in reverse order (top-most first)
      for (let i = pageAnns.length - 1; i >= 0; i--) {
        if (hitTestAnnotation(pageAnns[i], pos.x, pos.y)) {
          onSelectAnnotation(pageAnns[i].id);
          setIsDragging(true);
          setDragOffset({ x: pos.x - pageAnns[i].x, y: pos.y - pageAnns[i].y });
          return;
        }
      }
      onSelectAnnotation(null);
      return;
    }

    // TEXT tool — place textarea
    if (selectedTool === 'text' || selectedTool === 'comment') {
      setTextPos(pos);
      setTextInput('');
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }

    // ERASER tool — delete annotation under cursor
    if (selectedTool === 'eraser') {
      const pageAnns = annotations.filter((a) => a.pageNum === currentPage);
      for (let i = pageAnns.length - 1; i >= 0; i--) {
        if (hitTestAnnotation(pageAnns[i], pos.x, pos.y)) {
          onDeleteAnnotation(pageAnns[i].id);
          return;
        }
      }
      return;
    }

    // DRAWING tools
    setIsDrawing(true);

    if (selectedTool === 'pen') {
      setCurrentDrawing({
        id: generateId(), type: 'drawing', pageNum: currentPage,
        x: pos.x, y: pos.y, color: toolState.color, opacity: toolState.opacity,
        strokeWidth: toolState.strokeWidth, points: [pos], timestamp: Date.now(),
      });
    } else if (selectedTool === 'highlight' || selectedTool === 'strikethrough') {
      setCurrentDrawing({
        id: generateId(), type: selectedTool, pageNum: currentPage,
        x: pos.x, y: pos.y, color: selectedTool === 'highlight' ? '#ffff00' : toolState.color,
        opacity: selectedTool === 'highlight' ? 0.4 : toolState.opacity,
        width: 0, height: selectedTool === 'highlight' ? 20 : 3, timestamp: Date.now(),
      });
    } else if (selectedTool === 'whiteout') {
      setCurrentDrawing({
        id: generateId(), type: 'whiteout', pageNum: currentPage,
        x: pos.x, y: pos.y, color: '#ffffff', opacity: 1,
        width: 0, height: 0, timestamp: Date.now(),
      });
    } else if (['rectangle', 'circle', 'line', 'arrow'].includes(selectedTool)) {
      setCurrentDrawing({
        id: generateId(), type: 'shape', pageNum: currentPage,
        x: pos.x, y: pos.y, color: toolState.color, opacity: toolState.opacity,
        strokeWidth: toolState.strokeWidth, width: 0, height: 0,
        shapeType: selectedTool as any, fill: toolState.fill, timestamp: Date.now(),
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);

    // Dragging selected annotation
    if (isDragging && selectedAnnotationId) {
      onUpdateAnnotation(selectedAnnotationId, {
        x: pos.x - dragOffset.x,
        y: pos.y - dragOffset.y,
      });
      return;
    }

    if (!isDrawing || !currentDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;

    if (selectedTool === 'pen') {
      const updated = { ...currentDrawing, points: [...(currentDrawing.points || []), pos] };
      setCurrentDrawing(updated);
      redrawAnnotations(ctx, annotations, currentPage, zoom, selectedAnnotationId);
      drawAnnotation(ctx, updated, zoom);
    } else {
      const updated = {
        ...currentDrawing,
        width: pos.x - currentDrawing.x,
        height: selectedTool === 'highlight' || selectedTool === 'strikethrough'
          ? currentDrawing.height
          : pos.y - currentDrawing.y,
      };
      setCurrentDrawing(updated);
      redrawAnnotations(ctx, annotations, currentPage, zoom, selectedAnnotationId);
      drawAnnotation(ctx, updated, zoom);
    }
  };

  const handleMouseUp = () => {
    if (isDragging) {
      setIsDragging(false);
      return;
    }
    if (currentDrawing && selectedTool !== 'text' && selectedTool !== 'comment') {
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
        fontFamily: toolState.fontFamily,
        fontSize: toolState.fontSize,
        fontWeight: toolState.fontWeight,
        fontStyle: toolState.fontStyle,
        textDecoration: toolState.textDecoration,
        timestamp: Date.now(),
      };
      onAddAnnotation(annotation);
    }
    setTextInput('');
    setTextPos(null);
  };

  const getCursor = () => {
    switch (selectedTool) {
      case 'select': return 'default';
      case 'text': case 'comment': return 'text';
      case 'eraser': return 'crosshair';
      default: return 'crosshair';
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
        className="absolute top-0 left-0"
        style={{ zIndex: 10, cursor: getCursor() }}
      />

      {/* Multi-line text input */}
      {textPos && (
        <textarea
          ref={textareaRef}
          autoFocus
          value={textInput}
          onChange={(e) => setTextInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') { setTextPos(null); setTextInput(''); }
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleTextSubmit(); }
          }}
          onBlur={handleTextSubmit}
          className="absolute bg-white border-2 border-blue-500 rounded px-2 py-1 text-sm text-gray-900 shadow-lg resize"
          style={{
            left: `${textPos.x * zoom}px`,
            top: `${textPos.y * zoom}px`,
            zIndex: 20,
            minWidth: 180,
            minHeight: selectedTool === 'comment' ? 60 : 32,
            fontFamily: toolState.fontFamily || 'sans-serif',
            fontSize: `${toolState.fontSize || 16}px`,
            fontWeight: toolState.fontWeight || 'normal',
            fontStyle: toolState.fontStyle || 'normal',
          }}
          placeholder={selectedTool === 'comment' ? 'Add comment... (Enter to save, Shift+Enter for new line)' : 'Type text... (Enter to save, Shift+Enter for new line)'}
        />
      )}
    </>
  );
}
