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

type ResizeHandle = 'nw' | 'ne' | 'sw' | 'se' | null;

function getResizeHandle(ann: Annotation, px: number, py: number, tolerance: number = 8): ResizeHandle {
  const b = getAnnotationBounds(ann);
  const corners: { handle: ResizeHandle; x: number; y: number }[] = [
    { handle: 'nw', x: b.x - 4, y: b.y - 4 },
    { handle: 'ne', x: b.x + b.w + 4, y: b.y - 4 },
    { handle: 'sw', x: b.x - 4, y: b.y + b.h + 4 },
    { handle: 'se', x: b.x + b.w + 4, y: b.y + b.h + 4 },
  ];
  for (const c of corners) {
    if (Math.abs(px - c.x) < tolerance && Math.abs(py - c.y) < tolerance) return c.handle;
  }
  return null;
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
  const [resizeHandle, setResizeHandle] = useState<ResizeHandle>(null);
  const [resizeOrigin, setResizeOrigin] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [currentDrawing, setCurrentDrawing] = useState<Annotation | null>(null);
  const [textInput, setTextInput] = useState('');
  const [textPos, setTextPos] = useState<{ x: number; y: number } | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;
    redrawAnnotations(ctx, annotations, currentPage, zoom, selectedAnnotationId);
  }, [annotations, currentPage, zoom, selectedAnnotationId]);

  const getPos = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const canvas = canvasRef.current;
      if (!canvas) return { x: 0, y: 0 };
      const rect = canvas.getBoundingClientRect();
      let clientX: number, clientY: number;
      if ('touches' in e && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else if ('changedTouches' in e && e.changedTouches.length > 0) {
        clientX = e.changedTouches[0].clientX;
        clientY = e.changedTouches[0].clientY;
      } else if ('clientX' in e) {
        clientX = e.clientX;
        clientY = e.clientY;
      } else {
        return { x: 0, y: 0 };
      }
      return { x: (clientX - rect.left) / zoom, y: (clientY - rect.top) / zoom };
    },
    [zoom]
  );

  const handlePointerDown = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    const pos = getPos(e);

    if (selectedTool === 'select') {
      // Check resize handles first
      if (selectedAnnotationId) {
        const ann = annotations.find((a) => a.id === selectedAnnotationId);
        if (ann) {
          const handle = getResizeHandle(ann, pos.x, pos.y);
          if (handle) {
            setResizeHandle(handle);
            const b = getAnnotationBounds(ann);
            setResizeOrigin({ x: ann.x, y: ann.y, w: b.w, h: b.h });
            setDragOffset(pos);
            return;
          }
        }
      }
      // Check annotation hit
      const pageAnns = annotations.filter((a) => a.pageNum === currentPage);
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

    if (selectedTool === 'text' || selectedTool === 'comment') {
      setTextPos(pos);
      setTextInput('');
      setTimeout(() => textareaRef.current?.focus(), 50);
      return;
    }

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

    // Drawing tools
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

  const handlePointerMove = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault();
    const pos = getPos(e);

    // Resizing
    if (resizeHandle && selectedAnnotationId && resizeOrigin) {
      const dx = pos.x - dragOffset.x;
      const dy = pos.y - dragOffset.y;
      const updates: Partial<Annotation> = {};

      if (resizeHandle === 'se') {
        updates.width = resizeOrigin.w + dx;
        updates.height = resizeOrigin.h + dy;
      } else if (resizeHandle === 'sw') {
        updates.x = resizeOrigin.x + dx;
        updates.width = resizeOrigin.w - dx;
        updates.height = resizeOrigin.h + dy;
      } else if (resizeHandle === 'ne') {
        updates.y = resizeOrigin.y + dy;
        updates.width = resizeOrigin.w + dx;
        updates.height = resizeOrigin.h - dy;
      } else if (resizeHandle === 'nw') {
        updates.x = resizeOrigin.x + dx;
        updates.y = resizeOrigin.y + dy;
        updates.width = resizeOrigin.w - dx;
        updates.height = resizeOrigin.h - dy;
      }
      onUpdateAnnotation(selectedAnnotationId, updates);
      return;
    }

    // Dragging
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

  const handlePointerUp = (e?: React.MouseEvent | React.TouchEvent) => {
    if (e && 'touches' in e) e.preventDefault();
    if (resizeHandle) {
      setResizeHandle(null);
      setResizeOrigin(null);
      return;
    }
    if (isDragging) { setIsDragging(false); return; }
    if (currentDrawing && selectedTool !== 'text' && selectedTool !== 'comment') {
      onAddAnnotation(currentDrawing);
    }
    setIsDrawing(false);
    setCurrentDrawing(null);
  };

  const handleTextSubmit = () => {
    if (textPos && textInput.trim()) {
      onAddAnnotation({
        id: generateId(),
        type: selectedTool === 'comment' ? 'comment' : 'text',
        pageNum: currentPage,
        x: textPos.x, y: textPos.y,
        color: selectedTool === 'comment' ? '#ffeb3b' : toolState.color,
        opacity: toolState.opacity,
        content: textInput,
        fontFamily: toolState.fontFamily,
        fontSize: toolState.fontSize,
        fontWeight: toolState.fontWeight,
        fontStyle: toolState.fontStyle,
        textDecoration: toolState.textDecoration,
        timestamp: Date.now(),
      });
    }
    setTextInput('');
    setTextPos(null);
  };

  const getCursor = () => {
    if (resizeHandle) return resizeHandle === 'nw' || resizeHandle === 'se' ? 'nwse-resize' : 'nesw-resize';
    if (selectedTool === 'select') return isDragging ? 'grabbing' : 'default';
    if (selectedTool === 'text' || selectedTool === 'comment') return 'text';
    return 'crosshair';
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={canvasWidth}
        height={canvasHeight}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={() => handlePointerUp()}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
        className="absolute top-0 left-0"
        style={{ zIndex: 10, cursor: getCursor(), touchAction: 'none' }}
      />

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
          placeholder={selectedTool === 'comment' ? 'Add comment... (Enter to save)' : 'Type text... (Enter to save)'}
        />
      )}
    </>
  );
}
