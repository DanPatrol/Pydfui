import { API_BASE_URL } from '../config';
import React, { useState } from 'react';
import { FaLinkedin, FaEnvelope, FaGithub } from 'react-icons/fa`;
import { TbBrandFiverr } from "react-icons/tb";
import { FaSquareUpwork } from 'react-icons/fa6';
import { FiSend, FiMail, FiHeart } from 'react-icons/fi`;

const Footer = () => {
  const [suggestion, setSuggestion] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!suggestion.trim()) {
      setMessage('Please enter a suggestion.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/send-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json`,
        },
        body: JSON.stringify({
          message: suggestion,
        }),
      });

      const data = await response.json();

      if (response.ok && data.message === 'Email sent successfully!') {
        setMessage('Thank you for your suggestion!');
        setSuggestion('');
      } else {
        setMessage('Failed to send your suggestion. Please try again later.');
      }
    } catch (error) {
      console.error('Error sending suggestion:', error);
      setMessage('Failed to send your suggestion. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* About Section */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FiMail className="mr-2 text-blue-400" />
              About PDF Workshop
            </h3>
            <p className="text-gray-300 leading-relaxed mb-4">
              Welcome to PDF Workshop! Your complete PDF management platform where you can easily manage, convert, and optimize your PDF files with just a few clicks.
            </p>
            <div className="flex items-center text-gray-400 text-sm">
              <span>Made with</span>
              <FiHeart className="mx-1 text-red-500 animate-pulse" />
              <span>for PDF lovers</span>
            </div>
          </div>

          {/* Contact Section */}
          <div>
            <h3 className="text-xl font-bold mb-4">Connect With Us</h3>
            <div className="grid grid-cols-2 gap-4">
              <a
                href="https://www.linkedin.com/in/dan-gatobu-012544214/"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 group"
              >
                <FaLinkedin className="text-2xl text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">LinkedIn</span>
              </a>
              <a
                href="https://github.com/DanGatobu"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 group"
              >
                <FaGithub className="text-2xl group-hover:scale-110 transition-transform" />
                <span className="text-sm">GitHub</span>
              </a>
              <a
                href="https://www.upwork.com/freelancers/~01128993ebc1bd665b?referrer_url_path=%2Fnx%2Fsearch%2Ftalent%2Fdetails%2F~01128993ebc1bd665b%2Fprofile"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 group"
              >
                <FaSquareUpwork className="text-2xl text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Upwork</span>
              </a>
              <a
                href="https://www.fiverr.com/dan_new_ton"
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 group"
              >
                <TbBrandFiverr className="text-2xl text-green-400 group-hover:scale-110 transition-transform" />
                <span className="text-sm">Fiverr</span>
              </a>
            </div>
            <a
              href="mailto:rdan99848@gmail.com"
              className="flex items-center gap-2 mt-4 px-4 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-all duration-200 group"
            >
              <FaEnvelope className="text-xl text-yellow-400 group-hover:scale-110 transition-transform" />
              <span className="text-sm">rdan99848@gmail.com</span>
            </a>
          </div>

          {/* Suggestion Box */}
          <div>
            <h3 className="text-xl font-bold mb-4 flex items-center">
              <FiSend className="mr-2 text-purple-400" />
              Suggest Features
            </h3>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <input
                  type="text"
                  placeholder="Your suggestion..."
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full px-6 py-3 rounded-lg font-bold transition-all duration-200 flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 transform hover:scale-105'
                }`}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <FiSend />
                    Submit
                  </>
                )}
              </button>
            </form>
            {message && (
              <p className={`mt-3 text-sm text-center ${message.includes('Thank') ? 'text-green-400' : 'text-red-400'}`}>
                {message}
              </p>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 mt-8 pt-8 text-center">
          <p className="text-gray-400 text-sm">
            &copy; 2024 PDF Workshop. All Rights Reserved. Made with passion for better PDF management.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
