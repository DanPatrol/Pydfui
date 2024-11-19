import React, { useState, useEffect, useRef } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";

interface PDFThumbnailProps {
  files: File[]; // Array of uploaded PDF files
  action?: string; // Optional action to be performed
  rotation?: number; // Optional rotation value (default is 0)
}

const PDFPreview: React.FC<PDFThumbnailProps> = ({ files, rotation = 0 }) => {
  // PDF.js worker setup
  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
  ).toString();

  // State to track the rendering of thumbnails and errors
  const [fileURLs, setFileURLs] = useState<string[]>([]);
  const [_, setError] = useState<string | null>(null);

  // Ref for container size
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to handle Object URLs creation
  useEffect(() => {
    // Create Object URLs for files
    const urls = files.map((file) => {
      if (file.type !== "application/pdf") {
        setError("One or more files are not PDFs.");
        return "";
      }
      return URL.createObjectURL(file);
    });

    setFileURLs(urls);

    // Cleanup Object URLs on component unmount
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [files]);

  return (
    <div className="relative p-4">
      {/* Grid Layout for PDF Thumbnails */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-12">
        {/* Display thumbnails for PDF files */}
        {fileURLs.map((fileURL, index) => {
          if (!fileURL) return null; // Skip files that failed type check
          return (
            <div
              key={index}
              className="w-full overflow-hidden border p-2 rounded shadow flex justify-center items-center"
              ref={containerRef}
              style={{
                maxWidth: "250px",
                minWidth: "250px",
                height: "300px", // Set fixed height to make all containers the same height
              }}
            >
              <Document
                file={fileURL}
                onLoadSuccess={() => console.log(`Loaded: ${files[index].name}`)}
                onLoadError={(error) => {
                  setError(`Failed to load PDF: ${error.message}`);
                  console.error("Error loading PDF:", error);
                }}
              >
                <Page
                  pageNumber={1}
                  width={containerRef.current ? containerRef.current.offsetWidth - 20 : 200} // Adjusted width to fit within padding/border
                  height={containerRef.current ? containerRef.current.offsetHeight - 20 : 250} // Adjusted height similarly
                  renderAnnotationLayer={false}
                  renderTextLayer={false}
                  rotate={rotation} // Apply the optional rotation parameter
                />
              </Document>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PDFPreview;
