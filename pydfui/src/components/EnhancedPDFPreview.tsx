import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/TextLayer.css';
import 'react-pdf/dist/Page/AnnotationLayer.css';

// PDF.js worker setup
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface EnhancedPDFPreviewProps {
  file: File;
  onPageSelect?: (pageNumber: number) => void;
  renderQuality?: number; // DPI, default 150
  enableVirtualScroll?: boolean;
  selectedPages?: Set<number>;
}

interface PageVisibility {
  [key: number]: boolean;
}

const EnhancedPDFPreview: React.FC<EnhancedPDFPreviewProps> = ({
  file,
  onPageSelect,
  renderQuality = 150,
  enableVirtualScroll,
  selectedPages = new Set(),
}) => {
  const [fileURL, setFileURL] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPage, setHoveredPage] = useState<number | null>(null);
  const [modalPage, setModalPage] = useState<number | null>(null);
  const [pageVisibility, setPageVisibility] = useState<PageVisibility>({});
  const [containerWidth, setContainerWidth] = useState<number>(200);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate scale based on DPI (150 DPI is the minimum)
  const scale = Math.max(renderQuality / 72, 150 / 72);

  // Determine if virtual scrolling should be enabled
  const useVirtualScroll = enableVirtualScroll ?? numPages > 10;

  // Effect to handle Object URL creation
  useEffect(() => {
    if (file.type !== 'application/pdf') {
      setError('The provided file is not a PDF.');
      return;
    }

    const url = URL.createObjectURL(file);
    setFileURL(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  // Handle responsive container width
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Setup Intersection Observer for virtual scrolling
  useEffect(() => {
    if (!useVirtualScroll || numPages === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const updates: PageVisibility = {};
        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page') || '0');
          updates[pageNum] = entry.isIntersecting;
        });
        setPageVisibility((prev) => ({ ...prev, ...updates }));
      },
      {
        root: null,
        rootMargin: '200px',
        threshold: 0.01,
      }
    );

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [useVirtualScroll, numPages]);

  const handleLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    // Initialize all pages as visible if not using virtual scroll
    if (!useVirtualScroll) {
      const allVisible: PageVisibility = {};
      for (let i = 1; i <= numPages; i++) {
        allVisible[i] = true;
      }
      setPageVisibility(allVisible);
    }
  };

  const handlePageClick = (pageNumber: number) => {
    setModalPage(pageNumber);
    if (onPageSelect) {
      onPageSelect(pageNumber);
    }
  };

  const closeModal = () => {
    setModalPage(null);
  };

  // Ref callback for page thumbnails
  const pageRefCallback = useCallback(
    (node: HTMLDivElement | null, pageNumber: number) => {
      if (node && observerRef.current && useVirtualScroll) {
        observerRef.current.observe(node);
      }
    },
    [useVirtualScroll]
  );

  // Calculate thumbnail width (responsive)
  const getThumbnailWidth = () => {
    if (containerWidth < 480) return Math.max(containerWidth / 2 - 20, 120); // Extra small mobile
    if (containerWidth < 640) return Math.max(containerWidth / 2 - 30, 140); // Small mobile
    if (containerWidth < 768) return Math.max(containerWidth / 3 - 20, 160); // Medium mobile
    if (containerWidth < 1024) return 180; // Tablet
    return 200; // Desktop
  };

  const thumbnailWidth = getThumbnailWidth();

  return (
    <div className="enhanced-pdf-preview" ref={containerRef}>
      {error && (
        <div className="text-red-500 p-4 text-center">{error}</div>
      )}

      {fileURL && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-1 sm:gap-2 md:gap-3 lg:gap-4 p-2 sm:p-3 md:p-4 lg:p-6">
            {Array.from({ length: numPages }, (_, index) => {
              const pageNumber = index + 1;
              const isVisible = pageVisibility[pageNumber] || !useVirtualScroll;
              const isSelected = selectedPages.has(pageNumber);
              const isHovered = hoveredPage === pageNumber;

              return (
                <div
                  key={pageNumber}
                  ref={(node) => pageRefCallback(node, pageNumber)}
                  data-page={pageNumber}
                  className={`relative border rounded-lg shadow-md overflow-hidden cursor-pointer transition-all duration-200 min-h-[100px] sm:min-h-[120px] md:min-h-[140px] min-w-[100px] sm:min-w-[120px] md:min-w-[140px] touch-target ${
                    isSelected ? 'ring-2 ring-blue-500' : ''
                  } ${isHovered ? 'transform scale-105 shadow-xl' : ''}`}
                  style={{
                    minHeight: thumbnailWidth * 1.4,
                  }}
                  onMouseEnter={() => setHoveredPage(pageNumber)}
                  onMouseLeave={() => setHoveredPage(null)}
                  onClick={() => handlePageClick(pageNumber)}
                >
                  {/* Page Number Badge */}
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 bg-blue-600 text-white px-1 sm:px-2 py-1 rounded text-xs sm:text-sm font-semibold z-10">
                    {pageNumber}
                  </div>

                  {/* PDF Page Thumbnail */}
                  <div className="flex items-center justify-center bg-gray-100 p-1 sm:p-2">
                    {isVisible ? (
                      <Document
                        file={fileURL}
                        onLoadError={(err) => {
                          console.error('Error loading PDF:', err);
                        }}
                      >
                        <Page
                          pageNumber={pageNumber}
                          width={thumbnailWidth}
                          scale={scale}
                          renderAnnotationLayer={false}
                          renderTextLayer={false}
                        />
                      </Document>
                    ) : (
                      <div
                        className="flex items-center justify-center bg-gray-200"
                        style={{
                          width: thumbnailWidth,
                          height: thumbnailWidth * 1.4,
                        }}
                      >
                        <span className="text-gray-500 text-sm sm:text-base md:text-lg">Loading...</span>
                      </div>
                    )}
                  </div>

                  {/* Hover Overlay */}
                  {isHovered && (
                    <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center">
                      <span className="text-white text-sm sm:text-base md:text-lg font-semibold bg-black bg-opacity-50 px-2 sm:px-3 py-1 rounded">
                        Click to view
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Full Page Modal */}
          {modalPage !== null && (
            <div
              className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-2 sm:p-4"
              onClick={closeModal}
            >
              <div
                className="relative bg-white rounded-lg shadow-2xl w-full max-w-sm sm:max-w-md md:max-w-lg lg:max-w-2xl xl:max-w-4xl max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  className="absolute top-2 sm:top-4 right-2 sm:right-4 bg-red-500 text-white px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 min-h-[44px] min-w-[44px] rounded-lg hover:bg-red-600 z-10 text-sm sm:text-base md:text-lg"
                  onClick={closeModal}
                >
                  Close
                </button>
                <div className="p-3 sm:p-4 md:p-6">
                  <Document file={fileURL}>
                    <Page
                      pageNumber={modalPage}
                      width={Math.min(800, window.innerWidth - (window.innerWidth < 640 ? 40 : 100))}
                      scale={scale}
                      renderAnnotationLayer={true}
                      renderTextLayer={true}
                    />
                  </Document>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedPDFPreview;
