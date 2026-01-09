import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import EnhancedUploadInterface from './EnhancedUploadInterface';

/**
 * Feature: pdf-tool-improvements, Property 9: Upload Progress Display
 * For any file being uploaded, the Upload_Interface should display a progress bar 
 * showing the upload percentage.
 * Validates: Requirements 2.2
 */
describe('Property 9: Upload Progress Display', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display progress for any file being uploaded', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1024, maxLength: 5 * 1024 * 1024 }),
        fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
        async (fileData, fileName) => {
          const onUploadComplete = vi.fn();
          const onUploadError = vi.fn();

          render(
            <EnhancedUploadInterface
              acceptedTypes={['application/pdf']}
              maxFileSize={100 * 1024 * 1024}
              onUploadComplete={onUploadComplete}
              onUploadError={onUploadError}
              showProgress={true}
            />
          );

          const file = new File([fileData], fileName, { type: 'application/pdf' });
          const input = screen.getByTestId('file-input') as HTMLInputElement;

          // Simulate file selection
          await userEvent.upload(input, file);

          // Wait for progress container to appear
          await waitFor(
            () => {
              const progressContainer = screen.queryByTestId('progress-container');
              expect(progressContainer).toBeTruthy();
            },
            { timeout: 1000 }
          );

          // Verify progress is displayed
          const progressContainer = screen.getByTestId('progress-container');
          expect(progressContainer).toBeTruthy();

          // Verify file name is displayed
          expect(progressContainer.textContent).toContain(fileName);

          // Wait for upload to complete
          await waitFor(
            () => {
              expect(onUploadComplete).toHaveBeenCalled();
            },
            { timeout: 5000 }
          );

          cleanup();
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  }, 120000);

  it('should show progress percentage between 0 and 100', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1024, maxLength: 3 * 1024 * 1024 }),
        async (fileData) => {
          const onUploadComplete = vi.fn();
          const progressUpdates: number[] = [];

          render(
            <EnhancedUploadInterface
              acceptedTypes={['application/pdf']}
              maxFileSize={100 * 1024 * 1024}
              onUploadComplete={onUploadComplete}
              showProgress={true}
            />
          );

          const file = new File([fileData], 'test.pdf', { type: 'application/pdf' });
          const input = screen.getByTestId('file-input') as HTMLInputElement;

          await userEvent.upload(input, file);

          // Wait for progress to appear and collect progress values
          await waitFor(
            () => {
              const progressContainer = screen.queryByTestId('progress-container');
              if (progressContainer) {
                const text = progressContainer.textContent || '';
                const match = text.match(/(\d+)%/);
                if (match) {
                  const progress = parseInt(match[1]);
                  progressUpdates.push(progress);
                }
              }
            },
            { timeout: 1000 }
          );

          // Wait for completion
          await waitFor(
            () => {
              expect(onUploadComplete).toHaveBeenCalled();
            },
            { timeout: 5000 }
          );

          // Verify all progress values are between 0 and 100
          progressUpdates.forEach(progress => {
            expect(progress).toBeGreaterThanOrEqual(0);
            expect(progress).toBeLessThanOrEqual(100);
          });

          cleanup();
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  }, 120000);
});

/**
 * Feature: pdf-tool-improvements, Property 8: Invalid File Type Rejection
 * For any file upload with an invalid type for the selected operation, 
 * the Upload_Interface should display an error message listing the accepted file formats.
 * Validates: Requirements 2.3
 */
describe('Property 8: Invalid File Type Rejection', () => {
  afterEach(() => {
    cleanup();
  });

  it('should reject invalid file types and display error message with accepted formats', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 100, maxLength: 1024 }),
        fc.constantFrom('image/jpeg', 'image/png', 'text/plain', 'application/json'),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_')),
        async (fileData, invalidType, baseName) => {
          const onUploadComplete = vi.fn();
          const onUploadError = vi.fn();

          render(
            <EnhancedUploadInterface
              acceptedTypes={['application/pdf']}
              maxFileSize={100 * 1024 * 1024}
              onUploadComplete={onUploadComplete}
              onUploadError={onUploadError}
            />
          );

          const extension = invalidType.split('/')[1];
          const fileName = `${baseName}.${extension}`;
          const file = new File([fileData], fileName, { type: invalidType });
          const input = screen.getByTestId('file-input') as HTMLInputElement;

          await userEvent.upload(input, file);

          // Wait for error callback
          await waitFor(
            () => {
              expect(onUploadError).toHaveBeenCalled();
            },
            { timeout: 2000 }
          );

          // Verify error was called with correct structure
          expect(onUploadError).toHaveBeenCalledWith(
            expect.objectContaining({
              code: 'INVALID_FILE_TYPE',
              message: expect.stringContaining('Invalid file type'),
              fileName: fileName,
            })
          );

          // Verify error message contains accepted formats
          const errorCall = onUploadError.mock.calls[0][0];
          expect(errorCall.message).toContain('PDF');

          // Verify upload complete was NOT called
          expect(onUploadComplete).not.toHaveBeenCalled();

          cleanup();
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );
  }, 60000);

  it('should accept valid file types and not display error', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.uint8Array({ minLength: 1024, maxLength: 3 * 1024 * 1024 }),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
        async (fileData, fileName) => {
          const onUploadComplete = vi.fn();
          const onUploadError = vi.fn();

          render(
            <EnhancedUploadInterface
              acceptedTypes={['application/pdf']}
              maxFileSize={100 * 1024 * 1024}
              onUploadComplete={onUploadComplete}
              onUploadError={onUploadError}
            />
          );

          const file = new File([fileData], fileName, { type: 'application/pdf' });
          const input = screen.getByTestId('file-input') as HTMLInputElement;

          await userEvent.upload(input, file);

          // Wait for upload to complete
          await waitFor(
            () => {
              expect(onUploadComplete).toHaveBeenCalled();
            },
            { timeout: 5000 }
          );

          // Verify no error was called for valid file type
          const invalidTypeErrors = onUploadError.mock.calls.filter(
            call => call[0].code === 'INVALID_FILE_TYPE'
          );
          expect(invalidTypeErrors.length).toBe(0);

          cleanup();
        }
      ),
      { numRuns: 10, timeout: 10000 }
    );
  }, 120000);

  it('should reject files exceeding size limit and display error with max size', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.integer({ min: 101, max: 150 }).map(mb => mb * 1024 * 1024),
        fc.string({ minLength: 1, maxLength: 20 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
        async (fileSize, fileName) => {
          const onUploadComplete = vi.fn();
          const onUploadError = vi.fn();
          const maxSize = 100 * 1024 * 1024; // 100MB

          render(
            <EnhancedUploadInterface
              acceptedTypes={['application/pdf']}
              maxFileSize={maxSize}
              onUploadComplete={onUploadComplete}
              onUploadError={onUploadError}
            />
          );

          // Create a file larger than max size
          const largeData = new Uint8Array(fileSize);
          const file = new File([largeData], fileName, { type: 'application/pdf' });
          const input = screen.getByTestId('file-input') as HTMLInputElement;

          await userEvent.upload(input, file);

          // Wait for error callback
          await waitFor(
            () => {
              expect(onUploadError).toHaveBeenCalled();
            },
            { timeout: 2000 }
          );

          // Verify error was called with correct structure
          expect(onUploadError).toHaveBeenCalledWith(
            expect.objectContaining({
              code: 'FILE_TOO_LARGE',
              message: expect.stringContaining('exceeds maximum size'),
              fileName: fileName,
            })
          );

          // Verify upload complete was NOT called
          expect(onUploadComplete).not.toHaveBeenCalled();

          cleanup();
        }
      ),
      { numRuns: 10, timeout: 5000 }
    );
  }, 60000);
});
