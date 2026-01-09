import { useEffect, useCallback, useRef } from 'react';

export interface FileReference {
  id: string;
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface SessionData {
  files: FileReference[];
  operation: string;
  options: Record<string, any>;
  timestamp: number;
}

export interface SessionManagerProps {
  sessionKey?: string;
  expirationTime?: number; // in milliseconds, default 1 hour
  onSessionRestored?: (sessionData: SessionData) => void;
  onSessionExpired?: () => void;
  onSessionCleared?: () => void;
}

const DEFAULT_EXPIRATION_TIME = 60 * 60 * 1000; // 1 hour in milliseconds
const DEFAULT_SESSION_KEY = 'pdf-tool-session';

export const useSessionManager = ({
  sessionKey = DEFAULT_SESSION_KEY,
  expirationTime = DEFAULT_EXPIRATION_TIME,
  onSessionRestored,
  onSessionExpired,
  onSessionCleared,
}: SessionManagerProps = {}) => {
  const warningShownRef = useRef(false);

  const saveSession = useCallback((sessionData: SessionData) => {
    try {
      const dataToSave = {
        ...sessionData,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(sessionKey, JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save session:', error);
    }
  }, [sessionKey]);

  const restoreSession = useCallback((): SessionData | null => {
    try {
      const storedData = sessionStorage.getItem(sessionKey);
      if (!storedData) {
        return null;
      }

      const sessionData: SessionData = JSON.parse(storedData);
      
      // Check if session is expired
      if (isSessionExpired(sessionData.timestamp, expirationTime)) {
        clearSession();
        if (onSessionExpired) {
          onSessionExpired();
        }
        return null;
      }

      return sessionData;
    } catch (error) {
      console.error('Failed to restore session:', error);
      return null;
    }
  }, [sessionKey, expirationTime, onSessionExpired]);

  const clearSession = useCallback((showWarning: boolean = false) => {
    try {
      if (showWarning && !warningShownRef.current) {
        const confirmed = window.confirm(
          'Are you sure you want to clear your session? All unsaved work will be lost.'
        );
        if (!confirmed) {
          return false;
        }
        warningShownRef.current = true;
      }

      sessionStorage.removeItem(sessionKey);
      
      if (onSessionCleared) {
        onSessionCleared();
      }
      
      return true;
    } catch (error) {
      console.error('Failed to clear session:', error);
      return false;
    }
  }, [sessionKey, onSessionCleared]);

  const isSessionExpired = useCallback((timestamp: number, expiration: number = expirationTime): boolean => {
    const now = Date.now();
    return (now - timestamp) > expiration;
  }, [expirationTime]);

  // Restore session on mount
  useEffect(() => {
    const sessionData = restoreSession();
    if (sessionData && onSessionRestored) {
      onSessionRestored(sessionData);
    }
  }, []);

  // Check for expiration periodically
  useEffect(() => {
    const checkExpiration = () => {
      const storedData = sessionStorage.getItem(sessionKey);
      if (storedData) {
        try {
          const sessionData: SessionData = JSON.parse(storedData);
          if (isSessionExpired(sessionData.timestamp, expirationTime)) {
            clearSession();
            if (onSessionExpired) {
              onSessionExpired();
            }
          }
        } catch (error) {
          console.error('Failed to check session expiration:', error);
        }
      }
    };

    // Check every minute
    const intervalId = setInterval(checkExpiration, 60 * 1000);

    return () => clearInterval(intervalId);
  }, [sessionKey, expirationTime, isSessionExpired, clearSession, onSessionExpired]);

  return {
    saveSession,
    restoreSession,
    clearSession,
    isSessionExpired,
  };
};

// Component wrapper for SessionManager
const SessionManager: React.FC<SessionManagerProps & { children?: React.ReactNode }> = ({
  children,
  ...props
}) => {
  useSessionManager(props);
  return <>{children}</>;
};

export default SessionManager;
