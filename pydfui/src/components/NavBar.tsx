import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGithub, FaLinkedin } from 'react-icons/fa`;
import { FiMenu, FiX, FiFile, FiScissors, FiMinimize2, FiGrid, FiChevronDown } from 'react-icons/fi`;
import { AiOutlineFileImage, AiOutlineFileWord, AiOutlineFileExcel } from 'react-icons/ai`;

const NavBar = () => {
  const [selectedAction, setSelectedAction] = useState('home');
  const [menuOpen, setMenuOpen] = useState(false);
  const [convertDropdown, setConvertDropdown] = useState(false);
  const [allOptionsDropdown, setAllOptionsDropdown] = useState(false);
  const navigate = useNavigate();

  const handleSelection = (action: string) => {
    setSelectedAction(action);
    setMenuOpen(false);
    
    const routes: { [key: string]: string } = {
      home: '/`,
      blog: '/blog`,
      merge: '/upload/merge`,
      split: '/upload/split`,
      compress: '/upload/compress`,
      organize: '/upload/organize`,
      remove: '/upload/removepages`,
      extract: '/upload/extract`,
      rotate: '/upload/rotate`,
      watermark: '/upload/addwatermark`,
      repair: '/upload/repair`,
      jpegtopdf: '/upload/jpegtopdf`,
      wordtopdf: '/upload/wtpdf`,
      exceltopdf: '/upload/exceltopdf`,
    };
    
    if (routes[action]) {
      navigate(routes[action]);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Brand */}
          <div className="flex items-center">
            <button
              onClick={() => handleSelection('home')}
              className="flex items-center space-x-2 text-white hover:text-blue-200 transition-colors"
            >
              <FiFile className="text-2xl" />
              <span className="text-xl font-bold hidden sm:block">PDF Workshop</span>
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1">
            <button
              onClick={() => handleSelection('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedAction === 'home'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Home
            </button>
            
            <button
              onClick={() => handleSelection('merge')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedAction === 'merge'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <FiFile className="text-lg" />
              Merge
            </button>
            
            <button
              onClick={() => handleSelection('split')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedAction === 'split'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <FiScissors className="text-lg" />
              Split
            </button>
            
            <button
              onClick={() => handleSelection('compress')}
              className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-2 ${
                selectedAction === 'compress'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              <FiMinimize2 className="text-lg" />
              Compress
            </button>

            {/* Convert Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setConvertDropdown(true)}
                onMouseLeave={() => setConvertDropdown(false)}
                className="px-4 py-2 rounded-lg font-medium text-white hover:bg-white/10 transition-all flex items-center gap-1"
              >
                Convert
                <FiChevronDown className={`transition-transform ${convertDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {convertDropdown && (
                <div
                  onMouseEnter={() => setConvertDropdown(true)}
                  onMouseLeave={() => setConvertDropdown(false)}
                  className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-xl py-2 animate-fadeIn"
                >
                  <button
                    onClick={() => handleSelection('jpegtopdf')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <AiOutlineFileImage /> JPG to PDF
                  </button>
                  <button
                    onClick={() => handleSelection('wordtopdf')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <AiOutlineFileWord /> Word to PDF
                  </button>
                  <button
                    onClick={() => handleSelection('exceltopdf')}
                    className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 flex items-center gap-2"
                  >
                    <AiOutlineFileExcel /> Excel to PDF
                  </button>
                </div>
              )}
            </div>

            {/* All Options Dropdown */}
            <div className="relative">
              <button
                onMouseEnter={() => setAllOptionsDropdown(true)}
                onMouseLeave={() => setAllOptionsDropdown(false)}
                className="px-4 py-2 rounded-lg font-medium text-white hover:bg-white/10 transition-all flex items-center gap-1"
              >
                <FiGrid />
                More
                <FiChevronDown className={`transition-transform ${allOptionsDropdown ? 'rotate-180' : ''}`} />
              </button>
              
              {allOptionsDropdown && (
                <div
                  onMouseEnter={() => setAllOptionsDropdown(true)}
                  onMouseLeave={() => setAllOptionsDropdown(false)}
                  className="absolute top-full right-0 mt-1 w-48 bg-white rounded-lg shadow-xl py-2 animate-fadeIn"
                >
                  <button onClick={() => handleSelection('organize')} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50">Organize</button>
                  <button onClick={() => handleSelection('remove')} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50">Remove Pages</button>
                  <button onClick={() => handleSelection('extract')} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50">Extract</button>
                  <button onClick={() => handleSelection('rotate')} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50">Rotate</button>
                  <button onClick={() => handleSelection('watermark')} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50">Watermark</button>
                  <button onClick={() => handleSelection('repair')} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50">Repair</button>
                </div>
              )}
            </div>
          </div>

          {/* Social Icons */}
          <div className="hidden lg:flex items-center space-x-4">
            <button
              onClick={() => handleSelection('blog')}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                selectedAction === 'blog'
                  ? 'bg-white text-blue-600 shadow-md'
                  : 'text-white hover:bg-white/10'
              }`}
            >
              Blog
            </button>
            <a
              href="https://github.com/DanGatobu"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-200 transition-colors"
            >
              <FaGithub className="text-2xl" />
            </a>
            <a
              href="https://www.linkedin.com/in/dan-gatobu-012544214/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white hover:text-blue-200 transition-colors"
            >
              <FaLinkedin className="text-2xl" />
            </a>
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="lg:hidden text-white hover:text-blue-200 transition-colors"
          >
            {menuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 space-y-2">
            <button onClick={() => handleSelection('home')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Home</button>
            <button onClick={() => handleSelection('blog')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Blog</button>
            <button onClick={() => handleSelection('merge')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Merge PDF</button>
            <button onClick={() => handleSelection('split')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Split PDF</button>
            <button onClick={() => handleSelection('compress')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Compress PDF</button>
            <button onClick={() => handleSelection('organize')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Organize</button>
            <button onClick={() => handleSelection('remove')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Remove Pages</button>
            
            <div className="border-t border-gray-200 pt-2 mt-2">
              <p className="px-4 py-2 text-sm font-semibold text-gray-500">Convert</p>
              <button onClick={() => handleSelection('jpegtopdf')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">JPG to PDF</button>
              <button onClick={() => handleSelection('wordtopdf')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Word to PDF</button>
              <button onClick={() => handleSelection('exceltopdf')} className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Excel to PDF</button>
            </div>

            <div className="border-t border-gray-200 pt-2 mt-2 flex justify-center space-x-6">
              <a href="https://github.com/DanGatobu" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
                <FaGithub className="text-2xl" />
              </a>
              <a href="https://www.linkedin.com/in/dan-gatobu-012544214/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600">
                <FaLinkedin className="text-2xl" />
              </a>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
