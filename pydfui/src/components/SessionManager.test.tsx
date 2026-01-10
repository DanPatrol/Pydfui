import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, cleanup, waitFor } from '@testing-library/react`;
import fc from 'fast-check';
import { useSessionManager, SessionData, FileReference } from './SessionManager';

/**
 * Feature: pdf-tool-improvements, Property 30: Session Persistence
 * For any user session with uploaded files, navigating away and returning 
 * within 1 hour should restore the files and operation state.
 * Validates: Requirements 14.1, 14.2
 */
describe('Property 30: Session Persistence', () => {
  beforeEach(() => {
    // Clear sessionStorage before each test
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('should persist and restore session data for any valid session within expiration time', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            size: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }),
            type: fc.constant('application/pdf`),
            lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constantFrom('merge', 'split', 'compress', 'rotate', 'watermark', 'extract', 'organize', 'remove'),
        fc.record({
          quality: fc.option(fc.integer({ min: 1, max: 100 })),
          dpi: fc.option(fc.integer({ min: 72, max: 300 })),
          pages: fc.option(fc.array(fc.integer({ min: 1, max: 100 }), { maxLength: 10 })),
        }),
        (files: FileReference[], operation: string, options: Record<string, any>) => {
          const sessionKey = `test-session-${Math.random()}`;
          const onSessionRestored = vi.fn();

          // First render: save session
          const { result: result1 } = renderHook(() =>
            useSessionManager({
              sessionKey,
              onSessionRestored,
            })
          );

          const sessionData: SessionData = {
            files,
            operation,
            options,
            timestamp: Date.now(),
          };

          act(() => {
            result1.current.saveSession(sessionData);
          });

          // Verify data was saved to sessionStorage
          const storedData = sessionStorage.getItem(sessionKey);
          expect(storedData).toBeTruthy();

          const parsedData = JSON.parse(storedData!);
          expect(parsedData.files).toEqual(files);
          expect(parsedData.operation).toBe(operation);
          expect(parsedData.options).toEqual(options);
          expect(parsedData.timestamp).toBeGreaterThan(0);

          cleanup();

          // Second render: restore session (simulating page reload)
          const { result: result2 } = renderHook(() =>
            useSessionManager({
              sessionKey,
              onSessionRestored,
            })
          );

          // Wait for session restoration
          waitFor(() => {
            expect(onSessionRestored).toHaveBeenCalled();
          });

          // Manually restore to verify
          const restoredData = result2.current.restoreSession();
          expect(restoredData).toBeTruthy();
          expect(restoredData!.files).toEqual(files);
          expect(restoredData!.operation).toBe(operation);
          expect(restoredData!.options).toEqual(options);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore session with all file properties intact', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            size: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }),
            type: fc.constant('application/pdf`),
            lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (files: FileReference[]) => {
          const sessionKey = `test-session-${Math.random()}`;

          const { result } = renderHook(() =>
            useSessionManager({ sessionKey })
          );

          const sessionData: SessionData = {
            files,
            operation: 'merge',
            options: {},
            timestamp: Date.now(),
          };

          act(() => {
            result.current.saveSession(sessionData);
          });

          const restoredData = result.current.restoreSession();
          expect(restoredData).toBeTruthy();

          // Verify each file property is preserved
          restoredData!.files.forEach((restoredFile, index) => {
            const originalFile = files[index];
            expect(restoredFile.id).toBe(originalFile.id);
            expect(restoredFile.name).toBe(originalFile.name);
            expect(restoredFile.size).toBe(originalFile.size);
            expect(restoredFile.type).toBe(originalFile.type);
            expect(restoredFile.lastModified).toBe(originalFile.lastModified);
          });

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore operation state correctly', () => {
    fc.assert(
      fc.property(
        fc.constantFrom('merge', 'split', 'compress', 'rotate', 'watermark', 'extract', 'organize', 'remove', 'ocr', 'edit', 'convert'),
        fc.record({
          compressionLevel: fc.option(fc.integer({ min: 1, max: 100 })),
          targetDPI: fc.option(fc.integer({ min: 72, max: 600 })),
          watermarkText: fc.option(fc.string({ minLength: 1, maxLength: 50 })),
          watermarkOpacity: fc.option(fc.float({ min: 0, max: 1 })),
          splitRanges: fc.option(fc.array(fc.tuple(fc.integer({ min: 1, max: 100 }), fc.integer({ min: 1, max: 100 })), { maxLength: 5 })),
        }),
        (operation: string, options: Record<string, any>) => {
          const sessionKey = `test-session-${Math.random()}`;

          const { result } = renderHook(() =>
            useSessionManager({ sessionKey })
          );

          const sessionData: SessionData = {
            files: [],
            operation,
            options,
            timestamp: Date.now(),
          };

          act(() => {
            result.current.saveSession(sessionData);
          });

          const restoredData = result.current.restoreSession();
          expect(restoredData).toBeTruthy();
          expect(restoredData!.operation).toBe(operation);
          expect(restoredData!.options).toEqual(options);

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should not restore session if expired (beyond 1 hour)', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            size: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }),
            type: fc.constant('application/pdf`),
            lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.constantFrom('merge', 'split', 'compress'),
        (files: FileReference[], operation: string) => {
          const sessionKey = `test-session-${Math.random()}`;
          const onSessionExpired = vi.fn();
          const expirationTime = 60 * 60 * 1000; // 1 hour

          const { result } = renderHook(() =>
            useSessionManager({
              sessionKey,
              expirationTime,
              onSessionExpired,
            })
          );

          // Create session data with timestamp older than 1 hour
          const expiredTimestamp = Date.now() - (expirationTime + 1000);
          const sessionData: SessionData = {
            files,
            operation,
            options: {},
            timestamp: expiredTimestamp,
          };

          // Manually save expired session to sessionStorage
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));

          // Try to restore
          const restoredData = result.current.restoreSession();

          // Should return null for expired session
          expect(restoredData).toBeNull();

          // Session should be cleared
          const storedData = sessionStorage.getItem(sessionKey);
          expect(storedData).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restore session if within expiration time', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            size: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }),
            type: fc.constant('application/pdf`),
            lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        fc.integer({ min: 1000, max: 3500000 }), // Random time within 1 hour
        (files: FileReference[], timeAgo: number) => {
          const sessionKey = `test-session-${Math.random()}`;
          const expirationTime = 60 * 60 * 1000; // 1 hour

          const { result } = renderHook(() =>
            useSessionManager({
              sessionKey,
              expirationTime,
            })
          );

          // Create session data with timestamp within expiration time
          const recentTimestamp = Date.now() - timeAgo;
          const sessionData: SessionData = {
            files,
            operation: 'merge',
            options: {},
            timestamp: recentTimestamp,
          };

          // Save session
          sessionStorage.setItem(sessionKey, JSON.stringify(sessionData));

          // Try to restore
          const restoredData = result.current.restoreSession();

          // Should successfully restore
          expect(restoredData).toBeTruthy();
          expect(restoredData!.files).toEqual(files);
          expect(restoredData!.operation).toBe('merge');

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle multiple save and restore cycles', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            files: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
                size: fc.integer({ min: 1024, max: 10 * 1024 * 1024 }),
                type: fc.constant('application/pdf`),
                lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
            operation: fc.constantFrom('merge', 'split', 'compress'),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (sessionUpdates) => {
          const sessionKey = `test-session-${Math.random()}`;

          const { result } = renderHook(() =>
            useSessionManager({ sessionKey })
          );

          // Perform multiple save operations
          sessionUpdates.forEach((update, index) => {
            const sessionData: SessionData = {
              files: update.files,
              operation: update.operation,
              options: { updateIndex: index },
              timestamp: Date.now(),
            };

            act(() => {
              result.current.saveSession(sessionData);
            });

            // Restore and verify
            const restoredData = result.current.restoreSession();
            expect(restoredData).toBeTruthy();
            expect(restoredData!.files).toEqual(update.files);
            expect(restoredData!.operation).toBe(update.operation);
            expect(restoredData!.options.updateIndex).toBe(index);
          });

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});

/**
 * Feature: pdf-tool-improvements, Property 31: Session Cleanup
 * For any completed processing operation, the session data for that 
 * operation should be cleared from storage.
 * Validates: Requirements 14.5
 */
describe('Property 31: Session Cleanup', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    sessionStorage.clear();
  });

  it('should clear session data after successful operation completion', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            size: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }),
            type: fc.constant('application/pdf`),
            lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          }),
          { minLength: 1, maxLength: 10 }
        ),
        fc.constantFrom('merge', 'split', 'compress', 'rotate', 'watermark'),
        (files: FileReference[], operation: string) => {
          const sessionKey = `test-session-${Math.random()}`;
          const onSessionCleared = vi.fn();

          const { result } = renderHook(() =>
            useSessionManager({
              sessionKey,
              onSessionCleared,
            })
          );

          // Save session data
          const sessionData: SessionData = {
            files,
            operation,
            options: {},
            timestamp: Date.now(),
          };

          act(() => {
            result.current.saveSession(sessionData);
          });

          // Verify data exists
          let storedData = sessionStorage.getItem(sessionKey);
          expect(storedData).toBeTruthy();

          // Clear session (simulating operation completion)
          act(() => {
            result.current.clearSession();
          });

          // Verify data is cleared
          storedData = sessionStorage.getItem(sessionKey);
          expect(storedData).toBeNull();

          // Verify callback was called
          expect(onSessionCleared).toHaveBeenCalled();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear session and prevent restoration after cleanup', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            id: fc.string({ minLength: 1, maxLength: 20 }),
            name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
            size: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }),
            type: fc.constant('application/pdf`),
            lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        (files: FileReference[]) => {
          const sessionKey = `test-session-${Math.random()}`;

          const { result } = renderHook(() =>
            useSessionManager({ sessionKey })
          );

          // Save session
          const sessionData: SessionData = {
            files,
            operation: 'merge',
            options: {},
            timestamp: Date.now(),
          };

          act(() => {
            result.current.saveSession(sessionData);
          });

          // Verify can restore before cleanup
          let restoredData = result.current.restoreSession();
          expect(restoredData).toBeTruthy();

          // Clear session
          act(() => {
            result.current.clearSession();
          });

          // Try to restore after cleanup
          restoredData = result.current.restoreSession();
          expect(restoredData).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should handle cleanup of empty sessions', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 1, maxLength: 20 }),
        (sessionKey: string) => {
          const onSessionCleared = vi.fn();

          const { result } = renderHook(() =>
            useSessionManager({
              sessionKey: `test-${sessionKey}`,
              onSessionCleared,
            })
          );

          // Try to clear non-existent session
          act(() => {
            result.current.clearSession();
          });

          // Should still call callback
          expect(onSessionCleared).toHaveBeenCalled();

          // Verify no data in storage
          const storedData = sessionStorage.getItem(`test-${sessionKey}`);
          expect(storedData).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should clear session immediately after operation success', () => {
    fc.assert(
      fc.property(
        fc.record({
          files: fc.array(
            fc.record({
              id: fc.string({ minLength: 1, maxLength: 20 }),
              name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
              size: fc.integer({ min: 1024, max: 100 * 1024 * 1024 }),
              type: fc.constant('application/pdf`),
              lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
            }),
            { minLength: 1, maxLength: 5 }
          ),
          operation: fc.constantFrom('merge', 'split', 'compress'),
        }),
        (sessionInfo) => {
          const sessionKey = `test-session-${Math.random()}`;

          const { result } = renderHook(() =>
            useSessionManager({ sessionKey })
          );

          // Save session
          const sessionData: SessionData = {
            files: sessionInfo.files,
            operation: sessionInfo.operation,
            options: {},
            timestamp: Date.now(),
          };

          act(() => {
            result.current.saveSession(sessionData);
          });

          // Verify session exists
          let storedData = sessionStorage.getItem(sessionKey);
          expect(storedData).toBeTruthy();

          // Simulate operation completion and immediate cleanup
          act(() => {
            result.current.clearSession();
          });

          // Verify immediate cleanup
          storedData = sessionStorage.getItem(sessionKey);
          expect(storedData).toBeNull();

          // Verify cannot restore after cleanup
          const restoredData = result.current.restoreSession();
          expect(restoredData).toBeNull();

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should support multiple independent sessions with different keys', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            sessionKey: fc.string({ minLength: 1, maxLength: 20 }),
            files: fc.array(
              fc.record({
                id: fc.string({ minLength: 1, maxLength: 20 }),
                name: fc.string({ minLength: 1, maxLength: 50 }).map(s => s.replace(/[^a-zA-Z0-9]/g, '_') + '.pdf'),
                size: fc.integer({ min: 1024, max: 10 * 1024 * 1024 }),
                type: fc.constant('application/pdf`),
                lastModified: fc.integer({ min: Date.now() - 86400000, max: Date.now() }),
              }),
              { minLength: 1, maxLength: 3 }
            ),
            operation: fc.constantFrom('merge', 'split', 'compress'),
          }),
          { minLength: 2, maxLength: 5 }
        ),
        (sessions) => {
          const hooks = sessions.map(session => {
            const { result } = renderHook(() =>
              useSessionManager({ sessionKey: `test-${session.sessionKey}` })
            );
            return { result, session };
          });

          // Save all sessions
          hooks.forEach(({ result, session }) => {
            const sessionData: SessionData = {
              files: session.files,
              operation: session.operation,
              options: {},
              timestamp: Date.now(),
            };

            act(() => {
              result.current.saveSession(sessionData);
            });
          });

          // Clear first session
          act(() => {
            hooks[0].result.current.clearSession();
          });

          // Verify first session is cleared
          const firstRestored = hooks[0].result.current.restoreSession();
          expect(firstRestored).toBeNull();

          // Verify other sessions still exist
          hooks.slice(1).forEach(({ result, session }) => {
            const restoredData = result.current.restoreSession();
            expect(restoredData).toBeTruthy();
            expect(restoredData!.files).toEqual(session.files);
            expect(restoredData!.operation).toBe(session.operation);
          });

          cleanup();
        }
      ),
      { numRuns: 100 }
    );
  });
});
