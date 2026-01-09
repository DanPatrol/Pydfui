import React, { useState, useEffect, useCallback } from 'react';

export interface ProcessingOperation {
  id: string;
  type: 'merge' | 'split' | 'compress' | 'rotate' | 'watermark' | 'extract' | 'organize' | 'remove' | 'ocr' | 'edit' | 'convert' | 'form-fill' | 'compare';
  status: 'pending' | 'processing' | 'success' | 'error' | 'cancelled';
  progress: number; // 0-100
  fileName: string;
  fileId: string;
  startTime?: number;
  endTime?: number;
  error?: string;
  estimatedTimeRemaining?: number; // in seconds
}

export interface ProcessingManagerProps {
  operations: ProcessingOperation[];
  onCancel?: (operationId: string) => void;
  onRetry?: (operationId: string) => void;
  onDownload?: (operationId: string) => void;
  showNotifications?: boolean;
}

const ProcessingManager: React.FC<ProcessingManagerProps> = ({
  operations,
  onCancel,
  onRetry,
  onDownload,
  showNotifications = true,
}) => {
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error';
    message: string;
    operationId: string;
  }>>([]);

  // Calculate estimated time remaining based on progress and elapsed time
  const calculateEstimatedTime = useCallback((operation: ProcessingOperation): number | undefined => {
    if (!operation.startTime || operation.progress === 0) {
      return undefined;
    }

    const elapsed = Date.now() - operation.startTime;
    const progressFraction = operation.progress / 100;
    
    if (progressFraction === 0) {
      return undefined;
    }

    const totalEstimated = elapsed / progressFraction;
    const remaining = totalEstimated - elapsed;
    
    return Math.max(0, Math.round(remaining / 1000)); // Convert to seconds
  }, []);

  // Monitor operations for completion and show notifications
  useEffect(() => {
    if (!showNotifications) return;

    operations.forEach(operation => {
      // Check if we already have a notification for this operation
      const existingNotification = notifications.find(n => n.operationId === operation.id);
      
      if (operation.status === 'success' && !existingNotification) {
        setNotifications(prev => [...prev, {
          id: `${operation.id}-success`,
          type: 'success',
          message: `${operation.fileName} processed successfully`,
          operationId: operation.id,
        }]);
      } else if (operation.status === 'error' && !existingNotification) {
        const errorMessage = operation.error || 'An error occurred during processing';
        setNotifications(prev => [...prev, {
          id: `${operation.id}-error`,
          type: 'error',
          message: `${operation.fileName}: ${errorMessage}`,
          operationId: operation.id,
        }]);
      }
    });
  }, [operations, showNotifications, notifications]);

  const dismissNotification = (notificationId: string) => {
    setNotifications(prev => prev.filter(n => n.id !== notificationId));
  };

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const getProgressColor = (status: ProcessingOperation['status']): string => {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-blue-500';
    }
  };

  const activeOperations = operations.filter(op => 
    op.status === 'pending' || op.status === 'processing'
  );

  const completedOperations = operations.filter(op => 
    op.status === 'success' || op.status === 'error' || op.status === 'cancelled'
  );

  return (
    <div className="processing-manager" data-testid="processing-manager">
      {/* Notifications */}
      {showNotifications && notifications.length > 0 && (
        <div className="notifications-container fixed top-4 right-4 z-50 space-y-2" data-testid="notifications-container">
          {notifications.map(notification => (
            <div
              key={notification.id}
              data-testid={`notification-${notification.type}`}
              className={`notification p-4 rounded-lg shadow-lg ${
                notification.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{notification.type === 'success' ? 'Success' : 'Error'}</p>
                  <p className="text-sm mt-1">{notification.message}</p>
                  {notification.type === 'success' && onDownload && (
                    <button
                      onClick={() => onDownload(notification.operationId)}
                      className="mt-2 text-sm underline hover:no-underline"
                      data-testid="download-button"
                    >
                      Download
                    </button>
                  )}
                  {notification.type === 'error' && onRetry && (
                    <button
                      onClick={() => onRetry(notification.operationId)}
                      className="mt-2 text-sm underline hover:no-underline"
                      data-testid="retry-button"
                    >
                      Retry
                    </button>
                  )}
                </div>
                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="ml-4 text-gray-500 hover:text-gray-700"
                  data-testid="dismiss-notification"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Active Operations */}
      {activeOperations.length > 0 && (
        <div className="active-operations mb-6" data-testid="active-operations">
          <h3 className="text-lg font-semibold mb-3">Processing</h3>
          <div className="space-y-3">
            {activeOperations.map(operation => {
              const estimatedTime = calculateEstimatedTime(operation);
              
              return (
                <div
                  key={operation.id}
                  data-testid={`operation-${operation.id}`}
                  className="operation-item bg-white p-4 rounded-lg shadow"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-sm" data-testid="operation-filename">
                        {operation.fileName}
                      </p>
                      <p className="text-xs text-gray-500 capitalize">
                        {operation.type} operation
                      </p>
                    </div>
                    {onCancel && operation.status === 'processing' && (
                      <button
                        onClick={() => onCancel(operation.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                        data-testid="cancel-button"
                      >
                        Cancel
                      </button>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="progress-bar-container mb-2" data-testid="progress-bar-container">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getProgressColor(operation.status)}`}
                        style={{ width: `${operation.progress}%` }}
                        data-testid="progress-bar"
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1">
                      <span className="text-xs text-gray-600" data-testid="progress-percentage">
                        {operation.progress}%
                      </span>
                      {estimatedTime !== undefined && estimatedTime > 0 && (
                        <span className="text-xs text-gray-600" data-testid="estimated-time">
                          {formatTime(estimatedTime)} remaining
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Completed Operations */}
      {completedOperations.length > 0 && (
        <div className="completed-operations" data-testid="completed-operations">
          <h3 className="text-lg font-semibold mb-3">Completed</h3>
          <div className="space-y-2">
            {completedOperations.map(operation => (
              <div
                key={operation.id}
                data-testid={`completed-operation-${operation.id}`}
                className="operation-item bg-white p-3 rounded-lg shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-sm">{operation.fileName}</p>
                    <p className={`text-xs ${
                      operation.status === 'success' ? 'text-green-600' : 
                      operation.status === 'error' ? 'text-red-600' : 
                      'text-gray-600'
                    }`}>
                      {operation.status === 'success' && 'Completed successfully'}
                      {operation.status === 'error' && (operation.error || 'Failed')}
                      {operation.status === 'cancelled' && 'Cancelled'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {operation.status === 'success' && onDownload && (
                      <button
                        onClick={() => onDownload(operation.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        data-testid="download-completed-button"
                      >
                        Download
                      </button>
                    )}
                    {operation.status === 'error' && onRetry && (
                      <button
                        onClick={() => onRetry(operation.id)}
                        className="text-sm text-blue-600 hover:text-blue-800"
                        data-testid="retry-completed-button"
                      >
                        Retry
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Progress Summary */}
      {operations.length > 1 && (
        <div className="batch-summary mt-6 p-4 bg-gray-50 rounded-lg" data-testid="batch-summary">
          <h4 className="font-semibold text-sm mb-2">Batch Progress</h4>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-blue-600" data-testid="batch-processing-count">
                {activeOperations.length}
              </p>
              <p className="text-xs text-gray-600">Processing</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600" data-testid="batch-success-count">
                {operations.filter(op => op.status === 'success').length}
              </p>
              <p className="text-xs text-gray-600">Successful</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600" data-testid="batch-error-count">
                {operations.filter(op => op.status === 'error').length}
              </p>
              <p className="text-xs text-gray-600">Failed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProcessingManager;
