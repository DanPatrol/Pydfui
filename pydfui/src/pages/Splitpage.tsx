import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document } from 'react-pdf';
import Splitpreview from '../components/Splitpreview';

import { AiOutlineClose } from 'react-icons/ai';

interface ResponsiveGridProps {
  onReorder?: (newOrder: React.ReactNode[]) => void;
}

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const navigate = useNavigate();

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
    if (!ranges || ranges.length === 0) {
      console.error('Ranges are empty or undefined');
      return;
    }

    setLoading(true); // Set loading to true when submit is clicked
    setDisabled(true); // Disable form inputs

    const formData = new FormData();
    formData.append('file', items[0]);

    const rangesModel = JSON.stringify({ ranges });
    formData.append('ranges_model', rangesModel);

    try {
      const response = await fetch('https://pydf-api.vercel.app/split_pdfs', {
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
      setLoading(false); // Reset loading state after the request
      setDisabled(false); // Re-enable the form
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  return (
    <div className="flex w-full h-screen">
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-transparent">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          multiple
          className="hidden"
        />

        {ranges.map((it, index) => (
          <div key={index} className="flex justify-between items-center bg-white gap-4 mb-6 rounded shadow p-4">
            <Splitpreview file={items[0]} action={it[0]} />
            <Splitpreview file={items[0]} action={it[1]} />
          </div>
        ))}
      </div>

      <div className="w-1/4 bg-gray-100 p-6 overflow-auto">
        <h2 className="text-xl font-bold mb-4">Ranges</h2>
        <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess} />
        <ul className="space-y-4">
          {ranges.map((range, index) => (
            <li key={index} className="flex justify-between items-center bg-white p-3 rounded shadow-sm">
              <div className="flex items-center space-x-2">
                <input
                  type="number"
                  value={range[0]}
                  onChange={(e) => handleRangeChange(index, parseInt(e.target.value, 10), range[1])}
                  className="w-16 border rounded px-2 text-center text-gray-900"
                  min={1}
                  max={numPages}
                  disabled={disabled} // Disable input when the form is loading
                />
                <span>|</span>
                <input
                  type="number"
                  value={range[1]}
                  onChange={(e) => handleRangeChange(index, range[0], parseInt(e.target.value, 10))}
                  className="w-16 border rounded px-2 text-center text-gray-900"
                  min={1}
                  max={numPages}
                  disabled={disabled} // Disable input when the form is loading
                />
              </div>
              <AiOutlineClose
                className="text-red-500 cursor-pointer"
                onClick={() => handleRemoveRange(index)}
              />
            </li>
          ))}
        </ul>
        <div className="flex gap-4 mt-6">
          <button
            onClick={handleSubmit}
            className={`w-1/2 ${loading ? 'bg-gray-400' : 'bg-blue-500 hover:bg-blue-700'} text-white font-bold py-3 px-6 rounded`}
            disabled={loading} // Disable button when loading
          >
            {loading ? 'Loading...' : 'Submit'}
          </button>
          <button
            onClick={addNewRange}
            className="w-1/2 bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded"
            disabled={disabled} // Disable button when the form is loading
          >
            + Add Range
          </button>
        </div>
      </div>
    </div>
  );
};

export default Splitpage;
