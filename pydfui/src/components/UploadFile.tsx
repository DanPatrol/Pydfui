import React, { useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useNavigate, useParams } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Card from 'react-bootstrap/Card';  // Import Card component from React-Bootstrap

const UploadFile: React.FC = () => {
  const [fileAdded, setFileAdded] = useState(false);
  const { action } = useParams();
  const [_, setFiles] = useState<File[]>([]);
  const navigate = useNavigate();

  const AddfilesAlert = (message: string) => {
    toast.error(message);
  };

  const getFormattedAction = (action: string): string => {
    switch (action) {
      case 'wtpdf':
        return 'WORD TO A PDF ';
      case 'jpegtopdf':
        return 'JPEG TO A PDF ';
      case 'removepages':
          return 'REMOVE PAGES FROM ';
      case 'exceltopdf':
        return 'EXCEL TO  A PDF';
      case 'addwatermark':
        return 'ADD WATERMARK TO ';
      case 'extract':
        return 'EXTRACT PAGES FROM ';
      case 'organize':
        return 'ORGANIZE PAGES IN ';
      case 'compress':
        return 'COMPRESS ';
      case 'rotate':
        return 'ROTATE ';
      case 'merge':
        return 'MERGE ';
      case 'split':
        return 'SPLIT ';
      case 'repair':
        return 'REPAIR ';
      
      default:
        return action.charAt(0).toUpperCase() + action.slice(1); // Capitalize the first letter and keep the rest
    }
  };

  const validateFileTypes = (files: File[], action: string): boolean => {
    let allowedTypes: string[];
    if (action === 'split' || action === 'merge' || action === 'compress' || action === 'rotate' || action === 'addwatermark' || action === 'extract' || action === 'organize' || action === 'removepages' || action === 'repair' ) {
      allowedTypes = ['application/pdf'];
    } else if (action === 'jpegtopdf') {
      allowedTypes = ['image/jpeg', 'image/png'];
    } else if (action === 'exceltopdf') {
      allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    } else if (action === 'wtpdf') {
      allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    }
    else {
      allowedTypes = [];
    }

    for (let file of files) {
      if (!allowedTypes.includes(file.type)) {
        AddfilesAlert(`Invalid file type: ${file.name}`);
        return false;
      }
    }
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    const processType = action?? 'merge';

    if (selectedFiles && selectedFiles.length > 0) {
      const filesArray = Array.from(selectedFiles);

      if (!validateFileTypes(filesArray, processType)) {
        setFiles([]);
      } else if (processType !== 'merge' && filesArray.length > 1) {
        AddfilesAlert('Only one file is allowed for this action');
        setFiles([]);
      } else if (processType === 'merge' && filesArray.length < 2) {
        AddfilesAlert('Please select at least two files for merging');
      } else {
        setFiles(filesArray);
        setFileAdded(true);
        navigateToPage(processType, filesArray);
      }
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const droppedFiles = e.dataTransfer.files;
    const processType = action?? 'merge';

    if (droppedFiles.length > 0) {
      const filesArray = Array.from(droppedFiles);

      if (!validateFileTypes(filesArray, processType)) {
        setFiles([]);
      } else if (processType !== 'merge' && filesArray.length > 1) {
        AddfilesAlert('Only one file is allowed for this action');
        setFiles([]);
      } else if (processType === 'merge' && filesArray.length < 2) {
        AddfilesAlert('Please select at least two files for merging');
      } else {
        setFiles(filesArray);
        setFileAdded(true);
        navigateToPage(processType, filesArray);
      }
    } else {
      AddfilesAlert('Please add at least 1 file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const navigateToPage = (processType: string, files: File[]) => {
    switch (processType) {
      case 'split':
        navigate('/split', { state: { files, processType } });
        break;
      case 'removepages':
        navigate('/removepages', { state: { files, processType } });
        break;
      case 'repair':
        navigate('/end/repair', { state: { files, processType } });
        break;
      case 'wtpdf':
        navigate('/end/wtpdf', { state: { files, processType } });
        break;
      case 'jpegtopdf':
        navigate('/end/jpegtopdf', { state: { files, processType } });
        break;
      case 'exceltopdf':
        navigate('/end/exceltopdf', { state: { files, processType } });
        break;
      case 'rotate':
        navigate('/rotate', { state: { files, processType } });
        break;
      case 'addwatermark':
        navigate('/addwatermark', { state: { files, processType } });
        break;
      case 'extract':
        navigate('/extractpages', { state: { files, processType } });
        break;
      case 'organize':
        navigate('/organizepages', { state: { files, processType } });
        break;
      case 'compress':
        navigate('/compress', { state: { files, processType } });
        break;
      default:
        navigate('/preview', { state: { files, processType } });
        break;
    }
  };

  const handleButtonClick = () => {
    document.getElementById('file-input')?.click();
  };

  return (
    <div className="flex items-center justify-center bg-white rounded-lg p-4">
      {/* Card Component Wrapper */}
      <Card className="w-full max-w-md mx-auto p-6 shadow-lg border border-[#0b3869] bg-white rounded-lg">
        <Card.Body className="text-center">
          <h1 className="text-[#1e2a47] text-3xl font-medium mb-4">{getFormattedAction(action!)} DOCUMENT</h1>
          <p className="text-lg text-[#555] mb-6">Please Upload Your File</p>

          <Button
            variant="primary"
            className="mb-4"
            onClick={handleButtonClick}
          >
            Upload
          </Button>

          <input
            type="file"
            id="file-input"
            className="hidden"
            onChange={handleFileChange}
            multiple
          />

          {/* Drop Area */}
          <div
            className="border border-dashed border-[#7dd3fc] mt-4 p-4 w-full text-center text-sm text-[#555] rounded-lg"
            onDrop={handleDrop}
            onDragOver={handleDragOver}
          >
            {fileAdded ? "File Added Successfully" : "Or Drag File Here to Upload"}
          </div>
        </Card.Body>

        {/* Toast Notifications */}
        <ToastContainer position="top-center" autoClose={3000} />
      </Card>
    </div>
  );
};

export default UploadFile;
