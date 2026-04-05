import React from 'react';
import { Annotation } from '../../lib/pdf-utils';
import { Trash2, Eye, Pencil, Type, Square, Highlighter, MessageSquare, Image, Minus } from 'lucide-react';

interface AnnotationListProps {
  annotations: Annotation[];
  currentPage: number;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onGoToPage: (page: number) => void;
  showAllPages: boolean;
  onToggleAllPages: () => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  drawing: <Pencil size={12} />,
  text: <Type size={12} />,
  shape: <Square size={12} />,
  highlight: <Highlighter size={12} />,
  strikethrough: <Minus size={12} />,
  comment: <MessageSquare size={12} />,
  image: <Image size={12} />,
  whiteout: <Eye size={12} />,
};

const typeLabels: Record<string, string> = {
  drawing: 'Drawing',
  text: 'Text',
  shape: 'Shape',
  highlight: 'Highlight',
  strikethrough: 'Strikethrough',
  comment: 'Comment',
  image: 'Image',
  whiteout: 'Whiteout',
};

function formatAnnotation(ann: Annotation): string {
  if (ann.type === 'text' || ann.type === 'comment') {
    return (ann.content || '').slice(0, 30) + ((ann.content || '').length > 30 ? '...' : '');
  }
  if (ann.type === 'shape') {
    return ann.shapeType || 'Shape';
  }
  return typeLabels[ann.type] || ann.type;
}

export default function AnnotationList({
  annotations,
  currentPage,
  selectedId,
  onSelect,
  onDelete,
  onGoToPage,
  showAllPages,
  onToggleAllPages,
}: AnnotationListProps) {
  const filtered = showAllPages
    ? annotations
    : annotations.filter((a) => a.pageNum === currentPage);

  const grouped = filtered.reduce<Record<number, Annotation[]>>((acc, ann) => {
    (acc[ann.pageNum] = acc[ann.pageNum] || []).push(ann);
    return acc;
  }, {});

  const pages = Object.keys(grouped).map(Number).sort((a, b) => a - b);

  return (
    <div className="w-full bg-slate-800 border-slate-700 flex flex-col flex-shrink-0 overflow-hidden">
      <div className="p-2.5 border-b border-slate-700 bg-slate-900 flex items-center justify-between">
        <h3 className="text-xs font-semibold text-white">Annotations</h3>
        <span className="text-[10px] text-slate-400">{filtered.length}</span>
      </div>

      <div className="px-2.5 py-1.5 border-b border-slate-700">
        <label className="flex items-center gap-1.5 text-[10px] text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={showAllPages}
            onChange={onToggleAllPages}
            className="rounded w-3 h-3"
          />
          Show all pages
        </label>
      </div>

      <div className="flex-1 overflow-y-auto">
        {pages.length === 0 ? (
          <div className="p-4 text-center text-slate-500 text-xs">
            No annotations{showAllPages ? '' : ' on this page'}
          </div>
        ) : (
          pages.map((pageNum) => (
            <div key={pageNum}>
              {showAllPages && (
                <button
                  onClick={() => onGoToPage(pageNum)}
                  className={`w-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-left transition ${
                    pageNum === currentPage ? 'text-blue-400 bg-blue-900/20' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Page {pageNum}
                </button>
              )}
              {grouped[pageNum].map((ann) => (
                <div
                  key={ann.id}
                  onClick={() => {
                    onSelect(ann.id);
                    if (ann.pageNum !== currentPage) onGoToPage(ann.pageNum);
                  }}
                  className={`group flex items-center gap-2 px-2.5 py-1.5 cursor-pointer transition ${
                    ann.id === selectedId
                      ? 'bg-blue-600/20 border-l-2 border-blue-500'
                      : 'hover:bg-slate-700/50 border-l-2 border-transparent'
                  }`}
                >
                  <div
                    className="w-3 h-3 rounded-sm flex-shrink-0 flex items-center justify-center text-white"
                    style={{ backgroundColor: ann.color === 'transparent' ? '#6b7280' : ann.color }}
                  >
                    {typeIcons[ann.type] || null}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] text-slate-300 truncate">{formatAnnotation(ann)}</div>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onDelete(ann.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-red-400 hover:text-red-300 transition"
                    title="Delete"
                  >
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
