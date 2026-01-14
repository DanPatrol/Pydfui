import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { IoAddCircle, IoClose, IoCheckmarkCircle, IoWarning } from 'react-icons/io5';
import { FiUpload, FiDownload } from 'react-icons/fi';
import { BsFileEarmarkPdf } from 'react-icons/bs';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface TextDiff {
  page_num: number;
  diff_type: string;
  old_text: string | null;
  new_text: string | null;
}

interface VisualDiff {
  page_num: number;
  difference_percentage: number;
}

interface ComparisonResult {
  summary: {
    pages_compared: number;
    pdf1_pages: number;
    pdf2_pages: number;
    total_text_diffs: number;
    total_visual_diffs: number;
    identical: boolean;
    page_count_mismatch?: boolean;
  };
  text_differences: TextDiff[];
  visual_differences: VisualDiff[];
}

const ComparePdf = () => {
  const location = useLocation();
  const navigate = useNavigate();
  
  const [file1, setFile1] = useState<File | null>(null);
  const [file2, setFile2] = useState<File | null>(null);
  const [numPages1, setNumPages1] = useState<number>(0);
  const [numPages2, setNumPages2] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [loading, setLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [reportBlob, setReportBlob] = useState<Blob | null>(null);
  
  const file1InputRef = useRef<HTMLInputElement | null>(null);
  const file2InputRef = useRef<HTMLInputElement | null>(null);

  const onDocument1LoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages1(numPages);
  };

  const onDocument2LoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages2(numPages);
  };

  const handleFile1Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile && newFile.type === 'application/pdf') {
      setFile1(newFile);
      setComparisonResult(null);
      setReportBlob(null);
    }
  };

  const handleFile2Change = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile && newFile.type === 'application/pdf') {
      setFile2(newFile);
      setComparisonResult(null);
      setReportBlob(null);
    }
  };

  const handleAddFile1Click = () => {
    file1InputRef.current?.click();
  };

  const handleAddFile2Click = () => {
    file2InputRef.current?.click();
  };

  const handleRemoveFile1 = () => {
    setFile1(null);
    setNumPages1(0);
    setComparisonResult(null);
    setReportBlob(null);
  };

  const handleRemoveFile2 = () => {
    setFile2(null);
    setNumPages2(0);
    setComparisonResult(null);
    setReportBlob(null);
  };

  const handlePageChange = (newPage: number) => {
    const maxPages = Math.max(numPages1, numPages2);
    if (newPage >= 1 && newPage <= maxPages) {
      setCurrentPage(newPage);
    }
  };

  const handleCompare = async () => {
    if (!file1 || !file2) {
      alert('Please upload both PDF files');
      return;
    }
    
    setLoading(true);

    try {
      // First, get JSON comparison result
      const formData = new FormData();
      formData.append('file1', file1);
      formData.append('file2', file2);
      formData.append('return_report', 'false');

      console.log('Sending comparison request with files:', file1.name, file2.name);

      const jsonResponse = await fetch(`${API_BASE_URL}/compare_pdf`, {
        method: 'POST',
        body: formData,
      });

      if (!jsonResponse.ok) {
        let errorMessage = 'Failed to compare PDFs';
        try {
          const errorData = await jsonResponse.json();
          errorMessage = errorData.detail || errorMessage;
        } catch (e) {
          // If JSON parsing fails, try to get text
          const errorText = await jsonResponse.text().catch(() => '');
          if (errorText) {
            errorMessage = errorText;
          }
        }
        throw new Error(errorMessage);
      }

      const result: ComparisonResult = await jsonResponse.json();
      console.log('Comparison result received:', result);
      setComparisonResult(result);

      // Then, get PDF report
      const reportFormData = new FormData();
      reportFormData.append('file1', file1);
      reportFormData.append('file2', file2);
      reportFormData.append('return_report', 'true');

      const reportResponse = await fetch(`${API_BASE_URL}/compare_pdf`, {
        method: 'POST',
        body: reportFormData,
      });

      if (reportResponse.ok) {
        const blob = await reportResponse.blob();
        console.log('Report PDF received, size:', blob.size);
        setReportBlob(blob);
      } else {
        console.warn('Failed to generate report PDF, but comparison succeeded');
      }

    } catch (error) {
      console.error('Error while comparing PDFs:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to compare PDFs. Please try again.';
      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = () => {
    if (!reportBlob) return;

    const url = window.URL.createObjectURL(reportBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'comparison_report.pdf';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    a.remove();
  };

  const getDifferencesForPage = (pageNum: number) => {
    if (!comparisonResult) return { text: [], visual: [] };

    const textDiffs = comparisonResult.text_differences.filter(
      diff => diff.page_num === pageNum - 1
    );
    const visualDiffs = comparisonResult.visual_differences.filter(
      diff => diff.page_num === pageNum - 1
    );

    return { text: textDiffs, visual: visualDiffs };
  };

  const maxPages = Math.max(numPages1, numPages2);
  const pageDiffs = getDifferencesForPage(currentPage);

  return (
    <div className="flex w-full h-screen">
      {/* Left side - Side-by-side PDF Preview */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Compare PDFs</h2>
          <p className="text-gray-600">
            Upload two PDF files to compare and identify differences in text and visual content.
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          {!file1 && (
            <button
              onClick={handleAddFile1Click}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
            >
              <IoAddCircle className="text-2xl" />
              Add PDF 1
            </button>
          )}

          {!file2 && (
            <button
              onClick={handleAddFile2Click}
              className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
            >
              <IoAddCircle className="text-2xl" />
              Add PDF 2
            </button>
          )}
        </div>

        <input
          type="file"
          ref={file1InputRef}
          onChange={handleFile1Change}
          accept="application/pdf"
          className="hidden"
        />

        <input
          type="file"
          ref={file2InputRef}
          onChange={handleFile2Change}
          accept="application/pdf"
          className="hidden"
        />

        {/* Page navigation */}
        {(file1 || file2) && maxPages > 1 && (
          <div className="flex items-center justify-center gap-4 mb-4">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-700">
              Page {currentPage} of {maxPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === maxPages}
              className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}

        {/* Side-by-side PDF preview */}
        <div className="grid grid-cols-2 gap-4">
          {/* PDF 1 */}
          <div className="relative">
            {file1 ? (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">PDF 1</h3>
                  <button
                    onClick={handleRemoveFile1}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-700 transition-all shadow-lg"
                    aria-label="Remove PDF 1"
                  >
                    <IoClose size={20} />
                  </button>
                </div>
                <Document
                  file={file1}
                  onLoadSuccess={onDocument1LoadSuccess}
                  className="border-2 border-gray-300"
                >
                  <Page
                    pageNumber={Math.min(currentPage, numPages1)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={350}
                  />
                </Document>
                <p className="text-sm text-gray-600 mt-2">
                  {file1.name} ({numPages1} pages)
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                  <BsFileEarmarkPdf className="text-6xl mx-auto mb-4" />
                  <p>Upload first PDF</p>
                </div>
              </div>
            )}
          </div>

          {/* PDF 2 */}
          <div className="relative">
            {file2 ? (
              <div className="bg-white rounded-lg shadow-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-800">PDF 2</h3>
                  <button
                    onClick={handleRemoveFile2}
                    className="bg-red-500 text-white rounded-full p-2 hover:bg-red-700 transition-all shadow-lg"
                    aria-label="Remove PDF 2"
                  >
                    <IoClose size={20} />
                  </button>
                </div>
                <Document
                  file={file2}
                  onLoadSuccess={onDocument2LoadSuccess}
                  className="border-2 border-gray-300"
                >
                  <Page
                    pageNumber={Math.min(currentPage, numPages2)}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                    width={350}
                  />
                </Document>
                <p className="text-sm text-gray-600 mt-2">
                  {file2.name} ({numPages2} pages)
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-8 h-96 flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-400">
                  <BsFileEarmarkPdf className="text-6xl mx-auto mb-4" />
                  <p>Upload second PDF</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Page differences */}
        {comparisonResult && (pageDiffs.text.length > 0 || pageDiffs.visual.length > 0) && (
          <div className="mt-6 bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
            <h4 className="text-lg font-semibold text-yellow-800 mb-2">
              Differences on Page {currentPage}
            </h4>
            
            {pageDiffs.text.length > 0 && (
              <div className="mb-3">
                <p className="text-sm font-medium text-yellow-700 mb-1">
                  Text Differences: {pageDiffs.text.length}
                </p>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {pageDiffs.text.slice(0, 5).map((diff, idx) => (
                    <div key={idx} className="text-xs bg-white p-2 rounded border border-yellow-200">
                      <span className="font-semibold">{diff.diff_type.toUpperCase()}: </span>
                      {diff.old_text && <span className="text-red-600">"{diff.old_text.substring(0, 50)}..."</span>}
                      {diff.new_text && <span className="text-green-600">"{diff.new_text.substring(0, 50)}..."</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {pageDiffs.visual.length > 0 && (
              <div>
                <p className="text-sm font-medium text-yellow-700">
                  Visual Difference: {pageDiffs.visual[0].difference_percentage.toFixed(2)}%
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right side - Controls and Results */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
          Comparison Controls
        </h2>

        {/* Compare Button */}
        <div className="mb-6">
          <button
            onClick={handleCompare}
            disabled={loading || !file1 || !file2}
            className={`w-full ${
              loading || !file1 || !file2
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
                Comparing...
              </span>
            ) : (
              'Compare PDFs'
            )}
          </button>
        </div>

        {/* Comparison Results Summary */}
        {comparisonResult && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800 flex items-center gap-2">
              {comparisonResult.summary.identical ? (
                <>
                  <IoCheckmarkCircle className="text-green-500 text-2xl" />
                  Identical
                </>
              ) : (
                <>
                  <IoWarning className="text-yellow-500 text-2xl" />
                  Differences Found
                </>
              )}
            </h3>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Pages Compared:</span>
                <span className="font-semibold">{comparisonResult.summary.pages_compared}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PDF 1 Pages:</span>
                <span className="font-semibold">{comparisonResult.summary.pdf1_pages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">PDF 2 Pages:</span>
                <span className="font-semibold">{comparisonResult.summary.pdf2_pages}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Text Differences:</span>
                <span className="font-semibold text-red-600">
                  {comparisonResult.summary.total_text_diffs}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Visual Differences:</span>
                <span className="font-semibold text-orange-600">
                  {comparisonResult.summary.total_visual_diffs}
                </span>
              </div>
              
              {comparisonResult.summary.page_count_mismatch && (
                <div className="mt-3 bg-yellow-100 border border-yellow-300 rounded p-2">
                  <p className="text-xs text-yellow-800">
                    ⚠️ Page count mismatch detected
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Download Report Button */}
        {reportBlob && (
          <div className="mb-6">
            <button
              onClick={handleDownloadReport}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <FiDownload className="text-xl" />
              Download Report PDF
            </button>
          </div>
        )}

        {/* Differences Navigation */}
        {comparisonResult && !comparisonResult.summary.identical && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Navigate Differences
            </h3>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {Array.from(new Set([
                ...comparisonResult.text_differences.map(d => d.page_num),
                ...comparisonResult.visual_differences.map(d => d.page_num)
              ])).sort((a, b) => a - b).map(pageNum => {
                const textCount = comparisonResult.text_differences.filter(d => d.page_num === pageNum).length;
                const visualCount = comparisonResult.visual_differences.filter(d => d.page_num === pageNum).length;
                
                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum + 1)}
                    className={`w-full text-left p-2 rounded border transition-all ${
                      currentPage === pageNum + 1
                        ? 'bg-blue-100 border-blue-500'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-medium">Page {pageNum + 1}</div>
                    <div className="text-xs text-gray-600">
                      {textCount > 0 && <span className="mr-2">📝 {textCount} text</span>}
                      {visualCount > 0 && <span>👁️ {visualCount} visual</span>}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Upload two PDF files to compare</li>
            <li>• Text differences show added/removed content</li>
            <li>• Visual differences show layout changes</li>
            <li>• Navigate pages to see specific differences</li>
            <li>• Download detailed PDF report</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ComparePdf;
