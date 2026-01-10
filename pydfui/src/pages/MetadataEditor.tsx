import { API_BASE_URL } from '../config';
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineInfoCircle } from 'react-icons/ai`;
import PDFPreview from '../components/Adjuster';

const MetadataEditor: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [subject, setSubject] = useState('');
  const [keywords, setKeywords] = useState('');
  const [creator, setCreator] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (file) {
      loadMetadata();
    }
  }, [file]);

  const loadMetadata = async () => {
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch(`${API_BASE_URL}/get_pdf_metadata`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const metadata = await response.json();
        setTitle(metadata.title || '');
        setAuthor(metadata.author || '');
        setSubject(metadata.subject || '');
        setKeywords(metadata.keywords || '');
        setCreator(metadata.creator || '');
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!file) {
      alert('Please upload a PDF file');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    formData.append('author', author);
    formData.append('subject', subject);
    formData.append('keywords', keywords);
    formData.append('creator', creator);

    try {
      const response = await fetch(`${API_BASE_URL}/update_pdf_metadata`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = 'metadata_updated.pdf';
        
        if (contentDisposition) {
          const match = contentDisposition.match(/filename="?(.+)"?/);
          if (match) filename = match[1];
        }

        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/`, {
            state: {
              processType: 'metadata',
              status: response.status,
              filename,
            },
          });
        }, 1000);
      } else {
        alert('Failed to update metadata');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!file) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-600">No file selected. Please go back and upload a PDF.</p>
      </div>
    );
  }

  return (
    <div className="flex w-full h-screen">
      <div className="w-1/2 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Edit PDF Metadata</h2>
          <p className="text-gray-600">Update document properties and information.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-cyan-500 pb-2 flex items-center">
          <AiOutlineInfoCircle className="mr-2 text-cyan-500" />
          Document Properties
        </h2>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading metadata...</div>
          </div>
        ) : (
          <>
            <div className="mb-4 bg-white p-5 rounded-lg shadow-md">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-gray-900"
              />
            </div>

            <div className="mb-4 bg-white p-5 rounded-lg shadow-md">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Author</label>
              <input
                type="text"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Document author"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-gray-900"
              />
            </div>

            <div className="mb-4 bg-white p-5 rounded-lg shadow-md">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Subject</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Document subject"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-gray-900"
              />
            </div>

            <div className="mb-4 bg-white p-5 rounded-lg shadow-md">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="Comma-separated keywords"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-gray-900"
              />
            </div>

            <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
              <label className="block text-sm font-semibold mb-2 text-gray-800">Creator</label>
              <input
                type="text"
                value={creator}
                onChange={(e) => setCreator(e.target.value)}
                placeholder="Creator application"
                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-cyan-500 focus:ring-2 focus:ring-cyan-200 text-gray-900"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full ${
                isProcessing
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 transform hover:scale-105'
              } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
            >
              {isProcessing ? 'Updating...' : 'Update Metadata'}
            </button>

            <div className="mt-6 bg-cyan-50 border-2 border-cyan-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-cyan-800 mb-2">ℹ️ About Metadata</h4>
              <ul className="text-xs text-cyan-700 space-y-1">
                <li>• Metadata helps organize and search documents</li>
                <li>• Visible in file properties and PDF readers</li>
                <li>• Useful for document management systems</li>
                <li>• Leave fields empty to keep existing values</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MetadataEditor;
