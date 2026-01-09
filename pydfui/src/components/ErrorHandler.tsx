import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'react-toastify';

export interface ErrorContext {
  operation: string;
  fileId?: string;
  userId?: string;
  timestamp: number;
}

export interface RetryConfig {
  maxRetries: number;
  backoffDelays: number[]; // in milliseconds
}

export interface ErrorHandlerProps {
  children: React.ReactNode;
  onError?: (error: Error, context: ErrorContext) => void;
  enableAutoRetry?: boolean;
  retryConfig?: RetryConfig;
}

export interface ErrorState {
  error: Error | null;
  context: ErrorContext | null;
  retryCount: number;
  isRetrying: boolean;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  backoffDelays: [1000, 2000, 4000], // 1s, 2s, 4s
};

/**
 * ErrorHandler component provides consistent error handling and recovery
 * across the application with automatic retry and exponential backoff.
 */
const ErrorHandler: React.FC<ErrorHandlerProps> = ({
  children,
  onError,
  enableAutoRetry = true,
  retryConfig = DEFAULT_RETRY_CONFIG,
}) => {
  const [errorState, setErrorState] = useState<ErrorState>({
    error: null,
    context: null,
    retryCount: 0,
    isRetrying: false,
  });

  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const logError = useCallback((error: Error, context: ErrorContext) => {
    console.error('[ErrorHandler]', {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const handleError = useCallback(
    (error: Error, context: ErrorContext) => {
      logError(error, context);
      setErrorState({
        error,
        context,
        retryCount: 0,
        isRetrying: false,
      });
      onError?.(error, context);
    },
    [logError, onError]
  );

  const clearError = useCallback(() => {
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    setErrorState({
      error: null,
      context: null,
      retryCount: 0,
      isRetrying: false,
    });
  }, []);

  return (
    <ErrorHandlerContext.Provider
      value={{
        errorState,
        handleError,
        clearError,
        retryConfig,
        enableAutoRetry,
      }}
    >
      {children}
    </ErrorHandlerContext.Provider>
  );
};

export interface ErrorHandlerContextValue {
  errorState: ErrorState;
  handleError: (error: Error, context: ErrorContext) => void;
  clearError: () => void;
  retryConfig: RetryConfig;
  enableAutoRetry: boolean;
}

export const ErrorHandlerContext = React.createContext<ErrorHandlerContextValue | null>(null);

export const useErrorHandler = () => {
  const context = React.useContext(ErrorHandlerContext);
  if (!context) {
    throw new Error('useErrorHandler must be used within an ErrorHandler');
  }
  return context;
};

/**
 * Hook for retrying operations with exponential backoff
 */
export const useRetry = () => {
  const { retryConfig, enableAutoRetry } = useErrorHandler();
  const [retryState, setRetryState] = useState({
    isRetrying: false,
    retryCount: 0,
    lastError: null as Error | null,
  });

  const retry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      context: ErrorContext,
      onSuccess?: (result: T) => void,
      onFailure?: (error: Error) => void
    ): Promise<T | null> => {
      const maxRetries = retryConfig.maxRetries;
      let lastError: Error | null = null;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          setRetryState({
            isRetrying: attempt > 0,
            retryCount: attempt,
            lastError: null,
          });

          const result = await operation();
          
          setRetryState({
            isRetrying: false,
            retryCount: 0,
            lastError: null,
          });

          onSuccess?.(result);
          return result;
        } catch (error) {
          lastError = error as Error;
          
          console.error(`[Retry] Attempt ${attempt + 1}/${maxRetries + 1} failed:`, {
            error: lastError.message,
            context,
          });

          // If this is not the last attempt and auto-retry is enabled, wait before retrying
          if (attempt < maxRetries && enableAutoRetry) {
            const delay = retryConfig.backoffDelays[attempt] || retryConfig.backoffDelays[retryConfig.backoffDelays.length - 1];
            
            toast.info(`Retrying in ${delay / 1000}s... (Attempt ${attempt + 1}/${maxRetries})`, {
              autoClose: delay,
            });

            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }

      // All retries failed
      setRetryState({
        isRetrying: false,
        retryCount: maxRetries,
        lastError,
      });

      if (lastError) {
        onFailure?.(lastError);
      }

      return null;
    },
    [retryConfig, enableAutoRetry]
  );

  const manualRetry = useCallback(
    async <T,>(
      operation: () => Promise<T>,
      context: ErrorContext
    ): Promise<T | null> => {
      try {
        setRetryState({
          isRetrying: true,
          retryCount: 0,
          lastError: null,
        });

        const result = await operation();
        
        setRetryState({
          isRetrying: false,
          retryCount: 0,
          lastError: null,
        });

        toast.success('Operation succeeded!');
        return result;
      } catch (error) {
        const err = error as Error;
        setRetryState({
          isRetrying: false,
          retryCount: 0,
          lastError: err,
        });

        toast.error(`Operation failed: ${err.message}`);
        return null;
      }
    },
    []
  );

  return {
    retry,
    manualRetry,
    retryState,
  };
};

/**
 * Hook for resumable file uploads with chunking support
 */
export interface UploadChunk {
  chunkIndex: number;
  totalChunks: number;
  data: Blob;
  uploaded: boolean;
}

export interface ResumableUploadState {
  fileId: string;
  fileName: string;
  chunks: UploadChunk[];
  uploadedChunks: number;
  totalChunks: number;
  progress: number;
  status: 'idle' | 'uploading' | 'paused' | 'completed' | 'error';
  error: Error | null;
}

export const useResumableUpload = (chunkSize: number = 1024 * 1024) => {
  const [uploadState, setUploadState] = useState<ResumableUploadState | null>(null);
  const { retry } = useRetry();

  const createChunks = useCallback(
    (file: File): UploadChunk[] => {
      const chunks: UploadChunk[] = [];
      const totalChunks = Math.ceil(file.size / chunkSize);

      for (let i = 0; i < totalChunks; i++) {
        const start = i * chunkSize;
        const end = Math.min(start + chunkSize, file.size);
        const chunk = file.slice(start, end);

        chunks.push({
          chunkIndex: i,
          totalChunks,
          data: chunk,
          uploaded: false,
        });
      }

      return chunks;
    },
    [chunkSize]
  );

  const uploadChunk = useCallback(
    async (
      chunk: UploadChunk,
      uploadUrl: string,
      fileId: string
    ): Promise<void> => {
      const formData = new FormData();
      formData.append('chunk', chunk.data);
      formData.append('chunkIndex', chunk.chunkIndex.toString());
      formData.append('totalChunks', chunk.totalChunks.toString());
      formData.append('fileId', fileId);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Failed to upload chunk ${chunk.chunkIndex}`);
      }
    },
    []
  );

  const startUpload = useCallback(
    async (
      file: File,
      uploadUrl: string,
      onProgress?: (progress: number) => void
    ): Promise<boolean> => {
      const fileId = `${file.name}-${Date.now()}`;
      const chunks = createChunks(file);

      setUploadState({
        fileId,
        fileName: file.name,
        chunks,
        uploadedChunks: 0,
        totalChunks: chunks.length,
        progress: 0,
        status: 'uploading',
        error: null,
      });

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        if (chunk.uploaded) {
          continue; // Skip already uploaded chunks
        }

        const result = await retry(
          () => uploadChunk(chunk, uploadUrl, fileId),
          {
            operation: 'chunk-upload',
            fileId,
            timestamp: Date.now(),
          }
        );

        if (result === null) {
          // Upload failed after retries
          setUploadState(prev =>
            prev
              ? {
                  ...prev,
                  status: 'error',
                  error: new Error(`Failed to upload chunk ${i}`),
                }
              : null
          );
          return false;
        }

        // Mark chunk as uploaded
        chunks[i].uploaded = true;
        const uploadedChunks = i + 1;
        const progress = Math.round((uploadedChunks / chunks.length) * 100);

        setUploadState(prev =>
          prev
            ? {
                ...prev,
                uploadedChunks,
                progress,
                chunks: [...chunks],
              }
            : null
        );

        onProgress?.(progress);
      }

      setUploadState(prev =>
        prev
          ? {
              ...prev,
              status: 'completed',
              progress: 100,
            }
          : null
      );

      return true;
    },
    [createChunks, uploadChunk, retry]
  );

  const pauseUpload = useCallback(() => {
    setUploadState(prev =>
      prev && prev.status === 'uploading'
        ? { ...prev, status: 'paused' }
        : prev
    );
  }, []);

  const resumeUpload = useCallback(
    async (uploadUrl: string, onProgress?: (progress: number) => void): Promise<boolean> => {
      if (!uploadState || uploadState.status !== 'paused') {
        return false;
      }

      setUploadState(prev => (prev ? { ...prev, status: 'uploading' } : null));

      const { chunks, fileId } = uploadState;

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];

        if (chunk.uploaded) {
          continue;
        }

        const result = await retry(
          () => uploadChunk(chunk, uploadUrl, fileId),
          {
            operation: 'chunk-upload-resume',
            fileId,
            timestamp: Date.now(),
          }
        );

        if (result === null) {
          setUploadState(prev =>
            prev
              ? {
                  ...prev,
                  status: 'error',
                  error: new Error(`Failed to upload chunk ${i}`),
                }
              : null
          );
          return false;
        }

        chunks[i].uploaded = true;
        const uploadedChunks = i + 1;
        const progress = Math.round((uploadedChunks / chunks.length) * 100);

        setUploadState(prev =>
          prev
            ? {
                ...prev,
                uploadedChunks,
                progress,
                chunks: [...chunks],
              }
            : null
        );

        onProgress?.(progress);
      }

      setUploadState(prev =>
        prev
          ? {
              ...prev,
              status: 'completed',
              progress: 100,
            }
          : null
      );

      return true;
    },
    [uploadState, uploadChunk, retry]
  );

  return {
    uploadState,
    startUpload,
    pauseUpload,
    resumeUpload,
  };
};

export default ErrorHandler;
