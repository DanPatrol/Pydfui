import { API_BASE_URL } from '../config';
import React, { useState, useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Document, pdfjs } from 'react-pdf';
import { useLocation, useNavigate } from 'react-router-dom';
import Splitpreview from '../components/Splitpreview';
import { FiMove, FiGrid, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';
import { AiOutlineArrowUp, AiOutlineArrowDown } from 'react-icons/ai';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

const ItemType = 'GRID_ITEM';

interface DraggableItemProps {
    id: number;
    index: number;
    moveItem: (dragIndex: number, hoverIndex: number) => void;
    children: React.ReactNode;
    totalPages: number;
}

const DraggableItem: React.FC<DraggableItemProps> = ({ index, moveItem, children, totalPages }) => {
    const [{ isDragging }, drag] = useDrag({
        type: ItemType,
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
    });

    const [{ isOver }, drop] = useDrop({
        accept: ItemType,
        hover: (draggedItem: { index: number }) => {
            if (draggedItem.index !== index) {
                moveItem(draggedItem.index, index);
                draggedItem.index = index;
            }
        },
        collect: (monitor) => ({
            isOver: monitor.isOver(),
        }),
    });

    return (
        <div
            ref={(node) => drag(drop(node))}
            className={`relative flex items-center justify-center w-full bg-white border-2 rounded-lg shadow-md transition-all duration-200 cursor-move ${
                isDragging 
                    ? 'opacity-40 scale-95 border-blue-400 shadow-2xl' 
                    : isOver
                    ? 'border-green-400 ring-4 ring-green-200 scale-105'
                    : 'border-gray-300 hover:border-blue-400 hover:shadow-lg'
            }`}
        >
            {/* Drag handle indicator */}
            <div className={`absolute top-2 left-2 z-10 bg-blue-500 text-white p-2 rounded-full transition-all ${
                isDragging ? 'scale-110' : ''
            }`}>
                <FiMove className="text-sm" />
            </div>

            {/* Page position badge */}
            <div className="absolute top-2 right-2 z-10 bg-gradient-to-r from-purple-500 to-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg">
                Position {index + 1}/{totalPages}
            </div>

            {/* Drag indicator overlay */}
            {isDragging && (
                <div className="absolute inset-0 bg-blue-500 bg-opacity-20 rounded-lg flex items-center justify-center z-5">
                    <div className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <FiMove />
                        DRAGGING
                    </div>
                </div>
            )}

            {/* Drop zone indicator */}
            {isOver && !isDragging && (
                <div className="absolute inset-0 bg-green-500 bg-opacity-20 rounded-lg flex items-center justify-center z-5 border-4 border-dashed border-green-500">
                    <div className="bg-green-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2">
                        <AiOutlineArrowDown className="animate-bounce" />
                        DROP HERE
                    </div>
                </div>
            )}

            {children}
        </div>
    );
};

const Organize = () => {
    const location = useLocation();
    const { files, processType } = location.state || {};
    const uploadedFiles: File[] = files ? Array.from(files) : [];
  
  // Initialize state with 'File[]' type
    const [items, setItems] = useState<File[]>(uploadedFiles);
    const [numPages, setNumPages] = useState<number[]>([]);
    const [loading, setLoading] = useState<boolean>(false); // New loading state
    const navigate = useNavigate();

    const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
        setNumPages([...Array(numPages).keys()]);
    };

    const fileInputRef = useRef<HTMLInputElement | null>(null);

    const moveItem = (fromIndex: number, toIndex: number) => {
        const updatedPages = [...numPages];
        const [movedPage] = updatedPages.splice(fromIndex, 1);
        updatedPages.splice(toIndex, 0, movedPage);
        setNumPages(updatedPages);
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const newFiles = event.target.files;
        if (newFiles) {
            const pdfFiles = Array.from(newFiles).filter((file) => file.type === 'application/pdf');
            setItems((prevItems) => [...prevItems, ...pdfFiles]);
        }
    };

    

    const handleSubmit = async () => {
        setLoading(true); // Disable the button when submitting
        const formData = new FormData();
        formData.append('file', items[0]);

        const adjustedIndexes = numPages.map((index) => index + 1);
        formData.append('pages_to_organize', adjustedIndexes.join(','));

        try {
            const response = await fetch(`${API_BASE_URL}/organize`, {
                method: 'POST',
                body: formData,
            });

            if (response.ok) {
                const blob = await response.blob();
                const contentDisposition = response.headers.get('Content-Disposition');
                let filename = 'danorganized.pdf';
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

                setTimeout(() => {
                    navigate('/end/', {
                        state: {
                            processType: 'organize',
                            status: response.status,
                            filename,
                        },
                    });
                }, 500);
            } else {
                const errorText = await response.text();
                console.error('Failed to organize PDFs:', errorText);

                setTimeout(() => {
                    navigate('/end/', {
                        state: {
                            processType: 'organize',
                            status: response.status,
                            error: true,
                            errorMessage: errorText,
                        },
                    });
                }, 500);
            }
        } catch (error:unknown) {
            console.error('Error while sending files:', error);
            const errorMessage = (error as Error).message;
            setTimeout(() => {
                navigate('/end/', {
                    state: {
                        processType: 'organize',
                        error: true,
                        errorMessage: errorMessage,
                    },
                });
            }, 500);
        } finally {
            setLoading(false); // Enable the button again after the process
        }
    };

    return (
        <DndProvider backend={HTML5Backend}>
            <div className="flex w-full h-screen">
                {/* Left side: Drag and drop grid */}
                <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gradient-to-br from-gray-50 to-blue-50">
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
                        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center">
                            <FiGrid className="mr-3 text-blue-500" />
                            Organize Pages
                        </h2>
                        <p className="text-gray-600">
                            Drag and drop pages to reorder them. The new order will be saved to your PDF.
                        </p>
                    </div>

                    {/* Statistics */}
                    {numPages.length > 0 && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Total Pages</p>
                                        <p className="text-2xl font-bold text-blue-600">{numPages.length}</p>
                                    </div>
                                    <FiGrid className="text-3xl text-blue-400" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-purple-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Reorderable</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            <FiMove className="inline" />
                                        </p>
                                    </div>
                                    <FiMove className="text-3xl text-purple-400" />
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-lg shadow-md border-2 border-green-200">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Status</p>
                                        <p className="text-sm font-bold text-green-600">Ready</p>
                                    </div>
                                    <FiCheckCircle className="text-3xl text-green-400" />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Help card */}
                    <div className="mb-6 bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-2 border-blue-200">
                        <div className="flex items-start">
                            <FiAlertCircle className="text-blue-500 text-xl mr-3 mt-1" />
                            <div>
                                <p className="text-sm font-semibold text-blue-800">💡 How to Organize</p>
                                <p className="text-xs text-blue-700 mt-1">
                                    Click and drag any page to a new position. The page numbers will update automatically. Drop zones will highlight in green when you hover over them.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Pages grid */}
                    {numPages.length > 0 ? (
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-6">
                            {numPages.map((page, index) => (
                                <DraggableItem 
                                    key={index} 
                                    id={index} 
                                    index={index} 
                                    moveItem={moveItem}
                                    totalPages={numPages.length}
                                >
                                    <Splitpreview file={items[0]} action={page + 1} />
                                </DraggableItem>
                            ))}
                        </div>
                    ) : (
                        <div className="flex items-center justify-center h-96">
                            <div className="text-center">
                                <FiGrid className="text-6xl text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600 text-lg">No PDF loaded</p>
                                <p className="text-gray-400 text-sm mt-2">Upload a PDF to start organizing</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Right side: Controls */}
                <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg flex flex-col">
                    <div className="flex-grow">
                        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
                            Organize Pages
                        </h2>

                        {/* Hidden Document component */}
                        {items.length > 0 && (
                            <div className="hidden">
                                <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess}></Document>
                            </div>
                        )}

                        {/* Current order preview */}
                        {numPages.length > 0 && (
                            <div className="mb-6 bg-white p-5 rounded-lg shadow-md border-2 border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
                                    <FiGrid className="mr-2 text-blue-500" />
                                    Current Order
                                </h3>
                                <div className="bg-gray-50 p-3 rounded-lg max-h-48 overflow-y-auto">
                                    <div className="flex flex-wrap gap-2">
                                        {numPages.map((page, index) => (
                                            <span
                                                key={index}
                                                className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-bold"
                                            >
                                                {page + 1}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2">
                                    Pages will be saved in this order
                                </p>
                            </div>
                        )}

                        {/* Process info */}
                        <div className="mb-6 bg-gradient-to-r from-purple-50 to-blue-50 p-5 rounded-lg border-2 border-purple-200">
                            <h3 className="text-lg font-semibold text-gray-800 mb-3">Process Type</h3>
                            <p className="text-gray-700 font-medium">{processType || 'Organize Pages'}</p>
                            <p className="text-xs text-gray-500 mt-2">
                                Reorder pages by dragging them to new positions
                            </p>
                        </div>

                        {/* Quick tips */}
                        <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
                            <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Quick Tips</h4>
                            <ul className="text-xs text-blue-700 space-y-1">
                                <li>• Drag pages to reorder them</li>
                                <li>• Green highlight = drop zone</li>
                                <li>• Blue badge = drag handle</li>
                                <li>• Position updates automatically</li>
                                <li>• Original PDF stays unchanged</li>
                            </ul>
                        </div>
                    </div>

                    {/* Submit button */}
                    <button
                        onClick={handleSubmit}
                        disabled={loading || numPages.length === 0}
                        className={`w-full mt-6 ${
                            loading || numPages.length === 0
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
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
                                <FiCheckCircle className="mr-2 text-xl" />
                                Save New Order
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </DndProvider>
    );
};

export default Organize;
