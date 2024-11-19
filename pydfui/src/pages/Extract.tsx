import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, pdfjs } from 'react-pdf';
import { IoAddCircle } from 'react-icons/io5';
import Splitpreview from '../components/Splitpreview';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const Extract: React.FC = () => {
  const location = useLocation();
  const { files } = location.state || {};

  // Explicitly type 'files' to ensure it's treated as a 'File[]'
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  
  const [numPages, setNumPages] = useState(0);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [pageInput, setPageInput] = useState('');
  const [loading, setLoading] = useState(false);  // Loading state
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
      console.error("No PDF file uploaded.");
      alert("Please upload a PDF file before extracting pages.");
      return;
    }
    
    if (selectedIndexes.length === 0) {
      console.error("No pages selected for extraction.");
      alert("Please select pages to extract.");
      return;
    }

    setLoading(true);  // Set loading state to true when starting the request

    const formData = new FormData();
    formData.append('file', items[0]);

    const adjustedIndexes = selectedIndexes.map((index) => index + 1);
    formData.append('pages_to_extract', adjustedIndexes.join(','));

    try {
      const response = await fetch('https://pydf-api.vercel.app/extract', {
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
      setLoading(false);  // Set loading state to false after the request is finished
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

  return (
    <div className="flex flex-col md:flex-row w-full h-screen overflow-hidden">
      <div className="md:w-3/4 w-full border-b md:border-r border-gray-300 p-4 overflow-auto">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />
        <IoAddCircle className="text-3xl text-blue-600 cursor-pointer" onClick={handleAddClick} />

        {items.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
            {[...Array(numPages)].map((_, index) => (
              <div
                key={index}
                className={`p-2 bg-white rounded shadow ${
                  selectedIndexes.includes(index) ? 'border-2 border-red-500' : ''
                }`}
                onClick={() => handleItemClick(index)}
              >
                <Splitpreview file={items[0]} action={index + 1} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="md:w-1/4 w-full p-6 bg-gray-100 overflow-auto">
        <p className="text-gray-900">To arrange Select in order you want the pages</p>
        <input
          type="text"
          placeholder="Enter page numbers (e.g., 1, 3, 5)"
          className="border border-gray-300 p-2 w-full"
          value={pageInput}
          onChange={handlePageInputChange}
        />
        <button
          onClick={handleSubmit}
          className={`bg-blue-500 hover:bg-blue-700 text-white py-2 px-4 mt-4 rounded ${loading ? 'cursor-not-allowed opacity-50' : ''}`}
          disabled={loading}  // Disable the button during loading
        >
          {loading ? 'Loading...' : 'Extract Pages'}
        </button>
        {items.length > 0 && (
          <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess}>
            {/* Render pages if necessary */}
          </Document>
        )}
      </div>
    </div>
  );
};

export default Extract;
