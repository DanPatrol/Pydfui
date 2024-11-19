import React, { useState, useEffect, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import { useLocation, useParams } from 'react-router-dom';

const Endpage: React.FC = () => {
  const { action = '' } = useParams();
  const location = useLocation();
  const { files, response, status, filename, error } = location.state || {};
  const [downloadLink, setDownloadLink] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const requestSent = useRef(false);

  // Function to handle server response passed from the previous screen
  const handleServerResponse = async () => {
    if (response?.ok) {
      setSuccessMessage('Your files have been successfully processed.');
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      setDownloadLink(downloadUrl);

      // Auto-download the file
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = 'output.pdf';
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } else if (response) {
      setServerError(`Failed to process the files. Status: ${response.status}`);
    } else if (status && filename) {
      setSuccessMessage('Your files have been successfully processed.');
      const downloadUrl = URL.createObjectURL(await fetchFile(filename));
      setDownloadLink(downloadUrl);

      // Auto-download the file
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = filename;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } else if (error) {
      setServerError('An error occurred while processing the files. Sorry for the inconvenience.');
    }
  };

  // Function to fetch the file blob from the server if filename is provided
  const fetchFile = async (filename: string) => {
    const response = await fetch(`https://pydf-api.vercel.app/files/${filename}`);
    if (!response.ok) throw new Error('Failed to download the file');
    return await response.blob();
  };

  // Request function for different actions
  const sendRequest = async (url: string, fileName: string) => {
    setServerError(null); // Clear previous errors

    if (!files || files.length === 0) {
      setServerError('No file selected.');
      return;
    }

    const formData = new FormData();
    formData.append('file', files[0]);

    try {
      const response = await fetch(`https://pydf-api.vercel.app/${url}`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Failed to process the file. Status: ${response.status}`;
        if (response.status === 422) {
          errorMessage += ' - Unprocessable Entity. Ensure you selected a valid file.';
        }
        throw new Error(errorMessage);
      }

      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      setDownloadLink(downloadUrl);

      // Automatically download the file
      const anchor = document.createElement('a');
      anchor.href = downloadUrl;
      anchor.download = fileName;
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } catch (err: any) {
      console.error('Error:', err);
      setServerError(err.message || 'Failed to process the file. Please try again.');
    }
  };

  // useEffect to handle different actions based on the action parameter
  useEffect(() => {
    if (response || (status && filename)) {
      handleServerResponse();
    } else if (!downloadLink && !serverError && !requestSent.current) {
      const actionMap: Record<string, () => void> = {
        repair: () => sendRequest('repair', 'repaired_output.pdf'),
        wtpdf: () => sendRequest('wordtopdf', 'wordtopdf.pdf'),
        jpegtopdf: () => sendRequest('jpegtopdf', 'jpegtopdf.pdf'),
        exceltopdf: () => sendRequest('exceltopdf', 'exceltopdf.pdf'),
      };

      const requestAction = actionMap[action];
      if (requestAction) {
        requestAction();
      } else {
        setServerError('Unknown action.');
      }
      requestSent.current = true;
    }
  }, [action, downloadLink, serverError, response, status, filename]);

  return (
    <div className="flex items-center justify-center bg-gray-100 min-h-screen">
      <div className="flex flex-col items-center border border-gray-400 rounded-lg overflow-hidden w-full lg:max-w-6xl py-10 px-6">
        <div className="text-[#414141] text-center">
          <p className="font-medium text-3xl sm:py-3 lg:text-5xl leading-relaxed">
            {action ? `${action.toUpperCase()} COMPLETED` : 'PROCESS COMPLETED'}
          </p>
          <h1 className="text-2xl sm:py-1 lg:text-2xl leading-relaxed">
            Wait for a moment and your files will automatically download.
            {!action && ' If not, press the button below.'}
          </h1>

          {/* Display error message if any */}
          {serverError && <p className="text-red-500 mt-4">{serverError}</p>}

          {/* Display success message if any */}
          {successMessage && <p className="text-green-600 mt-4">{successMessage}</p>}

          {/* Conditional Download button */}
          {downloadLink && (
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                if (downloadLink) {
                  const anchor = document.createElement('a');
                  anchor.href = downloadLink;
                  anchor.download = filename || 'output.pdf';
                  anchor.click();
                }
              }}
            >
              DOWNLOAD
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Endpage;
