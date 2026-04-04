import { API_BASE_URL } from '../config';
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
    const actionLabels: Record<string, string> = {
      wtpdf: 'WORD TO A PDF ',
      jpegtopdf: 'JPEG TO A PDF ',
      removepages: 'REMOVE PAGES FROM ',
      exceltopdf: 'EXCEL TO A PDF ',
      addwatermark: 'ADD WATERMARK TO ',
      extract: 'EXTRACT PAGES FROM ',
      organize: 'ORGANIZE PAGES IN ',
      compress: 'COMPRESS ',
      rotate: 'ROTATE ',
      merge: 'MERGE ',
      split: 'SPLIT ',
      repair: 'REPAIR ',
      protect: 'PROTECT ',
      unlock: 'UNLOCK ',
      pagenumbers: 'ADD PAGE NUMBERS TO ',
      removeblank: 'REMOVE BLANK PAGES FROM ',
      pdftoimage: 'CONVERT PDF TO IMAGES ',
      flatten: 'FLATTEN ',
      metadata: 'EDIT METADATA OF ',
      pdftotext: 'EXTRACT TEXT FROM ',
      grayscale: 'CONVERT TO GRAYSCALE ',
      reverse: 'REVERSE PAGES OF ',
      resizepdf: 'RESIZE PAGES OF ',
      headerfooter: 'ADD HEADER/FOOTER TO ',
      extractimages: 'EXTRACT IMAGES FROM ',
      pdftohtml: 'CONVERT TO HTML ',
      weboptimize: 'WEB-OPTIMIZE ',
      ocrpdf: 'OCR ',
      pdftocsv: 'EXTRACT CSV FROM ',
      croppdf: 'CROP ',
      redactpdf: 'REDACT ',
      pdftopdf_a: 'CONVERT TO PDF/A ',
      pdftojpg: 'CONVERT TO JPG ',
      pdftopng: 'CONVERT TO PNG ',
      editpdf: 'EDIT ',
    };
    return actionLabels[action] || action.charAt(0).toUpperCase() + action.slice(1);
  };

  const pdfActions = [
    'split', 'merge', 'compress', 'rotate', 'addwatermark', 'extract',
    'organize', 'removepages', 'repair', 'protect', 'unlock', 'pagenumbers',
    'removeblank', 'pdftoimage', 'flatten', 'metadata', 'pdftotext',
    'grayscale', 'reverse', 'resizepdf', 'headerfooter', 'extractimages',
    'pdftohtml', 'weboptimize', 'ocrpdf', 'pdftocsv', 'croppdf',
    'redactpdf', 'pdftopdf_a', 'pdftojpg', 'pdftopng',
    'signpdf', 'comparepdf', 'pdftopptx', 'editpdf',
  ];

  const getAcceptAttribute = (action: string): string => {
    if (pdfActions.includes(action)) {
      return 'application/pdf';
    } else if (action === 'jpegtopdf') {
      return 'image/jpeg,image/png';
    } else if (action === 'exceltopdf') {
      return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
    } else if (action === 'wtpdf') {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    } else if (action === 'pptxtopdf') {
      return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
    }
    return '';
  };

  const getFileTypeLabel = (action: string): string => {
    if (pdfActions.includes(action)) {
      return 'PDF files only';
    } else if (action === 'jpegtopdf') {
      return 'JPEG/PNG images only';
    } else if (action === 'exceltopdf') {
      return 'Excel files only';
    } else if (action === 'wtpdf') {
      return 'Word documents only';
    } else if (action === 'pptxtopdf') {
      return 'PowerPoint files only';
    }
    return '';
  };

  const validateFileTypes = (files: File[], action: string): boolean => {
    let allowedTypes: string[];
    if (pdfActions.includes(action)) {
      allowedTypes = ['application/pdf'];
    } else if (action === 'jpegtopdf') {
      allowedTypes = ['image/jpeg', 'image/png'];
    } else if (action === 'exceltopdf') {
      allowedTypes = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

    } else if (action === 'wtpdf') {
      allowedTypes = ['application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    } else if (action === 'pptxtopdf') {
      allowedTypes = ['application/vnd.openxmlformats-officedocument.presentationml.presentation'];
    } else {
      allowedTypes = [];
    }

    const invalidFiles = files.filter(file => !allowedTypes.includes(file.type));
    
    if (invalidFiles.length > 0) {
      const fileTypeMessage = allowedTypes.includes('application/pdf') ? 'PDF' : 
                             allowedTypes.includes('image/jpeg') ? 'JPEG/PNG' :
                             allowedTypes.includes('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') ? 'Excel' :
                             allowedTypes.includes('application/vnd.openxmlformats-officedocument.wordprocessingml.document') ? 'Word' : 'valid';
      AddfilesAlert(`Only ${fileTypeMessage} files are allowed. ${invalidFiles.length} invalid file(s) filtered out.`);
      return false;
    }
    return true;
  };

  // Check if action supports batch processing
  const supportsBatchProcessing = (action: string): boolean => {
    return ['repair', 'wtpdf', 'jpegtopdf', 'exceltopdf', 'pptxtopdf'].includes(action);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    const processType = action?? 'merge';

    if (selectedFiles && selectedFiles.length > 0) {
      const filesArray = Array.from(selectedFiles);

      if (!validateFileTypes(filesArray, processType)) {
        setFiles([]);
      } else if (!supportsBatchProcessing(processType) && processType !== 'merge' && filesArray.length > 1) {
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
      } else if (!supportsBatchProcessing(processType) && processType !== 'merge' && filesArray.length > 1) {
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
    // Define batch processing configuration
    const batchConfig: Record<string, { endpoint: string; title: string; description: string }> = {
      repair: {
        endpoint: `${API_BASE_URL}/repair`,
        title: 'Batch Repair PDFs',
        description: 'Repair multiple corrupted or damaged PDF files at once'
      },
      wtpdf: {
        endpoint: `${API_BASE_URL}/wordtopdf`,
        title: 'Batch Convert Word to PDF',
        description: 'Convert multiple Word documents to PDF format'
      },
      jpegtopdf: {
        endpoint: `${API_BASE_URL}/jpegtopdf`,
        title: 'Batch Convert JPEG to PDF',
        description: 'Convert multiple JPEG/PNG images to PDF format'
      },
      exceltopdf: {
        endpoint: `${API_BASE_URL}/exceltopdf`,
        title: 'Batch Convert Excel to PDF',
        description: 'Convert multiple Excel spreadsheets to PDF format'
      },
      pptxtopdf: {
        endpoint: `${API_BASE_URL}/pptx_to_pdf`,
        title: 'Batch Convert PowerPoint to PDF',
        description: 'Convert multiple PowerPoint presentations to PDF format'
      }
    };

    // Check if this action supports batch processing
    if (supportsBatchProcessing(processType) && files.length >= 1) {
      const config = batchConfig[processType];
      navigate('/batch-preview', {
        state: {
          files,
          processType,
          endpoint: config.endpoint,
          acceptedTypes: getAcceptAttribute(processType),
          title: config.title,
          description: config.description
        }
      });
      return;
    }

    // Route map for non-batch actions
    const routeMap: Record<string, string> = {
      split: '/split',
      removepages: '/removepages',
      rotate: '/rotate',
      addwatermark: '/addwatermark',
      extract: '/extractpages',
      organize: '/organizepages',
      compress: '/compress',
      protect: '/protect',
      unlock: '/unlock',
      pagenumbers: '/pagenumbers',
      removeblank: '/removeblank',
      pdftoimage: '/pdftoimage',
      flatten: '/flatten',
      metadata: '/metadata',
      pdftotext: '/pdftotext',
      grayscale: '/grayscalepdf',
      reverse: '/reversepdf',
      resizepdf: '/resizepdf',
      headerfooter: '/headerfooter',
      extractimages: '/extractimages',
      pdftohtml: '/pdftohtml',
      weboptimize: '/weboptimize',
      ocrpdf: '/ocrpdf',
      pdftocsv: '/pdftocsv',
      croppdf: '/croppdf',
      redactpdf: '/redactpdf',
      pdftopdf_a: '/pdftopdf-a',
      pdftojpg: '/pdftojpg',
      pdftopng: '/pdftopng',
      editpdf: '/editpdf',
      signpdf: '/signpdf',
      comparepdf: '/comparepdf',
      pptxtopdf: '/pptxtopdf',
      pdftopptx: '/pdftopptx',
    };

    const route = routeMap[processType];
    if (route) {
      navigate(route, { state: { files, processType } });
    } else {
      navigate('/preview', { state: { files, processType } });
    }
  };

  const handleButtonClick = () => {
    document.getElementById('file-input')?.click();
  };

  return (
    <div className="flex items-center justify-center bg-white rounded-lg p-3 sm:p-4 md:p-6">
      {/* Card Component Wrapper */}
      <Card className="w-full max-w-xs sm:max-w-sm md:max-w-md mx-auto p-3 sm:p-4 md:p-6 shadow-lg border border-gray-200 bg-white rounded-lg">
        <Card.Body className="text-center">
          <h1 className="text-gray-900 text-lg sm:text-xl md:text-2xl font-medium mb-3 sm:mb-4">{getFormattedAction(action!)} DOCUMENT</h1>
          <p className="text-sm sm:text-base md:text-lg text-gray-600 mb-2">Please Upload Your File</p>
          <p className="text-xs sm:text-sm text-blue-600 font-semibold mb-3 sm:mb-4">📄 {getFileTypeLabel(action!)}</p>

          <Button
            variant="primary"
            className="mb-3 sm:mb-4 px-3 py-2 sm:px-4 sm:py-2 md:px-6 md:py-3 min-h-[44px] min-w-[44px] w-full"
            onClick={handleButtonClick}
          >
            Upload
          </Button>

          <input
            type="file"
            id="file-input"
            className="hidden"
            onChange={handleFileChange}
            accept={getAcceptAttribute(action!)}
            multiple
          />

          {/* Drop Area */}
          <div
            className="border border-dashed border-blue-300 mt-3 sm:mt-4 p-3 sm:p-4 md:p-6 w-full text-center text-sm sm:text-base md:text-lg text-gray-600 rounded-lg min-h-[44px] min-w-[44px]"
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
