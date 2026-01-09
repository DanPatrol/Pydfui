import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ItemType = 'PAGE_ITEM';

interface PageItem {
  id: string;
  pageNumber: number;
  originalIndex: number;
}

interface HistoryState {
  pages: PageItem[];
  selectedPages: Set<number>;
}

interface DraggablePageProps {
  page: PageItem;
  index: number;
  isSelected: boolean;
  onSelect: (pageId: string, event: React.MouseEvent) => void;
  onMove: (dragIndex: number, hoverIndex: number) => void;
  file: File;
  scale: number;
}

const DraggablePage: React.FC<DraggablePageProps> = ({
  page,
  index,
  isSelected,
  onSelect,
  onMove,
  file,
  scale,
}) => {
  const ref = useRef<HTMLDivElement>(null);

  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index, pageId: page.id },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [{ isOver }, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem: { index: number; pageId: string }) => {
      if (draggedItem.index !== index) {
        onMove(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  drag(drop(ref));

  const [fileURL, setFileURL] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setFileURL(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  return (
    <div
      ref={ref}
      className={`relative border-2 rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 ${
        isSelected ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
      } ${isDragging ? 'opacity-50' : 'opacity-100'} ${
        isOver ? 'border-green-500' : ''
      }`}
      onClick={(e) => onSelect(page.id, e)}
      style={{
        minHeight: '200px',
      }}
    >
      {/* Page Number Badge */}
      <div className="absolute top-2 right-2 bg-blue-600 text-white px-2 py-1 rounded text-sm font-semibold z-10">
        {page.pageNumber}
      </div>

      {/* Selection Checkbox */}
      {isSelected && (
        <div className="absolute top-2 left-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center z-10">
          ✓
        </div>
      )}

      {/* PDF Page Thumbnail */}
      <div className="flex items-center justify-center bg-gray-100 p-2">
        {fileURL && (
          <Document file={fileURL}>
            <Page
              pageNumber={page.pageNumber}
              width={180}
              scale={scale}
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        )}
      </div>

      {/* Drag Indicator */}
      {isDragging && (
        <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
          <span className="text-blue-700 font-semibold">Moving...</span>
        </div>
      )}
    </div>
  );
};

interface PageManipulationProps {
  file: File;
  onPagesReorder?: (pageNumbers: number[]) => void;
  renderQuality?: number;
}

const PageManipulation: React.FC<PageManipulationProps> = ({
  file,
  onPagesReorder,
  renderQuality = 150,
}) => {
  const [pages, setPages] = useState<PageItem[]>([]);
  const [selectedPages, setSelectedPages] = useState<Set<number>>(new Set());
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [numPages, setNumPages] = useState<number>(0);
  const lastSelectedIndex = useRef<number | null>(null);

  const scale = Math.max(renderQuality / 72, 150 / 72);

  // Initialize pages when PDF loads
  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    const initialPages: PageItem[] = Array.from({ length: numPages }, (_, i) => ({
      id: `page-${i}`,
      pageNumber: i + 1,
      originalIndex: i,
    }));
    setPages(initialPages);
    
    // Initialize history
    const initialState: HistoryState = {
      pages: initialPages,
      selectedPages: new Set(),
    };
    setHistory([initialState]);
    setHistoryIndex(0);
  };

  // Save state to history
  const saveToHistory = useCallback((newPages: PageItem[], newSelected: Set<number>) => {
    const newState: HistoryState = {
      pages: [...newPages],
      selectedPages: new Set(newSelected),
    };
    
    // Remove any future history if we're not at the end
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    
    // Limit history to 50 states
    if (newHistory.length > 50) {
      newHistory.shift();
    } else {
      setHistoryIndex(historyIndex + 1);
    }
    
    setHistory(newHistory);
  }, [history, historyIndex]);

  // Handle page selection with multi-select support
  const handlePageSelect = useCallback(
    (pageId: string, event: React.MouseEvent) => {
      const pageIndex = pages.findIndex((p) => p.id === pageId);
      if (pageIndex === -1) return;

      const newSelected = new Set(selectedPages);

      if (event.shiftKey && lastSelectedIndex.current !== null) {
        // Shift+Click: Select range
        const start = Math.min(lastSelectedIndex.current, pageIndex);
        const end = Math.max(lastSelectedIndex.current, pageIndex);
        for (let i = start; i <= end; i++) {
          newSelected.add(i);
        }
      } else if (event.ctrlKey || event.metaKey) {
        // Ctrl/Cmd+Click: Toggle selection
        if (newSelected.has(pageIndex)) {
          newSelected.delete(pageIndex);
        } else {
          newSelected.add(pageIndex);
        }
      } else {
        // Regular click: Select only this page
        newSelected.clear();
        newSelected.add(pageIndex);
      }

      lastSelectedIndex.current = pageIndex;
      setSelectedPages(newSelected);
    },
    [pages, selectedPages]
  );

  // Handle page reordering
  const handleMove = useCallback(
    (dragIndex: number, hoverIndex: number) => {
      const newPages = [...pages];
      const [draggedPage] = newPages.splice(dragIndex, 1);
      newPages.splice(hoverIndex, 0, draggedPage);
      
      setPages(newPages);
      
      // Update selected indices
      const newSelected = new Set<number>();
      selectedPages.forEach((oldIndex) => {
        if (oldIndex === dragIndex) {
          newSelected.add(hoverIndex);
        } else if (oldIndex > dragIndex && oldIndex <= hoverIndex) {
          newSelected.add(oldIndex - 1);
        } else if (oldIndex < dragIndex && oldIndex >= hoverIndex) {
          newSelected.add(oldIndex + 1);
        } else {
          newSelected.add(oldIndex);
        }
      });
      setSelectedPages(newSelected);
      
      // Notify parent component
      if (onPagesReorder) {
        onPagesReorder(newPages.map((p) => p.pageNumber));
      }
    },
    [pages, selectedPages, onPagesReorder]
  );

  // Commit reorder to history (called when drag ends)
  const commitReorder = useCallback(() => {
    saveToHistory(pages, selectedPages);
  }, [pages, selectedPages, saveToHistory]);

  // Undo functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      const prevState = history[newIndex];
      setPages([...prevState.pages]);
      setSelectedPages(new Set(prevState.selectedPages));
      setHistoryIndex(newIndex);
      
      if (onPagesReorder) {
        onPagesReorder(prevState.pages.map((p) => p.pageNumber));
      }
    }
  }, [history, historyIndex, onPagesReorder]);

  // Redo functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      const nextState = history[newIndex];
      setPages([...nextState.pages]);
      setSelectedPages(new Set(nextState.selectedPages));
      setHistoryIndex(newIndex);
      
      if (onPagesReorder) {
        onPagesReorder(nextState.pages.map((p) => p.pageNumber));
      }
    }
  }, [history, historyIndex, onPagesReorder]);

  // Delete selected pages
  const handleDelete = useCallback(() => {
    const newPages = pages.filter((_, index) => !selectedPages.has(index));
    setPages(newPages);
    setSelectedPages(new Set());
    saveToHistory(newPages, new Set());
    
    if (onPagesReorder) {
      onPagesReorder(newPages.map((p) => p.pageNumber));
    }
  }, [pages, selectedPages, saveToHistory, onPagesReorder]);

  // Duplicate selected pages
  const handleDuplicate = useCallback(() => {
    const newPages = [...pages];
    const selectedIndices = Array.from(selectedPages).sort((a, b) => b - a);
    
    selectedIndices.forEach((index) => {
      const pageToDuplicate = pages[index];
      const duplicatedPage: PageItem = {
        ...pageToDuplicate,
        id: `page-${Date.now()}-${Math.random()}`,
      };
      newPages.splice(index + 1, 0, duplicatedPage);
    });
    
    setPages(newPages);
    setSelectedPages(new Set());
    saveToHistory(newPages, new Set());
    
    if (onPagesReorder) {
      onPagesReorder(newPages.map((p) => p.pageNumber));
    }
  }, [pages, selectedPages, saveToHistory, onPagesReorder]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedPages.size > 0) {
          e.preventDefault();
          handleDelete();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo, handleDelete, selectedPages]);

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;
  const hasSelection = selectedPages.size > 0;

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="page-manipulation-container">
        {/* Floating Action Bar */}
        {hasSelection && (
          <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 bg-white shadow-2xl rounded-lg p-4 flex items-center gap-4 z-50 border border-gray-300">
            <span className="text-sm font-semibold text-gray-700">
              {selectedPages.size} page{selectedPages.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={handleDuplicate}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
              title="Duplicate selected pages"
            >
              Duplicate
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
              title="Delete selected pages"
            >
              Delete
            </button>
            <button
              onClick={() => setSelectedPages(new Set())}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
              title="Clear selection"
            >
              Clear
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="bg-gray-100 p-4 border-b border-gray-300 flex items-center gap-4">
          <button
            onClick={handleUndo}
            disabled={!canUndo}
            className={`px-4 py-2 rounded transition-colors ${
              canUndo
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="Undo (Ctrl+Z)"
          >
            ↶ Undo
          </button>
          <button
            onClick={handleRedo}
            disabled={!canRedo}
            className={`px-4 py-2 rounded transition-colors ${
              canRedo
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title="Redo (Ctrl+Y)"
          >
            ↷ Redo
          </button>
          <div className="ml-auto text-sm text-gray-600">
            Total pages: {pages.length} | Original: {numPages}
          </div>
        </div>

        {/* Hidden Document for loading */}
        <div style={{ display: 'none' }}>
          <Document file={file} onLoadSuccess={handleLoadSuccess} />
        </div>

        {/* Pages Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4">
          {pages.map((page, index) => (
            <DraggablePage
              key={page.id}
              page={page}
              index={index}
              isSelected={selectedPages.has(index)}
              onSelect={handlePageSelect}
              onMove={handleMove}
              file={file}
              scale={scale}
            />
          ))}
        </div>

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border-t border-blue-200 text-sm text-gray-700">
          <p className="font-semibold mb-2">Instructions:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Click to select a page, Ctrl/Cmd+Click to toggle selection</li>
            <li>Shift+Click to select a range of pages</li>
            <li>Drag pages to reorder them</li>
            <li>Use Ctrl+Z to undo, Ctrl+Y to redo</li>
            <li>Press Delete or Backspace to remove selected pages</li>
          </ul>
        </div>
      </div>
    </DndProvider>
  );
};

export default PageManipulation;
