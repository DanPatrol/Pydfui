# ErrorHandler Component

The ErrorHandler component provides comprehensive error handling and retry logic for the PDF Tool Platform, implementing automatic retry with exponential backoff and resumable file uploads.

## Features

- **Automatic Retry with Exponential Backoff**: Automatically retries failed operations up to 3 times with delays of 1s, 2s, and 4s
- **Manual Retry Option**: Provides manual retry capability after automatic retries fail
- **Error Logging**: Logs all errors with context for debugging
- **Resumable File Uploads**: Supports chunked uploads that can be paused and resumed
- **React Context Integration**: Easy integration with React components

## Usage

### Basic Setup

Wrap your application or component tree with the ErrorHandler provider:

```tsx
import ErrorHandler from './components/ErrorHandler';

function App() {
  return (
    <ErrorHandler
      enableAutoRetry={true}
      retryConfig={{
        maxRetries: 3,
        backoffDelays: [1000, 2000, 4000], // 1s, 2s, 4s
      }}
      onError={(error, context) => {
        console.error('Error occurred:', error, context);
      }}
    >
      <YourApp />
    </ErrorHandler>
  );
}
```

### Using the Retry Hook

The `useRetry` hook provides automatic retry functionality:

```tsx
import { useRetry } from './components/ErrorHandler';

function UploadComponent() {
  const { retry, retryState } = useRetry();

  const handleUpload = async (file: File) => {
    const result = await retry(
      async () => {
        // Your upload logic here
        const response = await uploadFile(file);
        return response;
      },
      {
        operation: 'file-upload',
        fileId: file.name,
        timestamp: Date.now(),
      },
      (result) => {
        // Success callback
        console.log('Upload succeeded:', result);
      },
      (error) => {
        // Failure callback (after all retries)
        console.error('Upload failed after retries:', error);
      }
    );

    if (result) {
      // Handle successful result
    } else {
      // Handle failure after all retries
    }
  };

  return (
    <div>
      {retryState.isRetrying && (
        <p>Retrying... (Attempt {retryState.retryCount})</p>
      )}
      <button onClick={() => handleUpload(selectedFile)}>
        Upload File
      </button>
    </div>
  );
}
```

### Manual Retry

Use the `manualRetry` function for user-initiated retries:

```tsx
import { useRetry } from './components/ErrorHandler';

function ProcessingComponent() {
  const { manualRetry, retryState } = useRetry();
  const [lastOperation, setLastOperation] = useState(null);

  const handleProcess = async () => {
    const operation = async () => {
      // Your processing logic
      return await processFile();
    };

    setLastOperation(() => operation);

    const result = await manualRetry(operation, {
      operation: 'file-processing',
      timestamp: Date.now(),
    });

    if (!result) {
      // Show manual retry button
    }
  };

  const handleManualRetry = async () => {
    if (lastOperation) {
      await manualRetry(lastOperation, {
        operation: 'file-processing-retry',
        timestamp: Date.now(),
      });
    }
  };

  return (
    <div>
      <button onClick={handleProcess}>Process File</button>
      {retryState.lastError && (
        <div>
          <p>Error: {retryState.lastError.message}</p>
          <button onClick={handleManualRetry}>Retry</button>
        </div>
      )}
    </div>
  );
}
```

### Resumable File Uploads

Use the `useResumableUpload` hook for large file uploads with resume capability:

```tsx
import { useResumableUpload } from './components/ErrorHandler';

function LargeFileUpload() {
  const { uploadState, startUpload, pauseUpload, resumeUpload } = useResumableUpload(
    1024 * 1024 // 1MB chunk size
  );

  const handleUpload = async (file: File) => {
    const success = await startUpload(
      file,
      '/api/upload',
      (progress) => {
        console.log(`Upload progress: ${progress}%`);
      }
    );

    if (success) {
      console.log('Upload completed!');
    } else {
      console.error('Upload failed');
    }
  };

  const handlePause = () => {
    pauseUpload();
  };

  const handleResume = async () => {
    const success = await resumeUpload(
      '/api/upload',
      (progress) => {
        console.log(`Resume progress: ${progress}%`);
      }
    );
  };

  return (
    <div>
      <input type="file" onChange={(e) => handleUpload(e.target.files[0])} />
      
      {uploadState && (
        <div>
          <p>Status: {uploadState.status}</p>
          <p>Progress: {uploadState.progress}%</p>
          <p>Uploaded: {uploadState.uploadedChunks}/{uploadState.totalChunks} chunks</p>
          
          {uploadState.status === 'uploading' && (
            <button onClick={handlePause}>Pause</button>
          )}
          
          {uploadState.status === 'paused' && (
            <button onClick={handleResume}>Resume</button>
          )}
          
          {uploadState.error && (
            <p>Error: {uploadState.error.message}</p>
          )}
        </div>
      )}
    </div>
  );
}
```

## Configuration

### RetryConfig

```typescript
interface RetryConfig {
  maxRetries: number;        // Maximum number of retry attempts (default: 3)
  backoffDelays: number[];   // Delay in ms for each retry (default: [1000, 2000, 4000])
}
```

### ErrorContext

```typescript
interface ErrorContext {
  operation: string;   // Name of the operation that failed
  fileId?: string;     // Optional file identifier
  userId?: string;     // Optional user identifier
  timestamp: number;   // Timestamp when error occurred
}
```

## Requirements Validation

This component validates the following requirements:

- **Requirement 16.1**: Automatic retry up to 3 times for network errors
- **Requirement 16.2**: Exponential backoff delays (1s, 2s, 4s)
- **Requirement 16.3**: Manual retry option after automatic retries fail
- **Requirement 16.4**: Error logging for debugging
- **Requirement 16.5**: Resumable file uploads

## Testing

The component includes comprehensive property-based tests using fast-check:

- **Property 32**: Automatic Retry with Backoff - validates retry behavior across random inputs
- **Property 33**: Manual Retry Option - validates manual retry functionality

Run tests with:

```bash
npm test -- ErrorHandler.test.tsx
```

## Notes

- The component uses React Context for state management
- Toast notifications are displayed for retry attempts and errors
- All errors are logged to the console with full context
- Resumable uploads use chunked upload strategy for reliability
- The component is fully typed with TypeScript for type safety
