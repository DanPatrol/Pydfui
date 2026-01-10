import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AiOutlineUnlock, AiOutlineEye, AiOutlineEyeInvisible, AiOutlineLock } from 'react-icons/ai`;
import { FiUnlock } from 'react-icons/fi`;
import PDFPreview from '../components/Adjuster';

const UnlockPDF: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!file || !password) {
      setError('Please provide a password');
      return;
    }

    setIsProcessing(true);
    setError('');
    const formData = new FormData();
    formData.append('file', file);
    formData.append('password', password);

    try {
      const response = await fetch(`${API_BASE_URL}/remove_password`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unlocked.pdf';
        a.click();
        window.URL.revokeObjectURL(url);

        setTimeout(() => {
          navigate('/end/`, {
            state: {
              processType: 'unlock',
              status: response.status,
              filename: 'unlocked.pdf',
            },
          });
        }, 1000);
      } else if (response.status === 401) {
        setError('Incorrect password. Please try again.');
      } else {
        console.error('Failed to unlock PDF:', response.statusText);
        setError('Failed to unlock PDF. Please try again.');
      }
    } catch (error) {
      console.error('Error unlocking PDF:', error);
      setError('An error occurred. Please try again.');
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
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Unlock PDF</h2>
          <p className="text-gray-600">Remove password protection from your PDF file.</p>
        </div>
        <div className="flex items-center justify-center h-96 bg-white rounded-lg shadow-md">
          <div className="text-center p-8">
            <AiOutlineLock className="mx-auto text-6xl text-gray-400 mb-4" />
            <p className="text-gray-600 font-semibold mb-2">Password Protected PDF</p>
            <p className="text-sm text-gray-500">Enter password to unlock this file</p>
            <p className="text-xs text-gray-400 mt-4">File: {file.name}</p>
          </div>
        </div>
      </div>

      {/* Right side - Settings */}
      <div className="w-1/2 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto flex flex-col justify-center">
        <div className="max-w-md mx-auto w-full">
          <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-green-500 pb-2 flex items-center">
            <FiUnlock className="mr-2 text-green-500" />
            Unlock PDF
          </h2>

          {/* Password Input */}
          <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
            <label className="block text-sm font-semibold mb-3 text-gray-800">
              Enter PDF Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                placeholder="Enter password"
                className={`w-full px-4 py-3 pr-12 border-2 rounded-lg focus:ring-2 transition-all text-gray-900 font-medium placeholder-gray-400 ${
                  error
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-200'
                    : 'border-gray-300 focus:border-green-500 focus:ring-green-200'
                }`}
                style={{ fontSize: '16px' }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? <AiOutlineEyeInvisible size={20} /> : <AiOutlineEye size={20} />}
              </button>
            </div>
            {error && (
              <p className="text-sm text-red-600 mt-2 flex items-center font-semibold">
                <span className="mr-1">⚠️</span>
                {error}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-2">
              Enter the password that was used to protect this PDF
            </p>
          </div>

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={isProcessing || !password}
            className={`w-full ${
              isProcessing || !password
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 transform hover:scale-105'
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
          >
            {isProcessing ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Unlocking...
              </span>
            ) : (
              <span className="flex items-center justify-center">
                <AiOutlineUnlock className="mr-2 text-xl" />
                Unlock PDF
              </span>
            )}
          </button>

          {/* Help Text */}
          <div className="mt-6 bg-green-50 border-2 border-green-200 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-green-800 mb-2">🔓 About Unlocking</h4>
            <ul className="text-xs text-green-700 space-y-1">
              <li>• Removes password protection</li>
              <li>• Creates an unprotected copy</li>
              <li>• Original file remains unchanged</li>
              <li>• Requires correct password</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UnlockPDF;
