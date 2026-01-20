import React, { useState } from 'react';
import { AiOutlineClose, AiOutlineHeart, AiOutlineStar } from 'react-icons/ai';
import { FaTelegram } from 'react-icons/fa';
import { SiCoffeescript } from 'react-icons/si';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  processType?: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, processType }) => {
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showThankYou, setShowThankYou] = useState(false);

  const TELEGRAM_BOT_TOKEN = '8545816354:AAHU5EB46OS1qTNl64mzry57dLGCjvJN3ug';
  const TELEGRAM_CHAT_ID = '-1002468013456'; // Updated with proper chat ID

  const sendToTelegram = async () => {
    setIsSending(true);
    
    const message = `
🔔 New Feedback from PDF Workshop

⭐ Rating: ${rating}/5
📝 Tool Used: ${processType || 'Unknown'}
💬 Feedback: ${feedback || 'No additional feedback'}
🕐 Time: ${new Date().toLocaleString()}
    `.trim();

    try {
      const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: TELEGRAM_CHAT_ID,
          text: message,
          parse_mode: 'HTML',
        }),
      });

      if (response.ok) {
        setShowThankYou(true);
        setTimeout(() => {
          onClose();
          setShowThankYou(false);
          setRating(0);
          setFeedback('');
        }, 2000);
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {showThankYou ? (
          <div className="p-8 text-center">
            <div className="mb-4 text-6xl">🎉</div>
            <h3 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h3>
            <p className="text-gray-600">Your feedback helps us improve PDF Workshop</p>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
              >
                <AiOutlineClose className="text-2xl" />
              </button>
              <h2 className="text-2xl font-bold mb-2">How was your experience?</h2>
              <p className="text-blue-100 text-sm">Your feedback helps us improve!</p>
            </div>

            {/* Content */}
            <div className="p-6">
              {/* Rating */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Rate your experience
                </label>
                <div className="flex justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      className="transition-all transform hover:scale-110"
                    >
                      <AiOutlineStar
                        className={`text-4xl ${
                          star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Feedback Text */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Tell us more (optional)
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="What did you like? What could be better?"
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 resize-none"
                  rows={4}
                />
              </div>

              {/* Submit Button */}
              <button
                onClick={sendToTelegram}
                disabled={rating === 0 || isSending}
                className={`w-full py-3 rounded-lg font-bold text-white transition-all flex items-center justify-center gap-2 ${
                  rating === 0 || isSending
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 transform hover:scale-105'
                }`}
              >
                {isSending ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaTelegram className="text-xl" />
                    Send Feedback
                  </>
                )}
              </button>

              {/* Support Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-center text-sm text-gray-600 mb-3">
                  Love PDF Workshop? Support our work!
                </p>
                <a
                  href="https://buymeacoffee.com/dandev2026"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 rounded-lg font-bold bg-yellow-400 hover:bg-yellow-500 text-gray-900 transition-all flex items-center justify-center gap-2 transform hover:scale-105"
                >
                  <AiOutlineHeart className="text-xl text-red-500" />
                  Buy Me a Coffee
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default FeedbackModal;
