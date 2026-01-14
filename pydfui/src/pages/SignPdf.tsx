import { API_BASE_URL } from '../config';
import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Document, Page, pdfjs } from 'react-pdf';
import { IoAddCircle, IoClose } from 'react-icons/io5';
import { FiUpload } from 'react-icons/fi';
import { BsPencilSquare } from 'react-icons/bs';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs',
  import.meta.url
).toString();

interface Signature {
  id: number;
  x: number;
  y: number;
  pageNum: number;
  reason: string;
  date: string;
}

const SignPdf = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const uploadedFile: File | null = files && files.length > 0 ? files[0] : null;
  
  const [file, setFile] = useState<File | null>(uploadedFile);
  const [signatureImage, setSignatureImage] = useState<File | null>(null);
  const [signaturePreview, setSignaturePreview] = useState<string | null>(null);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [signatures, setSignatures] = useState<Signature[]>([]);
  const [placingSignature, setPlacingSignature] = useState(false);
  const [reason, setReason] = useState<string>('');
  const [signatureDate, setSignatureDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const signatureInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const navigate = useNavigate();

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile && newFile.type === 'application/pdf') {
      setFile(newFile);
      setSignatures([]);
      setCurrentPage(1);
    }
  };

  const handleSignatureImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newFile = event.target.files?.[0];
    if (newFile && (newFile.type === 'image/png' || newFile.type === 'image/jpeg')) {
      setSignatureImage(newFile);
      
      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setSignaturePreview(e.target?.result as string);
      };
      reader.readAsDataURL(newFile);
    }
  };

  const handleAddPdfClick = () => {
    fileInputRef.current?.click();
  };

  const handleAddSignatureClick = () => {
    signatureInputRef.current?.click();
  };

  const handleRemoveFile = () => {
    setFile(null);
    setSignatures([]);
    setCurrentPage(1);
  };

  const handleRemoveSignature = () => {
    setSignatureImage(null);
    setSignaturePreview(null);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= numPages) {
      setCurrentPage(newPage);
    }
  };

  const handlePlaceSignature = () => {
    if (!signatureImage) {
      alert('Please upload a signature image first');
      return;
    }
    setPlacingSignature(true);
  };

  const handlePdfClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!placingSignature || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Add signature at clicked position
    const newSignature: Signature = {
      id: Date.now(),
      x,
      y,
      pageNum: currentPage - 1, // Convert to 0-indexed
      reason,
      date: signatureDate,
    };
    
    setSignatures([...signatures, newSignature]);
    setPlacingSignature(false);
  };

  const handleRemoveSignatureFromList = (id: number) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
  };

  const handleSubmit = async () => {
    if (!file || !signatureImage || signatures.length === 0) {
      alert('Please upload a PDF, signature image, and place at least one signature');
      return;
    }
    
    setLoading(true);

    try {
      // Process each signature
      let currentPdf = file;
      
      for (let i = 0; i < signatures.length; i++) {
        const sig = signatures[i];
        const formData = new FormData();
        formData.append('file', currentPdf);
        formData.append('signature_image', signatureImage);
        formData.append('page_num', sig.pageNum.toString());
        
        // Convert screen coordinates to PDF points
        // Assuming standard scaling - this is approximate
        const scaleX = 612 / (containerRef.current?.offsetWidth || 1); // Letter size width in points
        const scaleY = 792 / (containerRef.current?.offsetHeight || 1); // Letter size height in points
        
        formData.append('x', (sig.x * scaleX).toString());
        formData.append('y', (sig.y * scaleY).toString());
        formData.append('reason', sig.reason);
        formData.append('date', sig.date);

        const response = await fetch(`${API_BASE_URL}/sign_pdf`, {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
          throw new Error(errorData.detail || 'Failed to sign PDF');
        }

        // Get the signed PDF for next iteration
        const blob = await response.blob();
        currentPdf = new File([blob], file.name, { type: 'application/pdf' });
      }

      // Download the final signed PDF
      const url = window.URL.createObjectURL(currentPdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${file.name.replace('.pdf', '')}_signed.pdf`;
      document.body.appendChild(a);
      a.click();

      setTimeout(() => {
        window.URL.revokeObjectURL(url);
        a.remove();

        navigate('/end/', {
          state: {
            processType: 'sign',
            status: 200,
            filename: a.download,
          },
        });
      }, 500);
    } catch (error) {
      console.error('Error while signing PDF:', error);

      navigate('/end/', {
        state: {
          processType: 'sign',
          status: 'error',
          filename: file.name,
          error: error instanceof Error ? error.message : 'Network error occurred',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex w-full h-screen">
      {/* Left side - PDF Preview with Signature Placement */}
      <div className="w-3/4 border-r border-gray-300 p-6 overflow-auto bg-gray-50">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Sign PDF</h2>
          <p className="text-gray-600">
            Upload a PDF and signature image, then click on the PDF to place signatures.
          </p>
        </div>

        {!file && (
          <button
            onClick={handleAddPdfClick}
            className="mb-6 flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-all transform hover:scale-105 shadow-md"
          >
            <IoAddCircle className="text-2xl" />
            Add PDF
          </button>
        )}

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="application/pdf"
          className="hidden"
        />

        <input
          type="file"
          ref={signatureInputRef}
          onChange={handleSignatureImageChange}
          accept="image/png,image/jpeg"
          className="hidden"
        />

        {file && (
          <div className="relative">
            <button
              onClick={handleRemoveFile}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-700 z-20 transition-all shadow-lg"
              aria-label="Remove PDF"
            >
              <IoClose size={20} />
            </button>

            <div className="bg-white rounded-lg shadow-lg p-4">
              {/* Page navigation */}
              {numPages > 1 && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                  <span className="text-gray-700">
                    Page {currentPage} of {numPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === numPages}
                    className="px-3 py-1 bg-blue-500 text-white rounded disabled:bg-gray-300 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </div>
              )}

              {placingSignature && (
                <div className="mb-4 bg-yellow-100 border-2 border-yellow-400 rounded-lg p-3 text-center">
                  <p className="text-yellow-800 font-semibold">
                    Click on the PDF to place the signature
                  </p>
                  <button
                    onClick={() => setPlacingSignature(false)}
                    className="mt-2 px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {/* PDF Preview with Signature Overlay */}
              <div
                ref={containerRef}
                className={`relative inline-block ${placingSignature ? 'cursor-crosshair' : ''}`}
                onClick={handlePdfClick}
              >
                <Document
                  file={file}
                  onLoadSuccess={onDocumentLoadSuccess}
                  className="border-2 border-gray-300"
                >
                  <Page
                    pageNumber={currentPage}
                    renderTextLayer={false}
                    renderAnnotationLayer={false}
                  />
                </Document>

                {/* Signature overlays for current page */}
                {signatures
                  .filter(sig => sig.pageNum === currentPage - 1)
                  .map(sig => (
                    <div
                      key={sig.id}
                      className="absolute border-2 border-blue-500 bg-blue-100 bg-opacity-50 pointer-events-none"
                      style={{
                        left: `${sig.x}px`,
                        top: `${sig.y}px`,
                        width: '200px',
                        height: '80px',
                      }}
                    >
                      <div className="absolute -top-6 left-0 bg-blue-500 text-white px-2 py-1 rounded text-xs">
                        Signature {signatures.indexOf(sig) + 1}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right side - Controls */}
      <div className="w-1/4 bg-gradient-to-b from-gray-50 to-gray-100 p-6 overflow-auto shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b-2 border-blue-500 pb-2">
          Signature Controls
        </h2>

        {/* Signature Image Upload */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Signature Image</h3>
          
          {!signaturePreview ? (
            <button
              onClick={handleAddSignatureClick}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all transform hover:scale-105 flex items-center justify-center gap-2"
            >
              <FiUpload className="text-xl" />
              Upload Signature
            </button>
          ) : (
            <div className="relative">
              <img
                src={signaturePreview}
                alt="Signature preview"
                className="w-full border-2 border-gray-300 rounded-lg"
              />
              <button
                onClick={handleRemoveSignature}
                className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-700"
              >
                <IoClose size={16} />
              </button>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-2">
            Upload PNG or JPG image of your signature
          </p>
        </div>

        {/* Signature Details */}
        <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-3 text-gray-800">Signature Details</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Approved, Reviewed"
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={signatureDate}
              onChange={(e) => setSignatureDate(e.target.value)}
              className="w-full p-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Place Signature Button */}
        <div className="mb-6">
          <button
            onClick={handlePlaceSignature}
            disabled={!file || !signatureImage}
            className={`w-full ${
              !file || !signatureImage
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 transform hover:scale-105'
            } text-white font-bold py-3 px-6 rounded-lg shadow-md transition-all flex items-center justify-center gap-2`}
          >
            <BsPencilSquare className="text-xl" />
            Place Signature
          </button>
        </div>

        {/* Signatures List */}
        {signatures.length > 0 && (
          <div className="mb-6 bg-white p-5 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              Placed Signatures ({signatures.length})
            </h3>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {signatures.map((sig, index) => (
                <div
                  key={sig.id}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded border border-gray-200"
                >
                  <span className="text-sm text-gray-700">
                    Signature {index + 1} - Page {sig.pageNum + 1}
                  </span>
                  <button
                    onClick={() => handleRemoveSignatureFromList(sig.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <IoClose size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="mb-6">
          <button
            onClick={handleSubmit}
            disabled={loading || !file || !signatureImage || signatures.length === 0}
            className={`w-full ${
              loading || !file || !signatureImage || signatures.length === 0
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 transform hover:scale-105'
            } text-white font-bold py-4 px-6 rounded-lg shadow-lg transition-all duration-200`}
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Signing...
              </span>
            ) : (
              'Sign PDF'
            )}
          </button>
        </div>

        {/* Help text */}
        <div className="mt-6 bg-blue-50 border-2 border-blue-200 rounded-lg p-4">
          <h4 className="text-sm font-semibold text-blue-800 mb-2">💡 Tips</h4>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Upload your signature as PNG or JPG</li>
            <li>• Click "Place Signature" then click on PDF</li>
            <li>• Add multiple signatures if needed</li>
            <li>• Navigate pages to sign different pages</li>
            <li>• Fill in reason and date for each signature</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SignPdf;
