import React, { useState, useCallback, useRef } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export interface UploadProgress {
  fileId: string;
  fileName: string;
  progress: number; // 0-100
  status: 'pending' | 'uploading' | 'complete' | 'error';
}

export interface EnhancedUploadInterfaceProps {
  acceptedTypes: string[];
  maxFileSize: number; // in bytes
  maxFiles?: number;
  onUploadComplete: (files: File[]) => void;
  onUploadError?: (error: { code: string; message: string; fileName?: string }) => void;
  allowMultiple?: boolean;
  showProgress?: boolean;
}

const EnhancedUploadInterface: React.FC<EnhancedUploadInterfaceProps> = ({
  acceptedTypes,
  maxFileSize,
  maxFiles,
  onUploadComplete,
  onUploadError,
  allowMultiple = true,
  showProgress = true,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<UploadProgress[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFileType = (file: File): boolean => {
    return acceptedTypes.includes(file.type);
  };

  const validateFileSize = (file: File): boolean => {
    return file.size <= maxFileSize;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const getAcceptedFormatsMessage = (): string => {
    const formats = acceptedTypes.map(type => {
      const parts = type.split('/`);
      return parts[parts.length - 1].toUpperCase();
    });
    return formats.join(', ');
  };

  const handleFiles = useCallback((files: FileList | null) => {
    if (!files || files.length === 0) return;

    const filesArray = Array.from(files);

    // Check max files limit
    if (maxFiles && filesArray.length > maxFiles) {
      const error = {
        code: 'TOO_MANY_FILES',
        message: `Maximum ${maxFiles} file${maxFiles > 1 ? 's' : ''} allowed`,
      };
      toast.error(error.message);
      onUploadError?.(error);
      return;
    }

    // Check if multiple files are allowed
    if (!allowMultiple && filesArray.length > 1) {
      const error = {
        code: 'MULTIPLE_FILES_NOT_ALLOWED',
        message: 'Only one file is allowed',
      };
      toast.error(error.message);
      onUploadError?.(error);
      return;
    }

    // Validate each file
    const validFiles: File[] = [];
    const progressItems: UploadProgress[] = [];

    for (const file of filesArray) {
      // Validate file type
      if (!validateFileType(file)) {
        const error = {
          code: 'INVALID_FILE_TYPE',
          message: `Invalid file type: ${file.name}. Accepted formats: ${getAcceptedFormatsMessage()}`,
          fileName: file.name,
        };
        toast.error(error.message);
        onUploadError?.(error);
        continue;
      }

      // Validate file size
      if (!validateFileSize(file)) {
        const error = {
          code: 'FILE_TOO_LARGE',
          message: `File ${file.name} exceeds maximum size of ${formatFileSize(maxFileSize)}`,
          fileName: file.name,
        };
        toast.error(error.message);
        onUploadError?.(error);
        continue;
      }

      validFiles.push(file);
      progressItems.push({
        fileId: `${file.name}-${Date.now()}`,
        fileName: file.name,
        progress: 0,
        status: 'pending',
      });
    }

    if (validFiles.length === 0) return;

    setUploadProgress(progressItems);

    // Simulate upload progress
    validFiles.forEach((file, index) => {
      simulateUpload(progressItems[index].fileId, file);
    });

    setUploadedFiles(validFiles);
  }, [acceptedTypes, maxFileSize, maxFiles, allowMultiple, onUploadError]);

  const simulateUpload = (fileId: string, file: File) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.random() * 30;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        setUploadProgress(prev =>
          prev.map(item =>
            item.fileId === fileId
              ? { ...item, progress: 100, status: 'complete' }
              : item
          )
        );
        
        // Check if all files are complete
        setUploadProgress(prev => {
          const allComplete = prev.every(item => item.status === 'complete');
          if (allComplete) {
            setTimeout(() => {
              toast.success(`${prev.length} file${prev.length > 1 ? 's' : ''} uploaded successfully! 🎉`);
              onUploadComplete(uploadedFiles);
            }, 100);
          }
          return prev;
        });
      } else {
        setUploadProgress(prev =>
          prev.map(item =>
            item.fileId === fileId
              ? { ...item, progress: Math.min(progress, 100), status: 'uploading' }
              : item
          )
        );
      }
    }, 200);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    handleFiles(e.target.files);
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const allFilesComplete = uploadProgress.length > 0 && uploadProgress.every(item => item.status === 'complete');

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileInputChange}
          multiple={allowMultiple}
          accept={acceptedTypes.join(',')}
          data-testid="file-input"
        />

        <div className="space-y-4">
          <div className="text-6xl">📁</div>
          <div>
            <h3 className="text-xl font-semibold text-gray-700 mb-2">
              {isDragging ? 'Drop files here' : 'Upload Files'}
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Drag and drop files here, or click to select
            </p>
            <button
              onClick={handleButtonClick}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              data-testid="upload-button"
            >
              Select Files
            </button>
          </div>
          <div className="text-xs text-gray-400">
            <p>Accepted formats: {getAcceptedFormatsMessage()}</p>
            <p>Maximum file size: {formatFileSize(maxFileSize)}</p>
            {maxFiles && <p>Maximum files: {maxFiles}</p>}
          </div>
        </div>
      </div>

      {showProgress && uploadProgress.length > 0 && (
        <div className="mt-6 space-y-3" data-testid="progress-container">
          {uploadProgress.map((item) => (
            <div
              key={item.fileId}
              className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 truncate flex-1">
                  {item.fileName}
                </span>
                <span className="text-sm text-gray-500 ml-2">
                  {item.status === 'complete' ? '✓' : `${Math.round(item.progress)}%`}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.status === 'complete' ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${item.progress}%` }}
                  data-testid={`progress-bar-${item.fileId}`}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {allFilesComplete && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg text-center animate-fade-in">
          <p className="text-green-700 font-medium">
            ✓ {uploadProgress.length} file{uploadProgress.length > 1 ? 's' : ''} uploaded successfully!
          </p>
        </div>
      )}

      <ToastContainer position="top-center" autoClose={3000} />
    </div>
  );
};

export default EnhancedUploadInterface;
