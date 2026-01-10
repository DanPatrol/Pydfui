import React, { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { useLocation, useNavigate } from 'react-router-dom';
import PDFPreview from './Adjuster';
import { IoAddCircle } from 'react-icons/io5';
import { API_BASE_URL } from '../config';

interface ResponsiveGridProps {
  onReorder?: (newOrder: React.ReactNode[]) => void;
}

interface DraggableItemProps {
  id: number;
  index: number;
  moveItem: (dragIndex: number, hoverIndex: number) => void;
  children: React.ReactNode;
}

const ItemType = 'GRID_ITEM';

const DraggableItem: React.FC<DraggableItemProps> = ({ index, moveItem, children }) => {
  const [{ isDragging }, drag] = useDrag({
    type: ItemType,
    item: { index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  });

  const [, drop] = useDrop({
    accept: ItemType,
    hover: (draggedItem: { index: number }) => {
      if (draggedItem.index !== index) {
        moveItem(draggedItem.index, index);
        draggedItem.index = index;
      }
    },
  });

  return (
    <div
      ref={(node) => drag(drop(node))}
      className={`relative flex items-center justify-center w-full aspect-[3/4] border-2 rounded-xl shadow-sm p-2 bg-white transition-all cursor-move ${
        isDragging ? 'opacity-40 scale-95 border-blue-400' : 'opacity-100 hover:shadow-md hover:border-blue-300 border-gray-200'
      }`}
    >
      {children}
      <div className="absolute top-2 right-2 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
        <span className="text-xs text-gray-600">⋮⋮</span>
      </div>
    </div>
  );
};

const Ajusterlist: React.FC<ResponsiveGridProps> = () => {
  const location = useLocation();
  const { files, processType } = location.state || {};
  const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
  const [items, setItems] = useState<File[]>(uploadedFiles);
  const [loading, setLoading] = useState<boolean>(false);  // Added loading state
  const navigate = useNavigate();

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const moveItem = (fromIndex: number, toIndex: number) => {
    const updatedItems = [...items];
    const [movedItem] = updatedItems.splice(fromIndex, 1);
    updatedItems.splice(toIndex, 0, movedItem);
    setItems(updatedItems);
  };

  

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = event.target.files;
    if (newFiles) {
      const allFiles = Array.from(newFiles);
      const pdfFiles = allFiles.filter((file) => file.type === 'application/pdf');
      const nonPdfCount = allFiles.length - pdfFiles.length;
      
      if (nonPdfCount > 0) {
        alert(`${nonPdfCount} non-PDF file(s) were filtered out. Only PDF files can be merged.`);
      }
      
      if (pdfFiles.length > 0) {
        setItems((prevItems) => [...prevItems, ...pdfFiles]);
      }
    }
  };

  const handleAddClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async () => {
    setLoading(true); // Start loading

    const formData = new FormData();
    items.forEach((file) => {
      formData.append('files', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/merge_pdfs`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'merged_output.pdf';
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'merge',
              status: response.status,
              filename: 'merged_output.pdf',
            },
          });
        }, 500);
      } else {
        console.error('Failed to merge PDFs:', response.statusText);
        navigate('/end/', {
          state: {
            processType: 'merge',
            status: response.status,
            filename: 'error',
          },
        });
      }
    } catch (error) {
      console.error('Error while sending files:', error);
      navigate('/end/', {
        state: {
          processType: 'merge',
          status: 'failed',
          filename: 'error',
        },
      });
    } finally {
      setLoading(false); // Stop loading when the request completes
    }
  };

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Merge PDF Files</h1>
            <p className="text-gray-600">Drag to reorder your files, then merge them into a single PDF</p>
          </div>

          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1 bg-white rounded-2xl shadow-lg p-8">
              <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <span className="text-xl">📄</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Your Files</h2>
                    <p className="text-sm text-gray-500">{items.length} PDF{items.length !== 1 ? 's' : ''} selected</p>
                  </div>
                </div>
                
                <button
                  onClick={handleAddClick}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors shadow-sm hover:shadow-md"
                >
                  <IoAddCircle className="text-xl" />
                  Add Files
                </button>
              </div>

              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="application/pdf"
                multiple
                className="hidden"
                title="Select PDF files only"
              />

              {items.length === 0 ? (
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl">📁</span>
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No files selected</h3>
                  <p className="text-gray-500 mb-4">Click "Add Files" to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {items.map((file: File, index) => (
                    <DraggableItem key={index} id={index} index={index} moveItem={moveItem}>
                      <PDFPreview files={[file]} />
                    </DraggableItem>
                  ))}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="w-80 bg-white rounded-2xl shadow-lg p-6 flex flex-col h-fit sticky top-8">
              <div className="space-y-6 flex-1">
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-5 border border-blue-100">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-lg">💡</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-1">How it works</h3>
                      <p className="text-sm text-gray-600">Follow these simple steps</p>
                    </div>
                  </div>
                  <ul className="space-y-3 text-sm text-gray-700">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-semibold">1.</span>
                      <span>Add at least 2 PDF files</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-semibold">2.</span>
                      <span>Drag files to reorder them</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-semibold">3.</span>
                      <span>Click merge to combine</span>
                    </li>
                  </ul>
                </div>

                <div className="border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-600">Files Ready</span>
                    <div className={`w-3 h-3 rounded-full ${items.length >= 2 ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                  </div>
                  <div className="text-4xl font-bold text-gray-900 mb-1">{items.length}</div>
                  <p className="text-xs text-gray-500">
                    {items.length < 2 ? `Add ${2 - items.length} more file${2 - items.length !== 1 ? 's' : ''} to continue` : 'Ready to merge'}
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                <button
                  onClick={handleSubmit}
                  disabled={loading || items.length < 2}
                  className={`w-full py-3 px-4 rounded-xl font-semibold transition-all ${
                    loading || items.length < 2
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40 transform hover:-translate-y-0.5'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Merging PDFs...
                    </span>
                  ) : (
                    `Merge ${items.length} PDF${items.length !== 1 ? 's' : ''}`
                  )}
                </button>
                
                {loading && (
                  <p className="text-xs text-center text-gray-500">This may take a moment...</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
};

export default Ajusterlist;
