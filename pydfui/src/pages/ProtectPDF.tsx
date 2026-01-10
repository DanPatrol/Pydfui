import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineLock, AiOutlineEye, AiOutlineEyeInvisible } from 'react-icons/ai';
import { FiShield, FiCheck } from 'react-icons/fi';
import PDFPreview from '../components/Adjuster';

const ProtectPDF: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [userPassword, setUserPassword] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [showUserPassword, setShowUserPassword] = useState(false);
  const [showOwnerPassword, setShowOwnerPassword] = useState(false);
  const [allowPrinting, setAllowPrinting] = useState(true);
  const [allowCopying, setAllowCopying] = useState(true);
  const [allowModification, setAllowModification] = useState(false);
  const [allowAnnotation, setAllowAnnotation] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!file || !userPassword) {
      alert('Please provide a password');
      return;
    }

    setIsProcessing(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('user_password', userPassword);
    if (ownerPassword) {
      formData.append('owner_password', ownerPassword);
    }
    formData.append('allow_printing', allowPrinting.toString());
    formData.append('allow_copying', allowCopying.toString());
    formData.append('allow_modification', allowModification.toString());
    formData.append('allow_annotation', allowAnnotation.toString());

    try {
      const response = await fetch(`${API_BASE_URL}/add_password`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'protected.pdf';
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/', {
            state: {
              processType: 'protect',
              status: response.status,
              filename: 'protected.pdf',
            },
          });
        }, 1000);
      } else {
        console.error('Failed to protect PDF:', response.statusText);
        navigate('/end/', { state: { processType: 'protect', status: response.status } });
      }
    } catch (error) {
      console.error('Error protecting PDF:', error);
      navigate('/end/', { state: { processType: 'protect', status: 'error' } });
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
      {/* Left side - PDF Preview */}
      <div className="w-1/2 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Protect PDF</h2>
          <p className="text-gray-600">Add password protection to secure your PDF file.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <PDFPreview files={[file]} />
        </div>
      </div>

      {/* Right side - Settings */}
      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-red-500 pb-2 flex items-center">
          <FiShield className="mr-2 text-red-500" />
          Security Settings
        </h2>

        {/* User Password */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-2 text-gray-800">
            User Password (Required) *
          </label>
          <div className="relative">
            <input
              type={showUserPassword ? 'text' : 'password'}
              value={userPassword}
              onChange={(e) => setUserPassword(e.target.value)}
              placeholder="Enter password to open PDF"
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-gray-900 font-medium placeholder-gray-400"
              style={{ fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={() => setShowUserPassword(!showUserPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showUserPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">This password is required to open the PDF</p>
        </div>

        {/* Owner Password */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <label className="block text-sm font-semibold mb-2 text-gray-800">
            Owner Password (Optional)
          </label>
          <div className="relative">
            <input
              type={showOwnerPassword ? 'text' : 'password'}
              value={ownerPassword}
              onChange={(e) => setOwnerPassword(e.target.value)}
              placeholder="Enter owner password (optional)"
              className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all text-gray-900 font-medium placeholder-gray-400"
              style={{ fontSize: '16px' }}
            />
            <button
              type="button"
              onClick={() => setShowOwnerPassword(!showOwnerPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showOwnerPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">For full access and changing permissions</p>
        </div>

        {/* Permissions */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4 text-gray-800">Permissions</h3>
          <div className="space-y-3">
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={allowPrinting}
                onChange={(e) => setAllowPrinting(e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-3 text-gray-700 group-hover:text-gray-900">Allow Printing</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={allowCopying}
                onChange={(e) => setAllowCopying(e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-3 text-gray-700 group-hover:text-gray-900">Allow Copying Text</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={allowModification}
                onChange={(e) => setAllowModification(e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-3 text-gray-700 group-hover:text-gray-900">Allow Modifications</span>
            </label>
            <label className="flex items-center cursor-pointer group">
              <input
                type="checkbox"
                checked={allowAnnotation}
                onChange={(e) => setAllowAnnotation(e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="ml-3 text-gray-700 group-hover:text-gray-900">Allow Annotations</span>
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={isProcessing || !userPassword}
          className={`w-full ${
            isProcessing || !userPassword
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 transform hover:scale-105'
          } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
        >
          {isProcessing ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Protecting...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <AiOutlineLock className="mr-2 text-xl" />
              Protect PDF
            </span>
          )}
        </button>

        {/* Help Text */}
        <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-red-800 mb-2 flex items-center">
            <FiCheck className="mr-2" />
            Security Features
          </h4>
          <ul className="text-xs text-red-700 space-y-1">
            <li>• AES-256 encryption</li>
            <li>• User password required to open</li>
            <li>• Owner password for permissions</li>
            <li>• Customizable access controls</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ProtectPDF;
