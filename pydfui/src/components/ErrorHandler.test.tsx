import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, cleanup, waitFor, renderHook, act } from '@testing-library/react`;
import fc from 'fast-check';
import ErrorHandler, {
  useRetry,
  useErrorHandler,
  ErrorContext,
  RetryConfig,
} from './ErrorHandler';
import React from 'react';

/**
 * Feature: pdf-tool-improvements, Property 32: Automatic Retry with Backoff
 * For any network error during a request, the Frontend_UI should automatically 
 * retry up to 3 times with exponential backoff (1s, 2s, 4s).
 * Validates: Requirements 16.1, 16.2
 */
describe('Property 32: Automatic Retry with Backoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  it('should retry up to 3 times with exponential backoff for any failing operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('upload', 'download', 'process', 'convert'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          errorMessage: fc.string({ minLength: 5, maxLength: 50 }),
          failureCount: fc.integer({ min: 1, max: 4 }), // How many times it should fail before succeeding
        }),
        async ({ operation, fileId, errorMessage, failureCount }) => {
          const retryConfig: RetryConfig = {
            maxRetries: 3,
            backoffDelays: [1000, 2000, 4000],
          };

          const context: ErrorContext = {
            operation,
            fileId,
            timestamp: Date.now(),
          };

          let attemptCount = 0;
          const mockOperation = vi.fn(async () => {
            attemptCount++;
            if (attemptCount < failureCount) {
              throw new Error(errorMessage);
            }
            return { success: true, data: 'result' };
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ErrorHandler enableAutoRetry={true} retryConfig={retryConfig}>
              {children}
            </ErrorHandler>
          );

          const { result } = renderHook(() => useRetry(), { wrapper });

          // Start the retry operation
          const retryPromise = result.current.retry(
            mockOperation,
            context,
            undefined,
            undefined
          );

          // Fast-forward through all the backoff delays
          for (let i = 0; i < Math.min(failureCount - 1, 3); i++) {
            await act(async () => {
              await vi.advanceTimersByTimeAsync(retryConfig.backoffDelays[i]);
            });
          }

          const finalResult = await retryPromise;

          // Verify retry behavior
          if (failureCount <= 4) {
            // Should succeed within max retries
            expect(finalResult).toEqual({ success: true, data: 'result' });
            expect(attemptCount).toBe(failureCount);
          } else {
            // Should fail after max retries
            expect(finalResult).toBeNull();
            expect(attemptCount).toBe(4); // Initial attempt + 3 retries
          }

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should use exponential backoff delays (1s, 2s, 4s) for retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('merge', 'split', 'compress'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ operation, fileId }) => {
          const retryConfig: RetryConfig = {
            maxRetries: 3,
            backoffDelays: [1000, 2000, 4000],
          };

          const context: ErrorContext = {
            operation,
            fileId,
            timestamp: Date.now(),
          };

          const attemptTimestamps: number[] = [];
          const mockOperation = vi.fn(async () => {
            attemptTimestamps.push(Date.now());
            throw new Error('Network error');
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ErrorHandler enableAutoRetry={true} retryConfig={retryConfig}>
              {children}
            </ErrorHandler>
          );

          const { result } = renderHook(() => useRetry(), { wrapper });

          // Start the retry operation
          const retryPromise = result.current.retry(
            mockOperation,
            context,
            undefined,
            undefined
          );

          // Advance through each backoff delay
          await act(async () => {
            await vi.advanceTimersByTimeAsync(1000); // First retry after 1s
          });

          await act(async () => {
            await vi.advanceTimersByTimeAsync(2000); // Second retry after 2s
          });

          await act(async () => {
            await vi.advanceTimersByTimeAsync(4000); // Third retry after 4s
          });

          await retryPromise;

          // Verify the operation was called 4 times (initial + 3 retries)
          expect(mockOperation).toHaveBeenCalledTimes(4);

          // Verify the delays between attempts
          if (attemptTimestamps.length === 4) {
            const delay1 = attemptTimestamps[1] - attemptTimestamps[0];
            const delay2 = attemptTimestamps[2] - attemptTimestamps[1];
            const delay3 = attemptTimestamps[3] - attemptTimestamps[2];

            // Allow some tolerance for timing
            expect(delay1).toBeGreaterThanOrEqual(1000);
            expect(delay1).toBeLessThanOrEqual(1100);

            expect(delay2).toBeGreaterThanOrEqual(2000);
            expect(delay2).toBeLessThanOrEqual(2100);

            expect(delay3).toBeGreaterThanOrEqual(4000);
            expect(delay3).toBeLessThanOrEqual(4100);
          }

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should stop retrying after max retries and return null', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('upload', 'process', 'convert'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          errorMessage: fc.string({ minLength: 5, maxLength: 50 }),
        }),
        async ({ operation, fileId, errorMessage }) => {
          const retryConfig: RetryConfig = {
            maxRetries: 3,
            backoffDelays: [1000, 2000, 4000],
          };

          const context: ErrorContext = {
            operation,
            fileId,
            timestamp: Date.now(),
          };

          // Operation that always fails
          const mockOperation = vi.fn(async () => {
            throw new Error(errorMessage);
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ErrorHandler enableAutoRetry={true} retryConfig={retryConfig}>
              {children}
            </ErrorHandler>
          );

          const { result } = renderHook(() => useRetry(), { wrapper });

          const retryPromise = result.current.retry(
            mockOperation,
            context,
            undefined,
            undefined
          );

          // Fast-forward through all retries
          await act(async () => {
            await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000);
          });

          const finalResult = await retryPromise;

          // Should return null after all retries fail
          expect(finalResult).toBeNull();

          // Should have attempted 4 times (initial + 3 retries)
          expect(mockOperation).toHaveBeenCalledTimes(4);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should succeed immediately if operation succeeds on first attempt', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('upload', 'download', 'process'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          resultData: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async ({ operation, fileId, resultData }) => {
          const retryConfig: RetryConfig = {
            maxRetries: 3,
            backoffDelays: [1000, 2000, 4000],
          };

          const context: ErrorContext = {
            operation,
            fileId,
            timestamp: Date.now(),
          };

          const mockOperation = vi.fn(async () => {
            return { success: true, data: resultData };
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ErrorHandler enableAutoRetry={true} retryConfig={retryConfig}>
              {children}
            </ErrorHandler>
          );

          const { result } = renderHook(() => useRetry(), { wrapper });

          const finalResult = await result.current.retry(
            mockOperation,
            context,
            undefined,
            undefined
          );

          // Should succeed immediately
          expect(finalResult).toEqual({ success: true, data: resultData });

          // Should only be called once
          expect(mockOperation).toHaveBeenCalledTimes(1);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: pdf-tool-improvements, Property 33: Manual Retry Option
 * For any request that fails after all automatic retries, the Frontend_UI 
 * should display an error with a manual retry button.
 * Validates: Requirements 16.3
 */
describe('Property 33: Manual Retry Option', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    cleanup();
  });

  it('should provide manual retry option for any failed operation', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('upload', 'download', 'process', 'convert'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          errorMessage: fc.string({ minLength: 5, maxLength: 50 }),
          shouldSucceedOnManualRetry: fc.boolean(),
        }),
        async ({ operation, fileId, errorMessage, shouldSucceedOnManualRetry }) => {
          const retryConfig: RetryConfig = {
            maxRetries: 3,
            backoffDelays: [1000, 2000, 4000],
          };

          const context: ErrorContext = {
            operation,
            fileId,
            timestamp: Date.now(),
          };

          let manualRetryAttempted = false;
          const mockOperation = vi.fn(async () => {
            if (!manualRetryAttempted) {
              throw new Error(errorMessage);
            }
            if (shouldSucceedOnManualRetry) {
              return { success: true, data: 'manual retry success' };
            }
            throw new Error(errorMessage);
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ErrorHandler enableAutoRetry={true} retryConfig={retryConfig}>
              {children}
            </ErrorHandler>
          );

          const { result } = renderHook(() => useRetry(), { wrapper });

          // First, let automatic retries fail
          const autoRetryPromise = result.current.retry(
            mockOperation,
            context,
            undefined,
            undefined
          );

          await act(async () => {
            await vi.advanceTimersByTimeAsync(1000 + 2000 + 4000);
          });

          const autoRetryResult = await autoRetryPromise;

          // Automatic retries should fail
          expect(autoRetryResult).toBeNull();
          expect(mockOperation).toHaveBeenCalledTimes(4);

          // Now attempt manual retry
          manualRetryAttempted = true;
          const manualRetryResult = await act(async () => {
            return await result.current.manualRetry(mockOperation, context);
          });

          if (shouldSucceedOnManualRetry) {
            expect(manualRetryResult).toEqual({ success: true, data: 'manual retry success' });
          } else {
            expect(manualRetryResult).toBeNull();
          }

          // Manual retry should have been attempted
          expect(mockOperation).toHaveBeenCalledTimes(5);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should allow manual retry without automatic retry delays', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('merge', 'split', 'compress'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
          resultData: fc.string({ minLength: 1, maxLength: 50 }),
        }),
        async ({ operation, fileId, resultData }) => {
          const retryConfig: RetryConfig = {
            maxRetries: 3,
            backoffDelays: [1000, 2000, 4000],
          };

          const context: ErrorContext = {
            operation,
            fileId,
            timestamp: Date.now(),
          };

          const mockOperation = vi.fn(async () => {
            return { success: true, data: resultData };
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ErrorHandler enableAutoRetry={true} retryConfig={retryConfig}>
              {children}
            </ErrorHandler>
          );

          const { result } = renderHook(() => useRetry(), { wrapper });

          const startTime = Date.now();

          // Manual retry should execute immediately
          const manualRetryResult = await act(async () => {
            return await result.current.manualRetry(mockOperation, context);
          });

          const endTime = Date.now();
          const duration = endTime - startTime;

          // Should succeed
          expect(manualRetryResult).toEqual({ success: true, data: resultData });

          // Should execute immediately without backoff delays
          // Allow some tolerance for execution time
          expect(duration).toBeLessThan(500);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should track retry state correctly for manual retries', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          operation: fc.constantFrom('upload', 'process'),
          fileId: fc.string({ minLength: 1, maxLength: 20 }),
        }),
        async ({ operation, fileId }) => {
          const retryConfig: RetryConfig = {
            maxRetries: 3,
            backoffDelays: [1000, 2000, 4000],
          };

          const context: ErrorContext = {
            operation,
            fileId,
            timestamp: Date.now(),
          };

          const mockOperation = vi.fn(async () => {
            return { success: true };
          });

          const wrapper = ({ children }: { children: React.ReactNode }) => (
            <ErrorHandler enableAutoRetry={true} retryConfig={retryConfig}>
              {children}
            </ErrorHandler>
          );

          const { result } = renderHook(() => useRetry(), { wrapper });

          // Check initial state
          expect(result.current.retryState.isRetrying).toBe(false);
          expect(result.current.retryState.retryCount).toBe(0);
          expect(result.current.retryState.lastError).toBeNull();

          // Perform manual retry
          await act(async () => {
            await result.current.manualRetry(mockOperation, context);
          });

          // After successful manual retry, state should be reset
          expect(result.current.retryState.isRetrying).toBe(false);
          expect(result.current.retryState.retryCount).toBe(0);
          expect(result.current.retryState.lastError).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
