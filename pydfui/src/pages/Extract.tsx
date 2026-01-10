import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, pdfjs } from 'react-pdf';
import { IoAddCircle } from 'react-icons/io5';
import Splitpreview from '../components/Splitpreview';
import { FiScissors, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { AiOutlineFileSearch } from 'react-icons/ai';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const Extract: React.FC = () => {
  const location = useLocation();
  const { files } = location.state || {};

  const uploadedFiles: File[] = files ? Array.from(files) : [];
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [numPages, setNumPages] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [pageInput, setPageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (items.length > 0) loadPdf(items[0]);
  }, [items]);

  useEffect(() => {
    setPageInput(selectedIndexes.map((i) => i + 1).join(', '));
  }, [selectedIndexes]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const pdfFiles = Array.from(newFiles).filter((file) => file.type === 'application/pdf');
      setItems((prevItems) => [...prevItems, ...pdfFiles]);
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    if (items.length === 0) {
      alert("Please upload a PDF file before extracting pages.");
      return;
    }
    
    if (selectedIndexes.length === 0) {
      alert("Please select pages to extract.");
      return;
    }

    setLoading(true);

    const formData = new FormData();
    formData.append('file', items[0]);

    const adjustedIndexes = selectedIndexes.map((index) => index + 1);
    formData.append('pages_to_extract', adjustedIndexes.join(','));

    try {
      const response = await fetch('${API_BASE_URL}/extract', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Failed to extract pages:', errorText);
        alert(`Error: Failed to extract pages. ${errorText}`);

        await navigate('/end/', {
          state: {
            processType: 'extract',
            status: response.status,
            error: true,
            errorMessage: errorText,
          },
        });
        return;
      }

      const blob = await response.blob();
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'extracted_pages.pdf';
      if (contentDisposition) {
        const matches = contentDisposition.match(/filename="(.+)"/);
        filename = matches ? matches[1] : filename;
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);

      await navigate('/end/', {
        state: {
          processType: 'extract',
          status: response.status,
          filename,
        },
      });
    } catch (error: any) {
      console.error('Error while sending request:', error);
      alert(`An unexpected error occurred: ${error.message}`);

      await navigate('/end/', {
        state: {
          processType: 'extract',
          error: true,
          errorMessage: error.message,
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const loadPdf = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setNumPages(0);
    reader.readAsArrayBuffer(file);
  };

  const handleItemClick = (index: number) => {
    setSelectedIndexes((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const handlePageInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    setPageInput(input);

    const inputIndexes = input
      .split(',')
      .map((num) => parseInt(num.trim(), 10) - 1)
      .filter((num) => !isNaN(num) && num >= 0 && num < numPages);

    setSelectedIndexes(inputIndexes);
  };

  const selectAll = () => {
    const allIndexes = Array.from({ length: numPages }, (_, i) => i);
    setSelectedIndexes(allIndexes);
  };

  const clearSelection = () => {
    setSelectedIndexes([]);
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left side - Pages grid */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Extract Pages</h2>
          <p className="text-gray-600">
            Select pages to extract into a new PDF. Click pages to select them.
          </p>
        </div>

        {/* Quick actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={handleAddClick}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <IoAddCircle className="text-xl" />
            Add PDF
          </button>
          <button
            onClick={selectAll}
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
          >
            <FiCheckCircle />
            Select All
          </button>
          <button
            onClick={clearSelection}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg font-medium transition-all transform hover:scale-105"
          >
            Clear
          </button>
        </div>

        {/* Statistics */}
        {numPages > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Pages</p>
                  <p className="text-2xl font-bold text-blue-600">{numPages}</p>
                </div>
                <FiAlertCircle className="text-3xl text-blue-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Selected</p>
                  <p className="text-2xl font-bold text-green-600">{selectedIndexes.length}</p>
                </div>
                <FiCheckCircle className="text-3xl text-green-400" />
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Order</p>
                  <p className="text-lg font-bold text-purple-600">As Selected</p>
                </div>
                <AiOutlineFileSearch className="text-3xl text-purple-400" />
              </div>
            </div>
          </div>
        )}

        {/* Pages grid */}
        {items.length > 0 && (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
            {[...Array(numPages)].map((_, index) => {
              const isSelected = selectedIndexes.includes(index);
              const selectionOrder = selectedIndexes.indexOf(index) + 1;
              
              return (
                <div
                  key={index}
                  className={`relative bg-white rounded-lg shadow-md cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                    isSelected
                      ? 'border-4 border-green-500 ring-4 ring-green-200'
                      : 'border-2 border-gray-200 hover:border-blue-400 hover:shadow-lg'
                  }`}
                  onClick={() => handleItemClick(index)}
                >
                  {/* Selection order badge */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 z-10 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm shadow-lg">
                      {selectionOrder}
                    </div>
                  )}

                  {/* Page number badge */}
                  <div
                    className={`absolute top-2 left-2 z-10 px-3 py-1 rounded-full text-xs font-bold ${
                      isSelected
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-500 text-white'
                    }`}
                  >
                    Page {index + 1}
                  </div>

                  {/* PDF Preview */}
                  <Splitpreview file={items[0]} action={index + 1} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-green-500 pb-2">
          Extract Settings
        </h2>

        {items.length > 0 && (
          <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess} />
        )}

        {/* Manual page input */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
          <label className="block text-sm font-semibold mb-3 text-gray-800">
            Page Numbers
          </label>
          <input
            type="text"
            placeholder="e.g., 1,3,5 or 1-5"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all"
            value={pageInput}
            onChange={handlePageInputChange}
          />
          <p className="text-xs text-gray-500 mt-2">
            Pages will be extracted in the order you select them
          </p>
        </div>

        {/* Preview */}
        {selectedIndexes.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-green-50 to-blue-50 p-5 rounded-lg border-2 border-green-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FiScissors className="mr-2 text-green-500" />
              Extraction Preview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-sm text-gray-600">Pages to extract:</span>
                <span className="font-bold text-green-600">{selectedIndexes.length}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-sm text-gray-600">Output file:</span>
                <span className="font-bold text-blue-600">New PDF</span>
              </div>
            </div>
          </div>
        )}

        {/* Submit button */}
        <button
          onClick={handleSubmit}
          disabled={loading || selectedIndexes.length === 0}
          className={`w-full ${
            loading || selectedIndexes.length === 0
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Extracting...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <FiScissors className="mr-2 text-xl" />
              Extract {selectedIndexes.length} Page{selectedIndexes.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Click pages in the order you want</li>
            <li>• Numbers show extraction order</li>
            <li>• Use "Select All" for quick selection</li>
            <li>• Type page numbers for precision</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Extract;
