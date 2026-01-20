import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

interface PDFThumbnailProps {
  file: File; // Single uploaded PDF file
  action?: number; // Page number to be displayed (default to 1 if not provided)
}

const Splitpreview: React.FC<PDFThumbnailProps> = ({ file, action = 1 }) => {
  // PDF.js worker setup
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  // State to track the rendering of the thumbnail and errors
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0); // Track total pages in the PDF
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [pageWidth, setPageWidth] = useState<number>(180);

  // Ref for container size
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        // Mobile-first responsive sizing
        if (containerWidth < 640) { // sm breakpoint
          setPageWidth(Math.min(containerWidth - 20, 280));
        } else if (containerWidth < 768) { // md breakpoint
          setPageWidth(Math.min(containerWidth - 40, 320));
        } else {
          setPageWidth(Math.min(containerWidth - 10, 200));
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Effect to handle Object URL creation
  useEffect(() => {
    if (file.type !== "application/pdf") {
      setError("The provided file is not a PDF.");
      return;
    }

    // Create an Object URL for the file
    const url = URL.createObjectURL(file);
    setFileURL(url);

    // Cleanup Object URL on component unmount
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  };

  // Ensure page number is within valid range
  const pageNumber = Math.min(Math.max(action, 1), numPages);

  return (
    <div className="relative w-full h-full">
      {/* Display error message if any */}
      {error && (
        <div className="flex items-center justify-center h-full p-4">
          <p className="text-red-500 text-sm text-center">{error}</p>
        </div>
      )}

      {/* Loading indicator */}
      {isLoading && !error && (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Container for PDF Thumbnail */}
      {fileURL && (
        <div
          className="w-full h-full overflow-hidden flex justify-center items-center bg-gray-50 p-2 sm:p-4"
          ref={containerRef}
        >
          <Document
            file={fileURL}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={(err) => {
              setError(`Failed to load PDF: ${err.message}`);
              setIsLoading(false);
              console.error("Error loading PDF:", err);
            }}
            loading={
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
              </div>
            }
          >
            <Page
              pageNumber={pageNumber}
              width={pageWidth}
              renderAnnotationLayer={false}
              renderTextLayer={false}
              className="shadow-lg rounded-lg"
              loading={
                <div className="flex items-center justify-center" style={{ height: '250px' }}>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                </div>
              }
            />
          </Document>
        </div>
      )}
    </div>
  );
};

export default Splitpreview;
