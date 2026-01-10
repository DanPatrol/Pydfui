import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor } from '@testing-library/react`;
import userEvent from '@testing-library/user-event';
import fc from 'fast-check';
import ProcessingManager, { ProcessingOperation } from './ProcessingManager';

/**
 * Feature: pdf-tool-improvements, Property 10: Processing Progress Indicator
 * For any PDF processing operation that is started, the PDF_Tool should display 
 * a progress indicator until the operation completes or fails.
 * Validates: Requirements 3.1
 */
describe('Property 10: Processing Progress Indicator', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display progress indicator for any processing operation', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress', 'rotate', 'watermark', 'extract', 'organize', 'remove', 'ocr', 'edit', 'convert', 'form-fill', 'compare'),
          status: fc.constantFrom('pending', 'processing'),
          progress: fc.integer({ min: 0, max: 100 }),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          startTime: fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        }),
        (operation: ProcessingOperation) => {
          const { container } = render(
            <ProcessingManager
              operations={[operation]}
              showNotifications={false}
            />
          );

          // Verify processing manager is rendered
          const manager = screen.getByTestId('processing-manager');
          expect(manager).toBeTruthy();

          // Verify active operations section exists
          const activeOps = screen.getByTestId('active-operations');
          expect(activeOps).toBeTruthy();

          // Verify the specific operation is displayed
          const operationElement = screen.getByTestId(`operation-${operation.id}`);
          expect(operationElement).toBeTruthy();

          // Verify progress bar container exists
          const progressContainer = screen.getByTestId('progress-bar-container');
          expect(progressContainer).toBeTruthy();

          // Verify progress bar exists
          const progressBar = screen.getByTestId('progress-bar');
          expect(progressBar).toBeTruthy();

          // Verify progress percentage is displayed
          const progressPercentage = screen.getByTestId('progress-percentage');
          expect(progressPercentage).toBeTruthy();
          expect(progressPercentage.textContent).toContain(`${operation.progress}%`);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display progress indicator until operation completes', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (baseOperation) => {
          // Start with processing status
          const processingOp: ProcessingOperation = {
            ...baseOperation,
            status: 'processing',
            progress: 50,
            startTime: Date.now(),
          };

          const { rerender } = render(
            <ProcessingManager
              operations={[processingOp]}
              showNotifications={false}
            />
          );

          // Verify progress indicator is shown
          let progressBar = screen.queryByTestId('progress-bar');
          expect(progressBar).toBeTruthy();

          // Update to completed status
          const completedOp: ProcessingOperation = {
            ...processingOp,
            status: 'success',
            progress: 100,
            endTime: Date.now(),
          };

          rerender(
            <ProcessingManager
              operations={[completedOp]}
              showNotifications={false}
            />
          );

          // Wait for UI to update
          await waitFor(() => {
            const activeOps = screen.queryByTestId('active-operations');
            expect(activeOps).toBeFalsy();
          });

          // Verify operation moved to completed section
          const completedOps = screen.getByTestId('completed-operations');
          expect(completedOps).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should show progress percentage between 0 and 100', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          status: fc.constantFrom('pending', 'processing'),
          progress: fc.integer({ min: 0, max: 100 }),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          startTime: fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        }),
        (operation: ProcessingOperation) => {
          render(
            <ProcessingManager
              operations={[operation]}
              showNotifications={false}
            />
          );

          const progressPercentage = screen.getByTestId('progress-percentage');
          const percentageText = progressPercentage.textContent || '';
          const match = percentageText.match(/(\d+)%/);
          
          expect(match).toBeTruthy();
          if (match) {
            const percentage = parseInt(match[1]);
            expect(percentage).toBeGreaterThanOrEqual(0);
            expect(percentage).toBeLessThanOrEqual(100);
            expect(percentage).toBe(operation.progress);
          }

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: pdf-tool-improvements, Property 11: Success Notification
 * For any completed processing operation, the PDF_Tool should display 
 * a success notification with a download option.
 * Validates: Requirements 3.3
 */
describe('Property 11: Success Notification', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display success notification for any completed operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress', 'rotate', 'watermark'),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (baseOperation) => {
          const onDownload = vi.fn();

          // Start with processing status
          const processingOp: ProcessingOperation = {
            ...baseOperation,
            status: 'processing',
            progress: 50,
            startTime: Date.now(),
          };

          const { rerender } = render(
            <ProcessingManager
              operations={[processingOp]}
              onDownload={onDownload}
              showNotifications={true}
            />
          );

          // Verify no notification yet
          let notificationsContainer = screen.queryByTestId('notifications-container');
          expect(notificationsContainer).toBeFalsy();

          // Update to success status
          const successOp: ProcessingOperation = {
            ...processingOp,
            status: 'success',
            progress: 100,
            endTime: Date.now(),
          };

          rerender(
            <ProcessingManager
              operations={[successOp]}
              onDownload={onDownload}
              showNotifications={true}
            />
          );

          // Wait for notification to appear
          await waitFor(() => {
            notificationsContainer = screen.queryByTestId('notifications-container');
            expect(notificationsContainer).toBeTruthy();
          });

          // Verify success notification is displayed
          const successNotification = screen.getByTestId('notification-success');
          expect(successNotification).toBeTruthy();
          expect(successNotification.textContent).toContain('Success');
          expect(successNotification.textContent).toContain(baseOperation.fileName);

          // Verify download button is present
          const downloadButton = screen.getByTestId('download-button');
          expect(downloadButton).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should call onDownload when download button is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (baseOperation) => {
          const onDownload = vi.fn();

          const successOp: ProcessingOperation = {
            ...baseOperation,
            status: 'success',
            progress: 100,
            startTime: Date.now() - 5000,
            endTime: Date.now(),
          };

          render(
            <ProcessingManager
              operations={[successOp]}
              onDownload={onDownload}
              showNotifications={true}
            />
          );

          // Wait for notification
          await waitFor(() => {
            const notification = screen.queryByTestId('notification-success');
            expect(notification).toBeTruthy();
          });

          // Click download button
          const downloadButton = screen.getByTestId('download-button');
          await userEvent.click(downloadButton);

          // Verify onDownload was called with correct operation ID
          expect(onDownload).toHaveBeenCalledWith(baseOperation.id);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display notification when showNotifications is false', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          status: fc.constant('success' as const),
          progress: fc.constant(100),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          startTime: fc.integer({ min: Date.now() - 60000, max: Date.now() - 1000 }),
          endTime: fc.integer({ min: Date.now() - 1000, max: Date.now() }),
        }),
        (operation: ProcessingOperation) => {
          render(
            <ProcessingManager
              operations={[operation]}
              showNotifications={false}
            />
          );

          // Verify no notifications container
          const notificationsContainer = screen.queryByTestId('notifications-container');
          expect(notificationsContainer).toBeFalsy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: pdf-tool-improvements, Property 12: Error Message Display
 * For any failed processing operation, the PDF_Tool should display 
 * a descriptive error message with suggested recovery actions.
 * Validates: Requirements 3.4
 */
describe('Property 12: Error Message Display', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display error notification for any failed operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress', 'rotate', 'watermark'),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          error: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async (baseOperation) => {
          const onRetry = vi.fn();

          // Start with processing status
          const processingOp: ProcessingOperation = {
            ...baseOperation,
            status: 'processing',
            progress: 50,
            startTime: Date.now(),
          };

          const { rerender } = render(
            <ProcessingManager
              operations={[processingOp]}
              onRetry={onRetry}
              showNotifications={true}
            />
          );

          // Verify no notification yet
          let notificationsContainer = screen.queryByTestId('notifications-container');
          expect(notificationsContainer).toBeFalsy();

          // Update to error status
          const errorOp: ProcessingOperation = {
            ...processingOp,
            status: 'error',
            progress: 50,
            endTime: Date.now(),
            error: baseOperation.error,
          };

          rerender(
            <ProcessingManager
              operations={[errorOp]}
              onRetry={onRetry}
              showNotifications={true}
            />
          );

          // Wait for notification to appear
          await waitFor(() => {
            notificationsContainer = screen.queryByTestId('notifications-container');
            expect(notificationsContainer).toBeTruthy();
          });

          // Verify error notification is displayed
          const errorNotification = screen.getByTestId('notification-error');
          expect(errorNotification).toBeTruthy();
          expect(errorNotification.textContent).toContain('Error');
          expect(errorNotification.textContent).toContain(baseOperation.fileName);
          expect(errorNotification.textContent).toContain(baseOperation.error);

          // Verify retry button is present
          const retryButton = screen.getByTestId('retry-button');
          expect(retryButton).toBeTruthy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should call onRetry when retry button is clicked', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          error: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        async (baseOperation) => {
          const onRetry = vi.fn();

          const errorOp: ProcessingOperation = {
            ...baseOperation,
            status: 'error',
            progress: 50,
            startTime: Date.now() - 5000,
            endTime: Date.now(),
            error: baseOperation.error,
          };

          render(
            <ProcessingManager
              operations={[errorOp]}
              onRetry={onRetry}
              showNotifications={true}
            />
          );

          // Wait for notification
          await waitFor(() => {
            const notification = screen.queryByTestId('notification-error');
            expect(notification).toBeTruthy();
          });

          // Click retry button
          const retryButton = screen.getByTestId('retry-button');
          await userEvent.click(retryButton);

          // Verify onRetry was called with correct operation ID
          expect(onRetry).toHaveBeenCalledWith(baseOperation.id);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display error message in completed operations section', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          status: fc.constant('error' as const),
          progress: fc.integer({ min: 0, max: 99 }),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          startTime: fc.integer({ min: Date.now() - 60000, max: Date.now() - 1000 }),
          endTime: fc.integer({ min: Date.now() - 1000, max: Date.now() }),
          error: fc.string({ minLength: 10, maxLength: 100 }),
        }),
        (operation: ProcessingOperation) => {
          render(
            <ProcessingManager
              operations={[operation]}
              showNotifications={false}
            />
          );

          // Verify completed operations section exists
          const completedOps = screen.getByTestId('completed-operations');
          expect(completedOps).toBeTruthy();

          // Verify error operation is displayed
          const completedOp = screen.getByTestId(`completed-operation-${operation.id}`);
          expect(completedOp).toBeTruthy();
          expect(completedOp.textContent).toContain(operation.fileName);
          expect(completedOp.textContent).toContain(operation.error);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display default error message when error is undefined', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async (baseOperation) => {
          const errorOp: ProcessingOperation = {
            ...baseOperation,
            status: 'error',
            progress: 50,
            startTime: Date.now() - 5000,
            endTime: Date.now(),
            // error is undefined
          };

          render(
            <ProcessingManager
              operations={[errorOp]}
              showNotifications={true}
            />
          );

          // Wait for notification
          await waitFor(() => {
            const notification = screen.queryByTestId('notification-error');
            expect(notification).toBeTruthy();
          });

          // Verify default error message is displayed
          const errorNotification = screen.getByTestId('notification-error');
          expect(errorNotification.textContent).toContain('An error occurred during processing');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: pdf-tool-improvements, Property 13: Batch Progress Tracking
 * For any batch operation processing multiple files, the PDF_Tool should 
 * display individual progress for each file being processed.
 * Validates: Requirements 3.5
 */
describe('Property 13: Batch Progress Tracking', () => {
  afterEach(() => {
    cleanup();
  });

  it('should display individual progress for each file in batch operation', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('merge', 'split', 'compress', 'rotate', 'watermark'),
            status: fc.constantFrom('pending', 'processing'),
            progress: fc.integer({ min: 0, max: 100 }),
            fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            fileId: fc.string({ minLength: 1, maxLength: 20 }),
            startTime: fc.integer({ min: Date.now() - 60000, max: Date.now() }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (operations: ProcessingOperation[]) => {
          render(
            <ProcessingManager
              operations={operations}
              showNotifications={false}
            />
          );

          // Verify active operations section exists
          const activeOps = screen.getByTestId('active-operations');
          expect(activeOps).toBeTruthy();

          // Verify each operation is displayed with its own progress
          operations.forEach(operation => {
            const operationElement = screen.getByTestId(`operation-${operation.id}`);
            expect(operationElement).toBeTruthy();

            // Verify filename is displayed
            const filenameElements = screen.getAllByTestId('operation-filename');
            const hasFilename = filenameElements.some(el => el.textContent === operation.fileName);
            expect(hasFilename).toBe(true);

            // Verify progress bar exists for this operation
            const progressBars = screen.getAllByTestId('progress-bar');
            expect(progressBars.length).toBeGreaterThanOrEqual(operations.length);
          });

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should display batch summary when processing multiple files', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('merge', 'split', 'compress'),
            status: fc.constantFrom('pending', 'processing', 'success', 'error'),
            progress: fc.integer({ min: 0, max: 100 }),
            fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            fileId: fc.string({ minLength: 1, maxLength: 20 }),
            startTime: fc.integer({ min: Date.now() - 60000, max: Date.now() }),
          }),
          { minLength: 2, maxLength: 10 }
        ),
        (operations: ProcessingOperation[]) => {
          render(
            <ProcessingManager
              operations={operations}
              showNotifications={false}
            />
          );

          // Verify batch summary is displayed
          const batchSummary = screen.getByTestId('batch-summary');
          expect(batchSummary).toBeTruthy();

          // Count operations by status
          const processingCount = operations.filter(op => op.status === 'pending' || op.status === 'processing').length;
          const successCount = operations.filter(op => op.status === 'success').length;
          const errorCount = operations.filter(op => op.status === 'error').length;

          // Verify counts are displayed correctly
          const processingCountElement = screen.getByTestId('batch-processing-count');
          expect(processingCountElement.textContent).toBe(processingCount.toString());

          const successCountElement = screen.getByTestId('batch-success-count');
          expect(successCountElement.textContent).toBe(successCount.toString());

          const errorCountElement = screen.getByTestId('batch-error-count');
          expect(errorCountElement.textContent).toBe(errorCount.toString());

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not display batch summary for single file operation', () => {
    fc.assert(
      fc.property(
        fc.record({
          id: fc.string({ minLength: 1, maxLength: 20 }),
          type: fc.constantFrom('merge', 'split', 'compress'),
          status: fc.constantFrom('pending', 'processing'),
          progress: fc.integer({ min: 0, max: 100 }),
          fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          startTime: fc.integer({ min: Date.now() - 60000, max: Date.now() }),
        }),
        (operation: ProcessingOperation) => {
          render(
            <ProcessingManager
              operations={[operation]}
              showNotifications={false}
            />
          );

          // Verify batch summary is NOT displayed for single operation
          const batchSummary = screen.queryByTestId('batch-summary');
          expect(batchSummary).toBeFalsy();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should update batch progress as operations complete', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            type: fc.constantFrom('merge', 'split', 'compress'),
            fileName: fc.string({ minLength: 1, maxLength: 30 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            fileId: fc.string({ minLength: 1, maxLength: 20 }),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        async (baseOperations) => {
          // Start with all operations processing
          const processingOps: ProcessingOperation[] = baseOperations.map(op => ({
            ...op,
            status: 'processing' as const,
            progress: 50,
            startTime: Date.now(),
          }));

          const { rerender } = render(
            <ProcessingManager
              operations={processingOps}
              showNotifications={false}
            />
          );

          // Verify initial batch summary
          let batchSummary = screen.getByTestId('batch-summary');
          expect(batchSummary).toBeTruthy();

          let processingCountElement = screen.getByTestId('batch-processing-count');
          expect(processingCountElement.textContent).toBe(baseOperations.length.toString());

          // Complete first operation
          const updatedOps: ProcessingOperation[] = processingOps.map((op, index) => 
            index === 0 
              ? { ...op, status: 'success' as const, progress: 100, endTime: Date.now() }
              : op
          );

          rerender(
            <ProcessingManager
              operations={updatedOps}
              showNotifications={false}
            />
          );

          // Wait for UI to update
          await waitFor(() => {
            processingCountElement = screen.getByTestId('batch-processing-count');
            expect(processingCountElement.textContent).toBe((baseOperations.length - 1).toString());
          });

          const successCountElement = screen.getByTestId('batch-success-count');
          expect(successCountElement.textContent).toBe('1');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
