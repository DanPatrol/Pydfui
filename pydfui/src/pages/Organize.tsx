import React, { useState,useRef } from 'react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { Document} from 'react-pdf';
import { useLocation, useNavigate } from 'react-router-dom';
import Splitpreview from '../components/Splitpreview';


const ItemType = 'GRID_ITEM';

interface DraggableItemProps {
    id: number;
    index: number;
    moveItem: (dragIndex: number, hoverIndex: number) => void;
    children: React.ReactNode;
}

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
            className={`relative flex items-center justify-center w-full aspect-square border bg-white border-gray-300 rounded-lg shadow-sm p-2 ${
                isDragging ? 'opacity-50' : 'opacity-100'
            }`}
        >
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
            const response = await fetch('https://pydf-api.vercel.app/organize', {
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
                <div className="w-3/4 border-r border-gray-300">
                    <div className="relative w-full grid grid-cols-[repeat(auto-fill,minmax(250px,1fr))] gap-4 p-4">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            accept="application/pdf"
                            multiple
                            className="hidden"
                        />
                        {numPages.map((page, index) => (
                            <DraggableItem key={index} id={index} index={index} moveItem={moveItem}>
                                <Splitpreview file={items[0]} action={page + 1} />
                            </DraggableItem>
                        ))}
                    </div>
                </div>

                <div className="w-1/4 flex flex-col justify-between p-4 bg-gray-100">
                    <div>
                        <h2 className="text-xl font-bold mb-4">{processType}</h2>
                        <p className="text-gray-700">{processType || 'No process type specified'}</p>
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading} // Disable the button when loading is true
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-auto"
                    >
                        {loading ? 'Processing...' : 'Submit'}
                    </button>

                    <Document file={items[0]} onLoadSuccess={onDocumentLoadSuccess}></Document>
                </div>
            </div>
        </DndProvider>
    );
};

export default Organize;
