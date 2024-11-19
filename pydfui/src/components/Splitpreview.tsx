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

  // Ref for container size
  const containerRef = useRef<HTMLDivElement>(null);

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
  };

  // Ensure page number is within valid range
  const pageNumber = Math.min(Math.max(action, 1), numPages);

  return (
    <div className="relative p-4">
      {/* Display error message if any */}
      {error && <p className="text-red-500">{error}</p>}

      {/* Container for PDF Thumbnail */}
      {fileURL && (
        <div
          className="w-full overflow-hidden border p-2 rounded shadow flex justify-center items-center"
          ref={containerRef}
          style={{
            maxWidth: "200px",
            minWidth: "200px",
            height: "300px", // Set fixed height to make the container consistent
          }}
        >
          <Document
            file={fileURL}
            onLoadSuccess={handleLoadSuccess}
            onLoadError={(err) => {
              setError(`Failed to load PDF: ${err.message}`);
              console.error("Error loading PDF:", err);
            }}
          >
            <Page
              pageNumber={pageNumber}
              width={containerRef.current ? containerRef.current.offsetWidth - 20 : 200} // Adjusted width to fit within padding/border
              height={containerRef.current ? containerRef.current.offsetHeight - 20 : 250} // Adjusted height similarly
              renderAnnotationLayer={false}
              renderTextLayer={false}
            />
          </Document>
        </div>
      )}
    </div>
  );
};

export default Splitpreview;
