import React, { useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document } from 'react-pdf';
import Splitpreview from '../components/Splitpreview';
import { AiOutlineDelete, AiOutlineCheck, AiOutlineClose } from 'react-icons/ai';
import { FiTrash2, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const Removepages = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [numPages, setNumPages] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pageInput, setPageInput] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  

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

 

  const handleSubmit = async () => {
    // Ensure there are items and selected indexes
    if (items.length === 0 || selectedIndexes.length === 0) {
      console.warn('No files or pages selected');
      return;
    }
  
    setLoading(true);
    const formData = new FormData();
    formData.append('file', items[0]); // Use the first PDF file
  
    // Adjust selectedIndexes by incrementing each by 1 (1-based index)
    const adjustedIndexes = selectedIndexes.map((index) => index + 1);
    formData.append('pages_to_remove', adjustedIndexes.join(','));
  
    // Set a default filename in case extraction fails
    let filename = 'modified_output.pdf';
    const apiUrl = 'http://localhost:8001/split';
  
    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        body: formData,
      });
  
      if (response.ok) {
        // Create a blob from the response
        const blob = await response.blob();
  
        // Extract filename from response headers if available
        const contentDisposition = response.headers.get('Content-Disposition');
        const match = contentDisposition?.match(/filename="?(.+)"?/);
        if (match && match[1]) {
          filename = match[1];
        }
  
        // Create a URL for the blob and trigger the download
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
  
        // Navigate after successful download
        navigate('/end/', {
          state: {
            processType: 'remove',
            status: response.status,
            filename,
          },
        });
      } else {
        console.error('Failed to process PDF:', response.statusText);
        navigate('/end/', {
          state: {
            processType: 'remove',
            status: response.status,
            filename,
          },
        });
      }
    } catch (error) {
      console.error('Error while processing PDF:', error);
      navigate('/end/', {
        state: {
          processType: 'remove',
          status: 'error',
          filename,
        },
      });
    } finally {
      setLoading(false);
    }
  };
  
  

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  // Handle item selection by mouse
  const handleItemClick = (index: number) => {
    setSelectedIndexes((prevSelected) => {
      const updatedSelected = prevSelected.includes(index)
        ? prevSelected.filter((i) => i !== index)
        : [...prevSelected, index];

      // Update input box with selected page numbers
      const pageNumbers = updatedSelected.map((num) => num + 1).join(', ');
      setPageInput(pageNumbers);
      return updatedSelected;
    });
  };

  // Handle input change for manual page selection
  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setPageInput(value);

    // Parse the input value to extract page numbers
    const pageNumbers = value
      .split(',')
      .map((num) => parseInt(num.trim(), 10))
      .filter((num) => !isNaN(num) && num > 0 && num <= numPages);

    // Update the selected indexes
    setSelectedIndexes(pageNumbers.map((num) => num - 1));
  };

  // Helper functions for quick selection
  const selectAll = () => {
    const allIndexes = Array.from({ length: numPages }, (_, i) => i);
    setSelectedIndexes(allIndexes);
    setPageInput(allIndexes.map(i => i + 1).join(', '));
  };

  const clearSelection = () => {
    setSelectedIndexes([]);
    setPageInput('');
  };

  const selectRange = (start: number, end: number) => {
    const rangeIndexes = Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
    setSelectedIndexes(rangeIndexes);
    setPageInput(rangeIndexes.map(i => i + 1).join(', '));
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left side: Page grid */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          multiple
          className="hidden"
        />

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Remove Pages</h2>
          <p className="text-gray-600">
            Click on pages to mark them for removal. Selected pages will be highlighted in red.
          </p>
        </div>

        {/* Show content only if PDF is loaded */}
        {items.length > 0 && numPages > 0 ? (
          <>
            {/* Quick actions */}
            <div className="flex gap-3 mb-6">
              <button
                onClick={selectAll}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <FiTrash2 />
                Select All
              </button>
              <button
                onClick={clearSelection}
                className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all transform hover:scale-105 flex items-center gap-2"
              >
                <FiCheckCircle />
                Clear Selection
              </button>
            </div>

            {/* Statistics cards */}
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
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-red-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">To Remove</p>
                    <p className="text-2xl font-bold text-red-600">{selectedIndexes.length}</p>
                  </div>
                  <FiTrash2 className="text-3xl text-red-400" />
                </div>
              </div>
              <div className="bg-white p-4 rounded-lg shadow-md border-2 border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Will Keep</p>
                    <p className="text-2xl font-bold text-green-600">{numPages - selectedIndexes.length}</p>
                  </div>
                  <FiCheckCircle className="text-3xl text-green-400" />
                </div>
              </div>
            </div>

            {/* Pages grid */}
            <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-4">
              {[...Array(numPages)].map((_, index) => {
                const isSelected = selectedIndexes.includes(index);
                return (
                  <div
                    key={index}
                    className={`relative bg-white rounded-lg shadow-md cursor-pointer transition-all duration-200 transform hover:scale-105 ${
                      isSelected
                        ? 'border-4 border-red-500 ring-4 ring-red-200'
                        : 'border-2 border-gray-200 hover:border-green-400 hover:shadow-lg'
                    }`}
                    onClick={() => handleItemClick(index)}
                  >
                    {/* Selection indicator */}
                    <div
                      className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                        isSelected
                          ? 'bg-red-500 scale-110'
                          : 'bg-green-500 opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {isSelected ? (
                        <AiOutlineClose className="text-white text-lg" />
                      ) : (
                        <AiOutlineCheck className="text-white text-lg" />
                      )}
                    </div>

                    {/* Page number badge */}
                    <div
                      className={`absolute top-2 left-2 z-10 px-3 py-1 rounded-full text-xs font-bold ${
                        isSelected
                          ? 'bg-red-500 text-white'
                          : 'bg-blue-500 text-white'
                      }`}
                    >
                      Page {index + 1}
                    </div>

                    {/* Status overlay */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-red-500 bg-opacity-20 rounded-lg flex items-center justify-center z-5">
                        <div className="bg-red-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                          <FiTrash2 />
                          WILL BE REMOVED
                        </div>
                      </div>
                    )}

                    {/* PDF Preview */}
                    <div className={`${isSelected ? 'opacity-60' : 'opacity-100'}`}>
                      <Splitpreview file={items[0]} action={index + 1} />
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <FiAlertCircle className="text-6xl text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No PDF loaded</p>
              <p className="text-gray-400 text-sm mt-2">Upload a PDF to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Right side: Controls and info */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-red-500 pb-2">
          Remove Pages
        </h2>
        
        {/* Hidden Document component for loading PDF */}
        {items.length > 0 && (
          <div className="hidden">
            <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess}></Document>
          </div>
        )}

        {/* Manual page input */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
          <label className="block text-sm font-semibold mb-3 text-gray-800">
            Select Pages to Remove
          </label>
          <input
            type="text"
            placeholder="e.g., 1,3,5 or 1-5,10-15"
            className="w-full border-2 border-gray-300 rounded-lg px-4 py-3 text-gray-900 focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all"
            value={pageInput}
            onChange={handleInputChange}
            disabled={numPages === 0}
          />
          <p className="text-xs text-gray-500 mt-2">
            Enter page numbers separated by commas, or use ranges (e.g., "1-5")
          </p>
        </div>

        {/* Preview of action */}
        {selectedIndexes.length > 0 && (
          <div className="mb-6 bg-gradient-to-r from-red-50 to-orange-50 p-5 rounded-lg border-2 border-red-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <FiAlertCircle className="mr-2 text-red-500" />
              Action Preview
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-sm text-gray-600">Pages to remove:</span>
                <span className="font-bold text-red-600">{selectedIndexes.length}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-sm text-gray-600">Pages to keep:</span>
                <span className="font-bold text-green-600">{numPages - selectedIndexes.length}</span>
              </div>
              <div className="flex justify-between items-center bg-white p-3 rounded-lg">
                <span className="text-sm text-gray-600">Final page count:</span>
                <span className="font-bold text-blue-600">{numPages - selectedIndexes.length}</span>
              </div>
            </div>
          </div>
        )}

        {/* Warning message */}
        {selectedIndexes.length === numPages && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4">
            <div className="flex items-start">
              <FiAlertCircle className="text-yellow-600 text-xl mr-3 mt-1" />
              <div>
                <p className="text-sm font-semibold text-yellow-800">Warning!</p>
                <p className="text-xs text-yellow-700 mt-1">
                  You've selected all pages. The resulting PDF will be empty.
                </p>
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
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105'
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
              <AiOutlineDelete className="mr-2 text-xl" />
              Remove {selectedIndexes.length} Page{selectedIndexes.length !== 1 ? 's' : ''}
            </span>
          )}
        </button>

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Quick Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Click pages to toggle selection</li>
            <li>• Use "Select All" to remove all pages</li>
            <li>• Type page numbers for precise control</li>
            <li>• Red border = will be removed</li>
            <li>• Green hover = will be kept</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default Removepages;
