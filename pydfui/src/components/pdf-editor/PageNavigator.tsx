import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PageNavigatorProps {
  currentPage: number;
  totalPages: number;
  onPrevPage: () => void;
  onNextPage: () => void;
  onGoToPage: (page: number) => void;
  zoom: number;
}

export default function PageNavigator({
  currentPage,
  totalPages,
  onPrevPage,
  onNextPage,
  onGoToPage,
  zoom,
}: PageNavigatorProps) {
  const [inputPage, setInputPage] = useState(currentPage.toString());

  const handleGoToPage = () => {
    const page = parseInt(inputPage, 10);
    if (!isNaN(page)) {
      onGoToPage(page);
      setInputPage(page.toString());
    }
  };

  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);

  return (
    <div className="p-4 border-t border-slate-700 bg-slate-900 space-y-3">
      <div className="flex gap-2">
        <button
          onClick={onPrevPage}
          disabled={currentPage === 1}
          className={`flex items-center justify-center p-2 rounded-md transition ${
            currentPage === 1
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1 flex items-center justify-center text-sm text-slate-300">
          {currentPage} / {totalPages}
        </div>
        <button
          onClick={onNextPage}
          disabled={currentPage === totalPages}
          className={`flex items-center justify-center p-2 rounded-md transition ${
            currentPage === totalPages
              ? 'bg-slate-900 text-slate-600 cursor-not-allowed'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
          }`}
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <div className="flex gap-2">
        <input
          type="number"
          min="1"
          max={totalPages}
          value={inputPage}
          onChange={(e) => setInputPage(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleGoToPage()}
          className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 text-slate-300 rounded-md text-sm focus:outline-none focus:border-blue-500"
          placeholder="Go to page..."
        />
        <button
          onClick={handleGoToPage}
          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition"
        >
          Go
        </button>
      </div>

      <div className="text-xs text-slate-400 text-center">
        Zoom: {Math.round(zoom * 100)}%
      </div>
    </div>
  );
}
