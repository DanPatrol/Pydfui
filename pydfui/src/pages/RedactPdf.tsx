import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { IoAddCircle, IoClose } from 'react-icons/io5';
import { FiSearch } from 'react-icons/fi';
import { BsEraser } from 'react-icons/bs';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker - use local worker instead of CDN
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface RedactionArea {
  id: number;
  page_num: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

const RedactPdf = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFile: File | null = files && files.length > 0 ? files[0] : null;
  
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);
  const [isPdfLoading, setIsPdfLoading] = useState(false);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [redactionAreas, setRedactionAreas] = useState<RedactionArea[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [textPattern, setTextPattern] = useState<string>('');
  const [redactionMode, setRedactionMode] = useState<'area' | 'text'>('area');
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const navigate = useNavigate();

  // Effect to create and cleanup blob URL when file changes
  React.useEffect(() => {
    if (file) {
      setIsPdfLoading(true);
      setPdfLoadError(null);
      
      try {
        // Create blob URL for the PDF file
        const url = URL.createObjectURL(file);
        setFileURL(url);
        
        // Cleanup function to revoke blob URL on unmount or file change
        return () => {
          URL.revokeObjectURL(url);
          setFileURL(null);
        };
      } catch (error) {
        console.error('Error creating blob URL:', error);
        setPdfLoadError('Failed to load PDF file. Please ensure the file is valid.');
        setIsPdfLoading(false);
      }
    } else {
      // Clear URL when no file
      setFileURL(null);
      setPdfLoadError(null);
      setIsPdfLoading(false);
    }
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsPdfLoading(false);
    setPdfLoadError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Error loading PDF:', error);
    const errorMessage = error.message || 'Unknown error occurred';
    setPdfLoadError(`Failed to load PDF: ${errorMessage}. Please ensure the file is a valid PDF and try uploading it again.`);
    setIsPdfLoading(false);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile && newFile.type === 'application/pdf') {
      setFile(newFile);
      setRedactionAreas([]);
      setCurrentPage(1);
      setNumPages(0);
      setPdfLoadError(null);
      setIsPdfLoading(true);
    } else if (newFile) {
      setPdfLoadError('Please select a valid PDF file');
      setFile(null);
    }
  };

  const handleAddPdfClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setRedactionAreas([]);
    setCurrentPage(1);
    setPdfLoadError(null);
    setIsPdfLoading(false);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (redactionMode !== 'area' || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    setIsDrawing(true);
    setStartPos({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !startPos || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;
    
    const width = currentX - startPos.x;
    const height = currentY - startPos.y;
    
    setCurrentRect({
      x: width < 0 ? currentX : startPos.x,
      y: height < 0 ? currentY : startPos.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    if (!isDrawing || !currentRect || !startPos) return;
    
    // Only add if rectangle has meaningful size
    if (currentRect.width > 10 && currentRect.height > 10) {
      const newRedaction: RedactionArea = {
        id: Date.now(),
        page_num: currentPage - 1, // Convert to 0-indexed
        x: currentRect.x,
        y: currentRect.y,
        width: currentRect.width,
        height: currentRect.height,
      };
      
      setRedactionAreas([...redactionAreas, newRedaction]);
    }
    
    setIsDrawing(false);
    setStartPos(null);
    setCurrentRect(null);
  };

  const handleRemoveRedaction = (id: number) => {
    setRedactionAreas(redactionAreas.filter(area => area.id !== id));
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    if (redactionMode === 'area' && redactionAreas.length === 0) {
      alert('Please draw at least one redaction area');
      return;
    }

    if (redactionMode === 'text' && !textPattern.trim()) {
      alert('Please enter a text pattern to redact');
      return;
    }
    
    setLoading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);

      if (redactionMode === 'area') {
        // Convert screen coordinates to PDF points
        // Assuming standard scaling - this is approximate
        const scaleX = 612 / (containerRef.current?.offsetWidth || 1); // Letter size width in points
        const scaleY = 792 / (containerRef.current?.offsetHeight || 1); // Letter size height in points
        
        const scaledAreas = redactionAreas.map(area => ({
          page_num: area.page_num,
          x: area.x * scaleX,
          y: area.y * scaleY,
          width: area.width * scaleX,
          height: area.height * scaleY,
        }));
        
        formData.append('redaction_areas', JSON.stringify(scaledAreas));
      } else {
        formData.append('text_pattern', textPattern);
      }

      const response = await fetch(`${API_BASE_URL}/redact_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        throw new Error(errorData.detail || 'Failed to redact PDF');
      }

      // Download the redacted PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_redacted.pdf`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();

        navigate('/end/', {
          state: {
            processType: 'redact',
            status: 200,
            filename: a.download,
          },
        });
      }, 500);
    } catch (error) {
      console.error('Error while redacting PDF:', error);

      navigate('/end/', {
        state: {
          processType: 'redact',
          status: 'error',
          filename: file.name,
          error: error instanceof Error ? error.message : 'Network error occurred',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left side - PDF Preview with Redaction Areas */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Redact PDF</h2>
          <p className="text-gray-600">
            Permanently remove sensitive information from your PDF. Draw areas to redact or search for text patterns.
          </p>
        </div>

        {!file && (
          <button
            onClick={handleAddPdfClick}
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

              {redactionMode === 'area' && (
                <div className="mb-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 text-center">
                  <p className="text-yellow-800 font-semibold">
                    Click and drag on the PDF to draw redaction areas
                  </p>
                </div>
              )}

              {/* PDF Preview with Redaction Overlay */}
              <div
                ref={containerRef}
                className={`relative inline-block ${redactionMode === 'area' ? 'cursor-crosshair' : ''}`}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
              >
                {pdfLoadError ? (
                  <div className="flex items-center justify-center p-8 bg-red-50 border-2 border-red-300 rounded">
                    <div className="text-center max-w-md">
                      <p className="text-red-600 font-semibold mb-2">Failed to load PDF</p>
                      <p className="text-red-500 text-sm">{pdfLoadError}</p>
                      <button
                        onClick={handleAddPdfClick}
                        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                      >
                        Try Another File
                      </button>
                    </div>
                  </div>
                ) : (
                  <Document
                    file={fileURL}
                    onLoadSuccess={onDocumentLoadSuccess}
                    onLoadError={onDocumentLoadError}
                    className="border-2 border-gray-300"
                    loading={
                      <div className="flex items-center justify-center p-8 bg-gray-100 border-2 border-gray-300 rounded">
                        <div className="text-center">
                          <svg className="animate-spin h-8 w-8 mx-auto mb-2 text-blue-500" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          <p className="text-gray-600">Loading PDF...</p>
                        </div>
                      </div>
                    }
                    error={
                      <div className="flex items-center justify-center p-8 bg-red-50 border-2 border-red-300 rounded">
                        <div className="text-center">
                          <p className="text-red-600 font-semibold mb-2">Failed to load PDF</p>
                          <p className="text-red-500 text-sm">Please try uploading the file again</p>
                        </div>
                      </div>
                    }
                  >
                    <Page
                      pageNumber={currentPage}
                      renderTextLayer={false}
                      renderAnnotationLayer={false}
                      loading={
                        <div className="flex items-center justify-center p-8 bg-gray-100">
                          <p className="text-gray-600">Loading page...</p>
                        </div>
                      }
                    />
                  </Document>
                )}

                {/* Redaction area overlays for current page */}
                {redactionAreas
                  .filter(area => area.page_num === currentPage - 1)
                  .map(area => (
                    <div
                      key={area.id}
                      className="absolute bg-black bg-opacity-70 border-2 border-red-500"
                      style={{
                        left: `${area.x}px`,
                        top: `${area.y}px`,
                        width: `${area.width}px`,
                        height: `${area.height}px`,
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-red-500 text-white px-2 py-1 rounded text-xs">
                        Redaction {redactionAreas.indexOf(area) + 1}
                      </div>
                    </div>
                  ))}

                {/* Current drawing rectangle */}
                {currentRect && isDrawing && (
                  <div
                    className="absolute bg-black bg-opacity-50 border-2 border-red-500 pointer-events-none"
                    style={{
                      left: `${currentRect.x}px`,
                      top: `${currentRect.y}px`,
                      width: `${currentRect.width}px`,
                      height: `${currentRect.height}px`,
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-red-500 pb-2">
          Redaction Controls
        </h2>

        {/* Redaction Mode Selection */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Redaction Mode</h3>
          
          <div className="space-y-2">
            <button
              onClick={() => setRedactionMode('area')}
              className={`w-full p-3 rounded-lg font-medium transition-all ${
                redactionMode === 'area'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <BsEraser className="inline mr-2" />
              Draw Areas
            </button>
            <button
              onClick={() => setRedactionMode('text')}
              className={`w-full p-3 rounded-lg font-medium transition-all ${
                redactionMode === 'text'
                  ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FiSearch className="inline mr-2" />
              Search Text
            </button>
          </div>
        </div>

        {/* Text Pattern Search (only in text mode) */}
        {redactionMode === 'text' && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">Text Pattern</h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Pattern
              </label>
              <input
                type="text"
                value={textPattern}
                onChange={(e) => setTextPattern(e.target.value)}
                placeholder="e.g., SSN: ###-##-####"
                className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:outline-none"
              />
              <p className="text-xs text-gray-500 mt-2">
                Enter text or regex pattern to find and redact
              </p>
            </div>
          </div>
        )}

        {/* Redaction Areas List (only in area mode) */}
        {redactionMode === 'area' && redactionAreas.length > 0 && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Redaction Areas ({redactionAreas.length})
            </h3>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {redactionAreas.map((area, index) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                >
                  <span className="text-sm text-gray-700">
                    Area {index + 1} - Page {area.page_num + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveRedaction(area.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <IoClose size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mb-6">
          <button
            onClick={handleSubmit}
            disabled={
              loading ||
              !file ||
              (redactionMode === 'area' && redactionAreas.length === 0) ||
              (redactionMode === 'text' && !textPattern.trim())
            }
            className={`w-full ${
              loading ||
              !file ||
              (redactionMode === 'area' && redactionAreas.length === 0) ||
              (redactionMode === 'text' && !textPattern.trim())
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105'
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Redacting...
              </span>
            ) : (
              'Redact PDF'
            )}
          </button>
        </div>

        {/* Warning */}
        <div className="mb-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2">⚠️ Warning</h4>
          <p className="text-xs text-red-700">
            Redactions are permanent and cannot be undone. The content will be completely removed from the PDF.
          </p>
        </div>

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Draw mode: Click and drag to select areas</li>
            <li>• Text mode: Enter pattern to find and redact</li>
            <li>• Navigate pages to redact on different pages</li>
            <li>• Redactions are shown as black boxes</li>
            <li>• Content is permanently removed</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RedactPdf;
