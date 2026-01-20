import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, pdfjs } from 'react-pdf';
import Splitpreview from '../components/Splitpreview';

import { AiOutlineClose, AiOutlineScissor } from 'react-icons/ai';
import { FiFile } from 'react-icons/fi';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface ResponsiveGridProps {
  onReorder?: (newOrder: React.ReactNode[]) => void;
}

type SplitMode = 'ranges' | 'pageCount' | 'fileSize' | 'extractPages';

const Splitpage: React.FC<ResponsiveGridProps> = ({ onReorder }) => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [numPages, setNumPages] = useState(0);
  const [ranges, setRanges] = useState<Array<[number, number]>>([[1, 1], [1, 1]]);
  const [loading, setLoading] = useState(false); // Loading state
  const [disabled, setDisabled] = useState(false); // Disabled state for form
  const [splitMode, setSplitMode] = useState<SplitMode>('ranges');
  const [pagesPerSplit, setPagesPerSplit] = useState<number>(10);
  const [targetSizeMB, setTargetSizeMB] = useState<number>(5);
  const [pagesToExtract, setPagesToExtract] = useState<string>('1,2,3');
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  // Helper function to determine if a page is a split point
  const isSplitPoint = (pageNum: number): boolean => {
    if (splitMode === 'ranges') {
      return ranges.some(range => range[0] === pageNum || range[1] === pageNum);
    } else if (splitMode === 'pageCount') {
      return pageNum % pagesPerSplit === 0 && pageNum !== numPages;
    } else if (splitMode === 'extractPages') {
      const pages = pagesToExtract.split(',').map(p => parseInt(p.trim()));
      return pages.includes(pageNum);
    }
    return false;
  };

  // Helper function to get split groups for preview
  const getSplitGroups = (): Array<{ start: number; end: number; pages: number[] }> => {
    if (splitMode === 'ranges') {
      return ranges.map(range => ({
        start: range[0],
        end: range[1],
        pages: Array.from({ length: range[1] - range[0] + 1 }, (_, i) => range[0] + i)
      }));
    } else if (splitMode === 'pageCount') {
      const groups: Array<{ start: number; end: number; pages: number[] }> = [];
      for (let i = 1; i <= numPages; i += pagesPerSplit) {
        const end = Math.min(i + pagesPerSplit - 1, numPages);
        groups.push({
          start: i,
          end: end,
          pages: Array.from({ length: end - i + 1 }, (_, idx) => i + idx)
        });
      }
      return groups;
    } else if (splitMode === 'extractPages') {
      const pages = pagesToExtract.split(',').flatMap(part => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(p => parseInt(p.trim()));
          return Array.from({ length: end - start + 1 }, (_, i) => start + i);
        }
        return [parseInt(part.trim())];
      }).filter(p => !isNaN(p) && p >= 1 && p <= numPages);
      return pages.map(p => ({ start: p, end: p, pages: [p] }));
    }
    return [];
  };

  useEffect(() => {
    if (onReorder) {
      // Convert File[] to an array of ReactNodes (e.g., using file names as strings)
      const fileNames: React.ReactNode[] = items.map(file => file.name);
      onReorder(fileNames);
    }
  }, [items, onReorder]);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const pdfFiles = Array.from(newFiles).filter((file) => file.type === 'application/pdf');
      setItems((prevItems) => {
        const existingNames = new Set(prevItems.map((file) => file.name));
        const uniqueFiles = pdfFiles.filter((file) => !existingNames.has(file.name));
        return [...prevItems, ...uniqueFiles];
      });
    }
  };

  const handleRangeChange = (index: number, newStart: number, newEnd: number) => {
    const newRanges = [...ranges];
    if (newStart > newEnd) newStart = newEnd;
    if (newEnd > numPages) newEnd = numPages;
    if (newStart < 1) newStart = 1;
    newRanges[index] = [newStart, newEnd];
    setRanges(newRanges);
  };

  const addNewRange = () => {
    const newRange: [number, number] = [1, Math.min(1, numPages)];
    setRanges([...ranges, newRange]);
  };

  const handleRemoveRange = (index: number) => {
    setRanges(ranges.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!items || items.length === 0) {
      console.error('No file selected');
      return;
    }

    setLoading(true);
    setDisabled(true);

    const formData = new FormData();
    formData.append('file', items[0]);

    let endpoint = `${API_BASE_URL}/split_pdfs`;
    
    try {
      if (splitMode === 'ranges') {
        if (!ranges || ranges.length === 0) {
          console.error('Ranges are empty or undefined');
          return;
        }
        const rangesModel = JSON.stringify({ ranges });
        formData.append('ranges_model', rangesModel);
        endpoint = `${API_BASE_URL}/split_pdfs`;
      } else if (splitMode === 'pageCount') {
        formData.append('pages_per_split', pagesPerSplit.toString());
        endpoint = `${API_BASE_URL}/split_by_page_count`;
      } else if (splitMode === 'fileSize') {
        formData.append('target_size_mb', targetSizeMB.toString());
        endpoint = `${API_BASE_URL}/split_by_file_size`;
      } else if (splitMode === 'extractPages') {
        formData.append('pages', pagesToExtract);
        endpoint = `${API_BASE_URL}/extract_pages_separate`;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        const filename = contentDisposition?.split('filename=')[1] || 'split_output.zip'; 

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        await navigate('/end/', {
          state: {
            processType: 'splitpages',
            status: response.status,
            filename, 
          },
        });
      } else {
        console.error('Failed to split PDFs:', response.statusText);
        await navigate('/end/', {
          state: {
            processType: 'splitpages',
            status: response.status,
            filename: 'split_output.zip',
          },
        });
      }
    } catch (error) {
      console.error('Error while sending files:', error);
      await navigate('/end/', {
        state: {
          processType: 'splitpages',
          error: true,
        },
      });
    } finally {
      setLoading(false);
      setDisabled(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex flex-col lg:flex-row w-full min-h-screen">
      {/* Main content area - full width on mobile, 3/4 on desktop */}
      <div className="w-full lg:w-3/4 border-b lg:border-b-0 lg:border-r border-gray-300 p-3 sm:p-6 overflow-auto bg-gray-50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          multiple
          className="hidden"
        />

        {/* Header with split info */}
        <div className="mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Split Preview</h2>
          <p className="text-sm sm:text-base text-gray-600">
            {splitMode === 'ranges' && `Splitting into ${ranges.length} file(s) by custom ranges`}
            {splitMode === 'pageCount' && `Splitting into ${Math.ceil(numPages / pagesPerSplit)} file(s) - ${pagesPerSplit} pages each`}
            {splitMode === 'fileSize' && `Splitting by file size - targeting ${targetSizeMB}MB per file`}
            {splitMode === 'extractPages' && `Extracting selected pages as separate files`}
          </p>
        </div>

        {/* Modern grid-based preview for all modes */}
        {splitMode === 'fileSize' ? (
          <div className="bg-white p-4 sm:p-8 rounded-lg shadow-md border-2 border-blue-200">
            <div className="flex items-center justify-center mb-4">
              <AiOutlineScissor className="text-blue-500 text-3xl sm:text-4xl mr-3" />
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Split by File Size</h3>
            </div>
            <p className="text-sm sm:text-base text-gray-700 text-center mb-4">
              The PDF will be split into files targeting approximately {targetSizeMB}MB each.
            </p>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm sm:text-base text-gray-600 text-center">
                <span className="font-semibold">Total pages:</span> {numPages}
              </p>
              <p className="text-xs sm:text-sm text-gray-500 text-center mt-2">
                Exact number of files will depend on page content and size
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 sm:space-y-6">
            {getSplitGroups().map((group, groupIndex) => (
              <div key={groupIndex} className="bg-white rounded-lg shadow-md border-2 border-blue-200 overflow-hidden">
                {/* File header */}
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-3 sm:p-4 flex items-center justify-between">
                  <div className="flex items-center text-white">
                    <FiFile className="text-xl sm:text-2xl mr-2 sm:mr-3" />
                    <div>
                      <h3 className="font-bold text-base sm:text-lg">File {groupIndex + 1}</h3>
                      <p className="text-xs sm:text-sm text-blue-100">
                        Pages {group.start} - {group.end} ({group.pages.length} page{group.pages.length !== 1 ? 's' : ''})
                      </p>
                    </div>
                  </div>
                  <AiOutlineScissor className="text-white text-2xl sm:text-3xl" />
                </div>

                {/* Pages grid - responsive grid */}
                <div className="p-2 sm:p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-4">
                  {group.pages.map((pageNum) => (
                    <div
                      key={pageNum}
                      className="relative bg-gray-50 rounded-lg border-2 border-gray-200 hover:border-blue-400 transition-all duration-200 hover:shadow-lg aspect-[3/4]"
                    >
                      <div className="absolute top-1 sm:top-2 left-1 sm:left-2 bg-blue-500 text-white text-xs font-bold px-1 sm:px-2 py-1 rounded-full z-10">
                        Page {pageNum}
                      </div>
                      <Splitpreview file={items[0]} action={pageNum} />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Summary card */}
        {numPages > 0 && (
          <div className="mt-4 sm:mt-6 bg-gradient-to-r from-green-50 to-blue-50 p-4 sm:p-6 rounded-lg border-2 border-green-200">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">Split Summary</h3>
            <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
              <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm">
                <p className="text-lg sm:text-2xl font-bold text-blue-600">{numPages}</p>
                <p className="text-xs sm:text-sm text-gray-600">Total Pages</p>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm">
                <p className="text-lg sm:text-2xl font-bold text-green-600">
                  {splitMode === 'fileSize' ? '?' : getSplitGroups().length}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Output Files</p>
              </div>
              <div className="bg-white p-2 sm:p-3 rounded-lg shadow-sm">
                <p className="text-lg sm:text-2xl font-bold text-purple-600">
                  {splitMode === 'fileSize' ? '~' + targetSizeMB + 'MB' : 
                   splitMode === 'pageCount' ? pagesPerSplit + ' pages' :
                   'Custom'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">Per File</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sidebar - full width on mobile, 1/4 on desktop */}
      <div className="w-full lg:w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-3 sm:p-6 overflow-auto shadow-lg">
        <h2 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">Split Options</h2>
        <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess} />
        
        {/* Split mode selector */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-sm font-semibold mb-2 sm:mb-3 text-gray-800">Split Mode</label>
          <select
            value={splitMode}
            onChange={(e) => setSplitMode(e.target.value as SplitMode)}
            className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
            disabled={disabled}
          >
            <option value="ranges">📄 Page Ranges</option>
            <option value="pageCount">📊 By Page Count</option>
            <option value="fileSize">💾 By File Size</option>
            <option value="extractPages">✂️ Extract Pages</option>
          </select>
        </div>

        {/* Mode-specific controls */}
        {splitMode === 'ranges' && (
          <div className="space-y-3 sm:space-y-4">
            <h3 className="text-base sm:text-lg font-semibold text-gray-800 flex items-center">
              <AiOutlineScissor className="mr-2 text-blue-500" />
              Split Ranges
            </h3>
            <ul className="space-y-2 sm:space-y-3">
              {ranges.map((range, index) => (
                <li key={index} className="bg-white p-3 sm:p-4 rounded-lg shadow-md border-2 border-gray-200 hover:border-blue-400 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs sm:text-sm font-semibold text-gray-700">Range {index + 1}</span>
                    <AiOutlineClose
                      className="text-red-500 cursor-pointer hover:text-red-700 transition-colors text-lg"
                      onClick={() => handleRemoveRange(index)}
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      value={range[0]}
                      onChange={(e) => handleRangeChange(index, parseInt(e.target.value, 10), range[1])}
                      className="w-16 sm:w-20 border-2 border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      min={1}
                      max={numPages}
                      disabled={disabled}
                    />
                    <span className="text-gray-600 font-bold">→</span>
                    <input
                      type="number"
                      value={range[1]}
                      onChange={(e) => handleRangeChange(index, range[0], parseInt(e.target.value, 10))}
                      className="w-16 sm:w-20 border-2 border-gray-300 rounded-lg px-2 sm:px-3 py-1 sm:py-2 text-center text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                      min={1}
                      max={numPages}
                      disabled={disabled}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 text-center">
                    {range[1] - range[0] + 1} page{range[1] - range[0] + 1 !== 1 ? 's' : ''}
                  </p>
                </li>
              ))}
            </ul>
            <button
              onClick={addNewRange}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-2 sm:py-3 px-4 rounded-lg shadow-md transition-all transform hover:scale-105 text-sm sm:text-base"
              disabled={disabled}
            >
              + Add Range
            </button>
          </div>
        )}

        {splitMode === 'pageCount' && (
          <div className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-5 rounded-lg shadow-md border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-800">Pages per Split</label>
            <input
              type="number"
              value={pagesPerSplit}
              onChange={(e) => setPagesPerSplit(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              min={1}
              max={numPages}
              disabled={disabled}
            />
            <div className="bg-blue-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700 text-center">
                📊 Split every <span className="font-bold text-blue-600">{pagesPerSplit}</span> page(s)
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Creates ~{Math.ceil(numPages / pagesPerSplit)} files
              </p>
            </div>
          </div>
        )}

        {splitMode === 'fileSize' && (
          <div className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-5 rounded-lg shadow-md border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-800">Target Size (MB)</label>
            <input
              type="number"
              value={targetSizeMB}
              onChange={(e) => setTargetSizeMB(Math.max(0.1, parseFloat(e.target.value) || 1))}
              className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              min={0.1}
              max={100}
              step={0.5}
              disabled={disabled}
            />
            <div className="bg-purple-50 p-3 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-700 text-center">
                💾 Target <span className="font-bold text-purple-600">{targetSizeMB}MB</span> per file
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Actual size may vary based on content
              </p>
            </div>
          </div>
        )}

        {splitMode === 'extractPages' && (
          <div className="space-y-3 sm:space-y-4 bg-white p-4 sm:p-5 rounded-lg shadow-md border-2 border-gray-200">
            <label className="block text-sm font-semibold text-gray-800">Pages to Extract</label>
            <input
              type="text"
              value={pagesToExtract}
              onChange={(e) => setPagesToExtract(e.target.value)}
              className="w-full border-2 border-gray-300 rounded-lg px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-base text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
              placeholder="e.g., 1,3,5 or 1-5,10-15"
              disabled={disabled}
            />
            <div className="bg-green-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 text-center">
                ✂️ Use commas for individual pages or ranges
              </p>
              <p className="text-xs text-gray-500 text-center mt-1">
                Example: "1-5,10-15" or "1,3,5"
              </p>
            </div>
          </div>
        )}

        <button
          onClick={handleSubmit}
          className={`w-full mt-4 sm:mt-6 ${
            loading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
          } text-white font-bold py-3 sm:py-4 px-4 sm:px-6 rounded-lg shadow-lg transition-all duration-200 text-sm sm:text-base`}
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 mr-2 sm:mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Processing...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <AiOutlineScissor className="mr-2 text-lg sm:text-xl" />
              Split PDF
            </span>
          )}
        </button>
      </div>
    </div>
  );
};

export default Splitpage;
