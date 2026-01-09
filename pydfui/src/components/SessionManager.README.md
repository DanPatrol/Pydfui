# SessionManager Component

## Overview

The SessionManager component provides session persistence functionality for the PDF Tool Platform. It allows users to save their work temporarily and restore it when they return to the application, preventing data loss from accidental navigation or page reloads.

## Features

- **Automatic Session Persistence**: Saves file references and operation state to sessionStorage
- **Session Restoration**: Automatically restores session data on page reload
- **Expiration Management**: Sessions expire after 1 hour of inactivity
- **Warning Before Clearing**: Prompts users before clearing session data
- **Automatic Cleanup**: Clears session data after successful operations
- **Multiple Session Support**: Supports multiple independent sessions with different keys

## Requirements Validated

- **Requirement 14.1**: Store file references in session storage
- **Requirement 14.2**: Restore previous session when navigating away and returning
- **Requirement 14.3**: Session expires after 1 hour
- **Requirement 14.4**: Display warning before clearing session data
- **Requirement 14.5**: Clear session data after successful operations

## Usage

### Basic Usage with Hook

```typescript
import { useSessionManager, SessionData } from './components/SessionManager';

function MyComponent() {
  const { saveSession, restoreSession, clearSession } = useSessionManager({
    sessionKey: 'my-app-session',
    expirationTime: 60 * 60 * 1000, // 1 hour
    onSessionRestored: (sessionData: SessionData) => {
      console.log('Session restored:', sessionData);
      // Restore your application state here
    },
    onSessionExpired: () => {
      console.log('Session expired');
      alert('Your session has expired. Please start over.');
    },
    onSessionCleared: () => {
      console.log('Session cleared');
    },
  });

  // Save session data
  const handleSave = () => {
    const sessionData: SessionData = {
      files: [
        {
          id: 'file-1',
          name: 'document.pdf',
          size: 1024000,
          type: 'application/pdf',
          lastModified: Date.now(),
        },
      ],
      operation: 'merge',
      options: { quality: 80 },
      timestamp: Date.now(),
    };
    saveSession(sessionData);
  };

  // Clear session (with warning)
  const handleClear = () => {
    clearSession(true); // true = show warning dialog
  };

  return (
    <div>
      <button onClick={handleSave}>Save Session</button>
      <button onClick={handleClear}>Clear Session</button>
    </div>
  );
}
```

### Using as a Component

```typescript
import SessionManager from './components/SessionManager';

function App() {
  return (
    <SessionManager
      sessionKey="pdf-tool-session"
      expirationTime={60 * 60 * 1000}
      onSessionRestored={(data) => {
        // Handle session restoration
      }}
      onSessionExpired={() => {
        // Handle session expiration
      }}
    >
      <YourAppComponents />
    </SessionManager>
  );
}
```

## API Reference

### `useSessionManager(props)`

Hook that provides session management functionality.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `sessionKey` | `string` | `'pdf-tool-session'` | Unique key for storing session data |
| `expirationTime` | `number` | `3600000` (1 hour) | Session expiration time in milliseconds |
| `onSessionRestored` | `(data: SessionData) => void` | `undefined` | Callback when session is restored |
| `onSessionExpired` | `() => void` | `undefined` | Callback when session expires |
| `onSessionCleared` | `() => void` | `undefined` | Callback when session is cleared |

#### Returns

| Method | Type | Description |
|--------|------|-------------|
| `saveSession` | `(data: SessionData) => void` | Saves session data to sessionStorage |
| `restoreSession` | `() => SessionData \| null` | Restores session data from sessionStorage |
| `clearSession` | `(showWarning?: boolean) => boolean` | Clears session data, optionally showing a warning |
| `isSessionExpired` | `(timestamp: number, expiration?: number) => boolean` | Checks if a session is expired |

### Data Types

#### `FileReference`

```typescript
interface FileReference {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}
```

#### `SessionData`

```typescript
interface SessionData {
  files: FileReference[];
  operation: string;
  options: Record<string, any>;
  timestamp: number;
}
```

## Implementation Details

### Storage Mechanism

- Uses browser's `sessionStorage` API
- Data persists only for the current browser tab/window
- Automatically cleared when tab/window is closed
- Survives page reloads and navigation within the same tab

### Expiration Checking

- Checks session expiration on mount
- Periodically checks expiration every 60 seconds
- Automatically clears expired sessions
- Calls `onSessionExpired` callback when session expires

### Warning Dialog

When calling `clearSession(true)`, a native browser confirmation dialog appears:
```
Are you sure you want to clear your session? All unsaved work will be lost.
```

Users can cancel the operation, preventing accidental data loss.

## Testing

The SessionManager includes comprehensive property-based tests using `fast-check`:

### Property 30: Session Persistence
- Tests session save and restore with random data
- Verifies all file properties are preserved
- Tests operation state restoration
- Validates expiration behavior
- Tests multiple save/restore cycles

### Property 31: Session Cleanup
- Tests session clearing after operations
- Verifies data cannot be restored after cleanup
- Tests cleanup of empty sessions
- Validates immediate cleanup behavior
- Tests multiple independent sessions

Run tests:
```bash
npm test -- SessionManager.test.tsx
```

## Example Integration

See `SessionManagerExample.tsx` for a complete working example that demonstrates:
- File upload with session persistence
- Operation selection
- Session restoration on page reload
- Manual session clearing with warning
- Automatic cleanup after operation completion

## Best Practices

1. **Save Frequently**: Call `saveSession()` whenever important state changes
2. **Handle Restoration**: Always implement `onSessionRestored` to properly restore your app state
3. **Clear After Success**: Call `clearSession()` after successful operations to prevent stale data
4. **Use Unique Keys**: Use different session keys for different features/workflows
5. **Handle Expiration**: Implement `onSessionExpired` to inform users and reset state

## Browser Compatibility

SessionManager uses `sessionStorage`, which is supported in:
- Chrome 4+
- Firefox 3.5+
- Safari 4+
- Edge (all versions)
- IE 8+

## Security Considerations

- Session data is stored in plain text in sessionStorage
- Do not store sensitive information (passwords, tokens, etc.)
- Session data is accessible to JavaScript on the same origin
- Data is automatically cleared when the browser tab is closed
- Consider encrypting sensitive data before storing

## Performance

- Minimal performance impact
- Session checks run every 60 seconds (configurable)
- JSON serialization/deserialization is fast for typical session sizes
- No network requests involved (all local storage)

## Troubleshooting

### Session Not Restoring

1. Check that `sessionKey` is consistent across renders
2. Verify `onSessionRestored` callback is implemented
3. Check browser console for errors
4. Ensure sessionStorage is not disabled in browser settings

### Session Expiring Too Quickly

1. Increase `expirationTime` prop
2. Verify system clock is accurate
3. Check that session is being saved with current timestamp

### Warning Dialog Not Showing

1. Ensure `clearSession(true)` is called with `true` parameter
2. Check that browser allows confirmation dialogs
3. Verify no other code is preventing the dialog

## Future Enhancements

Potential improvements for future versions:
- Encryption support for sensitive data
- Compression for large session data
- IndexedDB fallback for larger data
- Cross-tab synchronization
- Session migration between storage types
- Configurable warning dialog customization
