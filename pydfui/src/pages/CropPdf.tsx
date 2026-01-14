import { API_BASE_URL } from '../config';
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { IoAddCircle, IoClose } from 'react-icons/io5';
import { FiCrop, FiRefreshCw } from 'react-icons/fi';
import { AiOutlineUndo } from 'react-icons/ai';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

const CropPdf = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFile: File | null = files && files.length > 0 ? files[0] : null;
  
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageInput, setPageInput] = useState<string>('');
  const [cropArea, setCropArea] = useState<CropArea | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [preset, setPreset] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [pageDimensions, setPageDimensions] = useState<{ width: number; height: number } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile && newFile.type === 'application/pdf') {
      setFile(newFile);
      setCropArea(null);
      setCurrentPage(1);
      setPageInput('');
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setCropArea(null);
    setCurrentPage(1);
    setPageInput('');
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDragging(true);
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !dragStart || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = currentX - dragStart.x;
    const height = currentY - dragStart.y;
    
    setCropArea({
      x: width < 0 ? currentX : dragStart.x,
      y: height < 0 ? currentY : dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const resetCrop = () => {
    setCropArea(null);
    setPreset('');
  };

  const handlePresetChange = (presetValue: string) => {
    setPreset(presetValue);
    if (presetValue) {
      setCropArea(null); // Clear custom crop when using preset
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    
    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    // Add page selection if specified
    if (pageInput.trim()) {
      formData.append('pages', pageInput.trim());
    }

    // Add crop parameters
    if (preset) {
      formData.append('preset', preset);
    } else if (cropArea && pageDimensions) {
      // Convert screen coordinates to PDF points
      const scaleX = pageDimensions.width / (containerRef.current?.offsetWidth || 1);
      const scaleY = pageDimensions.height / (containerRef.current?.offsetHeight || 1);
      
      formData.append('x', (cropArea.x * scaleX).toString());
      formData.append('y', (cropArea.y * scaleY).toString());
      formData.append('width', (cropArea.width * scaleX).toString());
      formData.append('height', (cropArea.height * scaleY).toString());
    }

    let filename = 'cropped_document.pdf';

    try {
      const response = await fetch(`${API_BASE_URL}/crop_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');

        if (contentDisposition) {
          const matches = contentDisposition.match(/filename="?(.+)"?/);
          if (matches && matches[1]) {
            filename = matches[1];
          }
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
          window.URL.revokeObjectURL(url);
          a.remove();

          navigate('/end/', {
            state: {
              processType: 'crop',
              status: response.status,
              filename,
            },
          });
        }, 500);
      } else {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        console.error('Failed to crop PDF:', errorData);

        navigate('/end/', {
          state: {
            processType: 'crop',
            status: response.status,
            filename,
            error: errorData.detail || 'Failed to crop PDF',
          },
        });
      }
    } catch (error) {
      console.error('Error while cropping PDF:', error);

      navigate('/end/', {
        state: {
          processType: 'crop',
          status: 'error',
          filename,
          error: 'Network error occurred',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const onPageLoadSuccess = (page: any) => {
    const { width, height } = page;
    setPageDimensions({ width, height });
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left side - PDF Preview with Crop Overlay */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Crop PDF</h2>
          <p className="text-gray-600">
            Upload a PDF and drag to select the area to crop. Use presets or custom dimensions.
          </p>
        </div>

        {!file && (
          <button
            onClick={handleAddClick}
            className="mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
          >
            <IoAddCircle className="text-2xl" />
            Add PDF
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />

        {file && (
          <div className="relative">
            <button
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-700 z-20 transition-all shadow-lg"
              aria-label="Remove PDF"
            >
              <IoClose size={20} />
            </button>

            <div className="bg-white rounded-lg shadow-lg p-4">
              {/* Page navigation */}
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === numPages}
                    className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {/* PDF Preview with Crop Overlay */}
              <div
                ref={containerRef}
                className="relative inline-block cursor-crosshair"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="border-2 border-gray-300"
                >
                  <Page
                    pageNumber={currentPage}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    onLoadSuccess={onPageLoadSuccess}
                  />
                </Document>

                {/* Crop overlay */}
                {cropArea && cropArea.width > 0 && cropArea.height > 0 && (
                  <div
                    className="absolute border-4 border-blue-500 bg-blue-200 bg-opacity-30 pointer-events-none"
                    style={{
                      left: `${cropArea.x}px`,
                      top: `${cropArea.y}px`,
                      width: `${cropArea.width}px`,
                      height: `${cropArea.height}px`,
                    }}
                  >
                    <div className="absolute -top-8 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                      {Math.round(cropArea.width)} × {Math.round(cropArea.height)} px
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
          Crop Controls
        </h2>

        {/* Preset Options */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Preset Crops</h3>
          <select
            value={preset}
            onChange={(e) => handlePresetChange(e.target.value)}
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          >
            <option value="">Custom Crop</option>
            <option value="remove_margins">Remove Margins</option>
            <option value="letter_to_a4">Letter to A4</option>
            <option value="a4_to_letter">A4 to Letter</option>
          </select>
        </div>

        {/* Crop Info */}
        {cropArea && cropArea.width > 0 && cropArea.height > 0 && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-blue-200">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Crop Area</h3>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>X:</strong> {Math.round(cropArea.x)} px</p>
              <p><strong>Y:</strong> {Math.round(cropArea.y)} px</p>
              <p><strong>Width:</strong> {Math.round(cropArea.width)} px</p>
              <p><strong>Height:</strong> {Math.round(cropArea.height)} px</p>
            </div>
          </div>
        )}

        {/* Page Selection */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Page Selection</h3>
          <input
            type="text"
            value={pageInput}
            onChange={(e) => setPageInput(e.target.value)}
            placeholder="e.g., 1,3,5 (leave empty for all)"
            className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
          />
          <p className="text-xs text-gray-500 mt-2">
            Leave empty to crop all pages, or specify page numbers (1-indexed)
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mb-6 space-y-3">
          <button
            onClick={resetCrop}
            className="w-full bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
          >
            <AiOutlineUndo className="text-xl" />
            Reset Crop
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || !file || (!cropArea && !preset)}
            className={`w-full ${
              loading || !file || (!cropArea && !preset)
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Processing...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <FiCrop className="mr-2 text-xl" />
                Apply Crop
              </span>
            )}
          </button>
        </div>

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Drag on the PDF to select crop area</li>
            <li>• Use presets for common crops</li>
            <li>• Specify pages or leave empty for all</li>
            <li>• Reset clears the crop selection</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CropPdf;
