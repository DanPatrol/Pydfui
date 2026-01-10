import { API_BASE_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import Button from 'react-bootstrap/Button';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { 
  AiOutlineCheckCircle, 
  AiOutlineCloseCircle, 
  AiOutlineDownload,
  AiOutlineHome,
  AiOutlineFileProtect,
  AiOutlineCompress,
  AiOutlineScissor,
  AiOutlineRotateRight,
  AiOutlineLock,
  AiOutlineNumber
} from 'react-icons/ai';

const Endpage: React.FC = () => {
  const { action = '' } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
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
      anchor.download = filename || 'output.pdf';
      anchor.click();
      URL.revokeObjectURL(downloadUrl);
    } else if (response) {
      setServerError(`Failed to process the files. Status: ${response.status}`);
    } else if (error) {
      setServerError('An error occurred while processing the files. Sorry for the inconvenience.');
    }
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
      const response = await fetch(`${API_BASE_URL}/${url}`, {
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
    if (response || error) {
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
  }, [action, downloadLink, serverError, response, error]);

  // Suggested tools based on current action
  const getSuggestedTools = () => {
    const toolSuggestions: Record<string, Array<{title: string, description: string, href: string, icon: JSX.Element, gradient: string}>> = {
      merge: [
        { title: 'Compress PDF', description: 'Reduce file size after merging', href: '/upload/compress', icon: <AiOutlineCompress />, gradient: 'from-orange-500 to-orange-600' },
        { title: 'Add Watermark', description: 'Protect your merged document', href: '/upload/addwatermark', icon: <AiOutlineFileProtect />, gradient: 'from-violet-500 to-violet-600' },
        { title: 'Add Page Numbers', description: 'Number your merged pages', href: '/upload/pagenumbers', icon: <AiOutlineNumber />, gradient: 'from-blue-700 to-blue-800' },
      ],
      split: [
        { title: 'Compress PDF', description: 'Reduce size of split files', href: '/upload/compress', icon: <AiOutlineCompress />, gradient: 'from-orange-500 to-orange-600' },
        { title: 'Protect PDF', description: 'Add password to split files', href: '/upload/protect', icon: <AiOutlineLock />, gradient: 'from-red-600 to-red-700' },
        { title: 'Add Watermark', description: 'Watermark split documents', href: '/upload/addwatermark', icon: <AiOutlineFileProtect />, gradient: 'from-violet-500 to-violet-600' },
      ],
      compress: [
        { title: 'Add Watermark', description: 'Protect your compressed PDF', href: '/upload/addwatermark', icon: <AiOutlineFileProtect />, gradient: 'from-violet-500 to-violet-600' },
        { title: 'Split PDF', description: 'Split into smaller files', href: '/upload/split', icon: <AiOutlineScissor />, gradient: 'from-purple-500 to-purple-600' },
        { title: 'Protect PDF', description: 'Secure with password', href: '/upload/protect', icon: <AiOutlineLock />, gradient: 'from-red-600 to-red-700' },
      ],
      rotate: [
        { title: 'Compress PDF', description: 'Reduce file size', href: '/upload/compress', icon: <AiOutlineCompress />, gradient: 'from-orange-500 to-orange-600' },
        { title: 'Add Page Numbers', description: 'Number your pages', href: '/upload/pagenumbers', icon: <AiOutlineNumber />, gradient: 'from-blue-700 to-blue-800' },
        { title: 'Add Watermark', description: 'Add watermark', href: '/upload/addwatermark', icon: <AiOutlineFileProtect />, gradient: 'from-violet-500 to-violet-600' },
      ],
      addwatermark: [
        { title: 'Protect PDF', description: 'Add password protection', href: '/upload/protect', icon: <AiOutlineLock />, gradient: 'from-red-600 to-red-700' },
        { title: 'Compress PDF', description: 'Reduce file size', href: '/upload/compress', icon: <AiOutlineCompress />, gradient: 'from-orange-500 to-orange-600' },
        { title: 'Add Page Numbers', description: 'Number your pages', href: '/upload/pagenumbers', icon: <AiOutlineNumber />, gradient: 'from-blue-700 to-blue-800' },
      ],
      default: [
        { title: 'Compress PDF', description: 'Reduce file size', href: '/upload/compress', icon: <AiOutlineCompress />, gradient: 'from-orange-500 to-orange-600' },
        { title: 'Add Watermark', description: 'Protect your document', href: '/upload/addwatermark', icon: <AiOutlineFileProtect />, gradient: 'from-violet-500 to-violet-600' },
        { title: 'Protect PDF', description: 'Add password protection', href: '/upload/protect', icon: <AiOutlineLock />, gradient: 'from-red-600 to-red-700' },
      ],
    };

    return toolSuggestions[action] || toolSuggestions.default;
  };

  const suggestedTools = getSuggestedTools();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success/Error Card */}
        <div className={`bg-white rounded-2xl shadow-xl overflow-hidden mb-8 border-t-4 ${serverError ? 'border-red-500' : 'border-green-500'}`}>
          <div className="p-8 text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              {serverError ? (
                <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
                  <AiOutlineCloseCircle className="text-red-500 text-5xl" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                  <AiOutlineCheckCircle className="text-green-500 text-5xl" />
                </div>
              )}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              {serverError ? 'Oops! Something went wrong' : 'Success!'}
            </h1>

            {/* Message */}
            <p className="text-lg text-gray-600 mb-6">
              {serverError ? (
                serverError
              ) : (
                <>
                  Your {action ? action.replace(/([A-Z])/g, ' $1').toLowerCase() : 'file'} has been processed successfully.
                  <br />
                  <span className="text-sm text-gray-500">Your download should start automatically.</span>
                </>
              )}
            </p>

            {/* Success message */}
            {successMessage && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                <p className="text-green-700">{successMessage}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              {downloadLink && !serverError && (
                <button
                  onClick={() => {
                    if (downloadLink) {
                      const anchor = document.createElement('a');
                      anchor.href = downloadLink;
                      anchor.download = filename || 'output.pdf';
                      anchor.click();
                    }
                  }}
                  className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                >
                  <AiOutlineDownload className="text-xl" />
                  Download File
                </button>
              )}
              
              <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 transition-all duration-300"
              >
                <AiOutlineHome className="text-xl" />
                Back to Home
              </button>
            </div>
          </div>
        </div>

        {/* Suggested Tools Section */}
        {!serverError && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="text-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                What's Next?
              </h2>
              <p className="text-gray-600">
                Try these related tools to enhance your PDF
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {suggestedTools.map((tool, index) => (
                <button
                  key={index}
                  onClick={() => navigate(tool.href)}
                  className="group relative bg-gradient-to-br from-gray-50 to-white rounded-xl p-6 border-2 border-gray-200 hover:border-transparent hover:shadow-xl transition-all duration-300 text-left overflow-hidden"
                >
                  {/* Gradient overlay on hover */}
                  <div className={`absolute inset-0 bg-gradient-to-r ${tool.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
                  
                  {/* Content */}
                  <div className="relative z-10">
                    <div className={`inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r ${tool.gradient} text-white text-2xl mb-3 group-hover:scale-110 transition-transform duration-300`}>
                      {tool.icon}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 transition-colors">
                      {tool.title}
                    </h3>
                    <p className="text-sm text-gray-600">
                      {tool.description}
                    </p>
                  </div>

                  {/* Arrow indicator */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-2xl">→</span>
                  </div>
                </button>
              ))}
            </div>

            {/* View All Tools Link */}
            <div className="text-center mt-8">
              <button
                onClick={() => navigate('/#features')}
                className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
              >
                View All Workshop Tools →
              </button>
            </div>
          </div>
        )}

        {/* Error Recovery Section */}
        {serverError && (
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
              Need Help?
            </h2>
            <div className="space-y-3 text-gray-700">
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Make sure your file is a valid PDF and not corrupted
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Check that your file size is under 100MB
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                Try refreshing the page and uploading again
              </p>
              <p className="flex items-start gap-2">
                <span className="text-blue-600 font-bold">•</span>
                If the problem persists, try a different tool or contact support
              </p>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => window.location.reload()}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Endpage;
