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
  const [containerWidth, setContainerWidth] = useState<number>(240);

  // Ref for container size
  const containerRef = useRef<HTMLDivElement>(null);

  // Effect to handle responsive sizing
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Mobile-first responsive sizing
        if (width < 640) { // sm breakpoint
          setContainerWidth(Math.min(width - 20, 280));
        } else if (width < 768) { // md breakpoint
          setContainerWidth(Math.min(width - 40, 320));
        } else {
          setContainerWidth(240);
        }
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

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
    <>
      {/* Display thumbnails for PDF files */}
      {fileURLs.map((fileURL, index) => {
        if (!fileURL) return null; // Skip files that failed type check
        return (
          <div
            key={index}
            className="w-full h-full flex justify-center items-center overflow-hidden px-2 sm:px-4"
            ref={containerRef}
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
                width={containerWidth}
                renderAnnotationLayer={false}
                renderTextLayer={false}
                rotate={rotation}
                className="shadow-lg rounded-lg"
              />
            </Document>
          </div>
        );
      })}
    </>
  );
};

export default PDFPreview;
