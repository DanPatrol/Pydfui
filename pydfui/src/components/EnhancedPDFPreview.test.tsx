import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import fc from 'fast-check';
import EnhancedPDFPreview from './EnhancedPDFPreview';
import { pdfjs } from 'react-pdf';

// Mock react-pdf
vi.mock('react-pdf', async () => {
  const actual = await vi.importActual('react-pdf');
  return {
    ...actual,
    Document: ({ children, onLoadSuccess }: any) => {
      // Simulate successful load
      if (onLoadSuccess) {
        setTimeout(() => onLoadSuccess({ numPages: 15 }), 0);
      }
      return <div data-testid="pdf-document">{children}</div>;
    },
    Page: ({ pageNumber, width, scale }: any) => (
      <div
        data-testid={`pdf-page-${pageNumber}`}
        data-page-number={pageNumber}
        data-width={width}
        data-scale={scale}
      >
        Page {pageNumber}
      </div>
    ),
    pdfjs: {
      GlobalWorkerOptions: {
        workerSrc: '',
      },
    },
  };
});

// Helper to create a mock PDF file
const createMockPDFFile = (name: string = 'test.pdf'): File => {
  const blob = new Blob(['%PDF-1.4 mock content'], { type: 'application/pdf' });
  return new File([blob], name, { type: 'application/pdf' });
};

describe('EnhancedPDFPreview - Property-Based Tests', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  /**
   * Feature: pdf-tool-improvements, Property 1: Minimum DPI Rendering
   * For any PDF file loaded into the Preview_Component, all rendered thumbnails
   * should have a resolution of at least 150 DPI.
   * Validates: Requirements 1.1
   */
  describe('Property 1: Minimum DPI Rendering', () => {
    it('should render all thumbnails at minimum 150 DPI for any render quality setting', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random DPI values from 50 to 600
          fc.integer({ min: 50, max: 600 }),
          async (requestedDPI) => {
            const file = createMockPDFFile();
            
            const { container } = render(
              <EnhancedPDFPreview
                file={file}
                renderQuality={requestedDPI}
              />
            );

            // Wait for the document to load
            await waitFor(() => {
              expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });

            // Get all rendered pages
            const pages = container.querySelectorAll('[data-testid^="pdf-page-"]');
            
            // Verify at least one page is rendered
            expect(pages.length).toBeGreaterThan(0);

            // Check each page's scale
            pages.forEach((page) => {
              const scale = parseFloat(page.getAttribute('data-scale') || '0');
              
              // Scale should correspond to at least 150 DPI
              // 150 DPI / 72 (base DPI) = 2.083...
              const minimumScale = 150 / 72;
              const actualScale = Math.max(requestedDPI / 72, minimumScale);
              
              // The scale should be at least the minimum required for 150 DPI
              expect(scale).toBeGreaterThanOrEqual(minimumScale);
              expect(scale).toBeCloseTo(actualScale, 2);
            });
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should enforce minimum 150 DPI even when lower quality is requested', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate DPI values below 150
          fc.integer({ min: 50, max: 149 }),
          async (lowDPI) => {
            const file = createMockPDFFile();
            
            const { container } = render(
              <EnhancedPDFPreview
                file={file}
                renderQuality={lowDPI}
              />
            );

            await waitFor(() => {
              expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });

            const pages = container.querySelectorAll('[data-testid^="pdf-page-"]');
            const minimumScale = 150 / 72;

            pages.forEach((page) => {
              const scale = parseFloat(page.getAttribute('data-scale') || '0');
              // Even with low DPI request, scale should be at least 150 DPI
              expect(scale).toBeGreaterThanOrEqual(minimumScale);
            });
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  /**
   * Feature: pdf-tool-improvements, Property 3: Virtual Scrolling Activation
   * For any PDF with more than 10 pages, the Preview_Component should enable
   * virtual scrolling to render only visible thumbnails.
   * Validates: Requirements 1.4
   */
  describe('Property 3: Virtual Scrolling Activation', () => {
    it('should enable virtual scrolling for any PDF with more than 10 pages', async () => {
      // Mock IntersectionObserver
      const mockIntersectionObserver = vi.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      });
      window.IntersectionObserver = mockIntersectionObserver as any;

      await fc.assert(
        fc.asyncProperty(
          // Generate page counts greater than 10
          fc.integer({ min: 11, max: 100 }),
          async (pageCount) => {
            // Mock Document to return the specified page count
            vi.doMock('react-pdf', async () => {
              const actual = await vi.importActual('react-pdf');
              return {
                ...actual,
                Document: ({ children, onLoadSuccess }: any) => {
                  if (onLoadSuccess) {
                    setTimeout(() => onLoadSuccess({ numPages: pageCount }), 0);
                  }
                  return <div data-testid="pdf-document">{children}</div>;
                },
              };
            });

            const file = createMockPDFFile();
            
            render(
              <EnhancedPDFPreview
                file={file}
              />
            );

            await waitFor(() => {
              expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });

            // Virtual scrolling should be enabled (IntersectionObserver should be created)
            // We verify this by checking if IntersectionObserver was instantiated
            expect(mockIntersectionObserver).toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should not enable virtual scrolling for PDFs with 10 or fewer pages', async () => {
      const mockIntersectionObserver = vi.fn();
      mockIntersectionObserver.mockReturnValue({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
      });
      window.IntersectionObserver = mockIntersectionObserver as any;

      await fc.assert(
        fc.asyncProperty(
          // Generate page counts of 10 or less
          fc.integer({ min: 1, max: 10 }),
          async (pageCount) => {
            vi.doMock('react-pdf', async () => {
              const actual = await vi.importActual('react-pdf');
              return {
                ...actual,
                Document: ({ children, onLoadSuccess }: any) => {
                  if (onLoadSuccess) {
                    setTimeout(() => onLoadSuccess({ numPages: pageCount }), 0);
                  }
                  return <div data-testid="pdf-document">{children}</div>;
                },
              };
            });

            const file = createMockPDFFile();
            
            // Clear previous calls
            mockIntersectionObserver.mockClear();
            
            render(
              <EnhancedPDFPreview
                file={file}
              />
            );

            await waitFor(() => {
              expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });

            // For 10 or fewer pages, virtual scrolling should not be enabled
            // IntersectionObserver should not be called
            expect(mockIntersectionObserver).not.toHaveBeenCalled();
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  /**
   * Feature: pdf-tool-improvements, Property 4: Page Number Display
   * For any PDF thumbnail rendered, the page number should be clearly visible
   * on the thumbnail.
   * Validates: Requirements 1.5
   */
  describe('Property 4: Page Number Display', () => {
    it('should display page numbers on all rendered thumbnails', async () => {
      await fc.assert(
        fc.asyncProperty(
          // Generate random page counts
          fc.integer({ min: 1, max: 50 }),
          async (pageCount) => {
            vi.doMock('react-pdf', async () => {
              const actual = await vi.importActual('react-pdf');
              return {
                ...actual,
                Document: ({ children, onLoadSuccess }: any) => {
                  if (onLoadSuccess) {
                    setTimeout(() => onLoadSuccess({ numPages: pageCount }), 0);
                  }
                  return <div data-testid="pdf-document">{children}</div>;
                },
              };
            });

            const file = createMockPDFFile();
            
            const { container } = render(
              <EnhancedPDFPreview
                file={file}
              />
            );

            await waitFor(() => {
              expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });

            // Check that page number badges exist for all pages
            for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
              const pageContainer = container.querySelector(`[data-page="${pageNum}"]`);
              expect(pageContainer).toBeInTheDocument();
              
              // Find the page number badge within this page container
              const badge = pageContainer?.querySelector('.bg-blue-600');
              expect(badge).toBeInTheDocument();
              expect(badge?.textContent).toBe(pageNum.toString());
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should display correct page numbers for any page in the document', async () => {
      await fc.assert(
        fc.asyncProperty(
          fc.integer({ min: 1, max: 100 }),
          fc.integer({ min: 1, max: 100 }),
          async (totalPages, checkPage) => {
            // Ensure checkPage is within valid range
            const pageToCheck = Math.min(checkPage, totalPages);
            
            vi.doMock('react-pdf', async () => {
              const actual = await vi.importActual('react-pdf');
              return {
                ...actual,
                Document: ({ children, onLoadSuccess }: any) => {
                  if (onLoadSuccess) {
                    setTimeout(() => onLoadSuccess({ numPages: totalPages }), 0);
                  }
                  return <div data-testid="pdf-document">{children}</div>;
                },
              };
            });

            const file = createMockPDFFile();
            
            const { container } = render(
              <EnhancedPDFPreview
                file={file}
              />
            );

            await waitFor(() => {
              expect(screen.getByTestId('pdf-document')).toBeInTheDocument();
            });

            // Verify the specific page has correct number
            const pageContainer = container.querySelector(`[data-page="${pageToCheck}"]`);
            const badge = pageContainer?.querySelector('.bg-blue-600');
            
            expect(badge).toBeInTheDocument();
            expect(badge?.textContent).toBe(pageToCheck.toString());
          }
        ),
        { numRuns: 100 }
      );
    });
  });
});
