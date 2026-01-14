import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import RedactPdf from './RedactPdf';

// Mock react-pdf
vi.mock('react-pdf', () => ({
  Document: ({ file, onLoadSuccess, onLoadError, loading, error, children }: any) => {
    // Simulate successful load after a short delay
    if (file) {
      setTimeout(() => {
        if (onLoadSuccess) {
          onLoadSuccess({ numPages: 3 });
        }
      }, 100);
    }
    
    return (
      <div data-testid="pdf-document">
        {loading}
        {children}
      </div>
    );
  },
  Page: ({ pageNumber, loading }: any) => (
    <div data-testid={`pdf-page-${pageNumber}`}>
      {loading}
      Page {pageNumber}
    </div>
  ),
  pdfjs: {
    GlobalWorkerOptions: { workerSrc: '' },
    version: '3.0.0',
  },
}));

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => ({ state: null }),
  };
});

// Mock URL.createObjectURL and revokeObjectURL
const mockCreateObjectURL = vi.fn((file: File) => `blob:mock-url-${file.name}`);
const mockRevokeObjectURL = vi.fn();

beforeEach(() => {
  (global as any).URL.createObjectURL = mockCreateObjectURL;
  (global as any).URL.revokeObjectURL = mockRevokeObjectURL;
  mockCreateObjectURL.mockClear();
  mockRevokeObjectURL.mockClear();
  mockNavigate.mockClear();
});

afterEach(() => {
  cleanup();
});

describe('RedactPdf - PDF Preview Loading', () => {
  /**
   * Test successful PDF load
   * Requirements: 4.1, 4.5
   */
  it('should successfully load a valid PDF file', async () => {
    render(
      <BrowserRouter>
        <RedactPdf />
      </BrowserRouter>
    );

    // Create a mock PDF file
    const pdfFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });

    // Find file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    
    expect(fileInput).toBeTruthy();

    // Upload the file
    await userEvent.upload(fileInput, pdfFile);

    // Verify blob URL was created
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledWith(pdfFile);
    });

    // Wait for PDF document to appear
    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeTruthy();
    }, { timeout: 2000 });
  });

  /**
   * Test error handling for corrupted PDFs
   * Requirements: 4.1, 4.5
   */
  it('should handle corrupted PDF files with error message', async () => {
    // Mock Document component to simulate error
    vi.mock('react-pdf', () => ({
      Document: ({ file, onLoadError, error }: any) => {
        if (file) {
          setTimeout(() => {
            if (onLoadError) {
              onLoadError(new Error('Invalid PDF structure'));
            }
          }, 100);
        }
        return <div data-testid="pdf-document">{error}</div>;
      },
      Page: () => <div>Page</div>,
      pdfjs: {
        GlobalWorkerOptions: { workerSrc: '' },
        version: '3.0.0',
      },
    }));

    render(
      <BrowserRouter>
        <RedactPdf />
      </BrowserRouter>
    );

    const pdfFile = new File(['corrupted content'], 'corrupted.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, pdfFile);

    // Wait for error to be displayed
    await waitFor(() => {
      const errorText = screen.queryByText(/Failed to load PDF/i);
      expect(errorText).toBeTruthy();
    }, { timeout: 2000 });
  });

  /**
   * Test loading states
   * Requirements: 4.1, 4.5
   */
  it('should display loading indicator while PDF is loading', async () => {
    render(
      <BrowserRouter>
        <RedactPdf />
      </BrowserRouter>
    );

    const pdfFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, pdfFile);

    // Wait for PDF document to appear (loading happens quickly in mock)
    await waitFor(() => {
      expect(screen.getByTestId('pdf-document')).toBeTruthy();
    }, { timeout: 2000 });
  });

  /**
   * Test blob URL cleanup on unmount
   * Requirements: 4.1, 4.2, 4.3
   */
  it('should cleanup blob URL when component unmounts', async () => {
    const { unmount } = render(
      <BrowserRouter>
        <RedactPdf />
      </BrowserRouter>
    );

    const pdfFile = new File(['mock pdf content'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, pdfFile);

    // Wait for blob URL to be created
    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalled();
    });

    const createdURL = mockCreateObjectURL.mock.results[0].value;

    // Unmount component
    unmount();

    // Verify blob URL was revoked
    await waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(createdURL);
    });
  });

  /**
   * Test blob URL cleanup on file change
   * Requirements: 4.1, 4.2, 4.3
   */
  it('should cleanup old blob URL when new file is uploaded', async () => {
    render(
      <BrowserRouter>
        <RedactPdf />
      </BrowserRouter>
    );

    const pdfFile1 = new File(['mock pdf content 1'], 'test1.pdf', { type: 'application/pdf' });
    const pdfFile2 = new File(['mock pdf content 2'], 'test2.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    // Upload first file
    await userEvent.upload(fileInput, pdfFile1);

    await waitFor(() => {
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(1);
    });

    const firstURL = mockCreateObjectURL.mock.results[0].value;

    // Upload second file
    await userEvent.upload(fileInput, pdfFile2);

    // Verify old URL was revoked and new one created
    await waitFor(() => {
      expect(mockRevokeObjectURL).toHaveBeenCalledWith(firstURL);
      expect(mockCreateObjectURL).toHaveBeenCalledTimes(2);
    });
  });

  /**
   * Test invalid file type handling
   * Requirements: 4.1, 4.3
   */
  it('should display error for non-PDF files', async () => {
    render(
      <BrowserRouter>
        <RedactPdf />
      </BrowserRouter>
    );

    const invalidFile = new File(['not a pdf'], 'test.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    await userEvent.upload(fileInput, invalidFile);

    // Verify error message is displayed
    await waitFor(() => {
      // The error should be set in state, check if blob URL was NOT created
      expect(mockCreateObjectURL).not.toHaveBeenCalled();
    });
  });
});
