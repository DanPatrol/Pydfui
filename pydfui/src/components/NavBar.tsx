import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaGithub, FaLinkedin } from 'react-icons/fa';
import {
  FiMenu, FiX, FiFile, FiScissors, FiMinimize2, FiGrid, FiChevronDown,
  FiSearch, FiRotateCw, FiShield, FiUnlock, FiEdit, FiTool, FiImage,
  FiType, FiHash, FiLayers, FiFilter, FiEyeOff, FiMaximize2, FiCrop,
  FiArrowDownLeft, FiDroplet, FiGitMerge, FiZap,
} from 'react-icons/fi';
import { AiOutlineFileImage, AiOutlineFileWord, AiOutlineFileExcel, AiOutlineFilePpt, AiOutlineFileText, AiOutlineFilePdf } from 'react-icons/ai';
import { MdCompare, MdDraw, MdOutlineTextFields } from 'react-icons/md';

type Tool = {
  name: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'core' | 'to-pdf' | 'from-pdf' | 'edit' | 'security' | 'other';
  keywords?: string[];
};

// Single source of truth for every tool exposed in the UI.
// Keep in sync with App.tsx <Route> entries.
const TOOLS: Tool[] = [
  // Core
  { name: 'Merge PDF',           path: '/upload/merge',       icon: FiGitMerge,  category: 'core',  keywords: ['combine', 'join'] },
  { name: 'Split PDF',           path: '/upload/split',       icon: FiScissors,  category: 'core',  keywords: ['divide', 'separate'] },
  { name: 'Compress PDF',        path: '/upload/compress',    icon: FiMinimize2, category: 'core',  keywords: ['shrink', 'reduce size'] },
  { name: 'Organize Pages',      path: '/upload/organize',    icon: FiGrid,      category: 'core',  keywords: ['rearrange', 'reorder'] },
  { name: 'Remove Pages',        path: '/upload/removepages', icon: FiX,         category: 'core',  keywords: ['delete pages'] },
  { name: 'Extract Pages',       path: '/upload/extract',     icon: FiFile,      category: 'core',  keywords: ['pages'] },
  { name: 'Rotate PDF',          path: '/upload/rotate',      icon: FiRotateCw,  category: 'core',  keywords: ['turn', 'flip'] },
  { name: 'Remove Blank Pages',  path: '/upload/removeblank', icon: FiEyeOff,    category: 'core',  keywords: ['blank', 'empty'] },
  { name: 'Flatten PDF',         path: '/upload/flatten',     icon: FiLayers,    category: 'core',  keywords: ['flatten forms'] },
  { name: 'Repair PDF',          path: '/upload/repair',      icon: FiTool,      category: 'core',  keywords: ['fix', 'corrupt'] },

  // Convert TO PDF
  { name: 'Word to PDF',         path: '/upload/wtpdf',       icon: AiOutlineFileWord,  category: 'to-pdf', keywords: ['docx', 'doc'] },
  { name: 'Excel to PDF',        path: '/upload/exceltopdf',  icon: AiOutlineFileExcel, category: 'to-pdf', keywords: ['xlsx', 'xls', 'spreadsheet'] },
  { name: 'PowerPoint to PDF',   path: '/pptxtopdf',          icon: AiOutlineFilePpt,   category: 'to-pdf', keywords: ['pptx', 'slides'] },
  { name: 'JPG to PDF',          path: '/upload/jpegtopdf',   icon: AiOutlineFileImage, category: 'to-pdf', keywords: ['jpeg', 'image'] },
  { name: 'PNG to PDF',          path: '/pngtopdf',           icon: AiOutlineFileImage, category: 'to-pdf', keywords: ['image'] },
  { name: 'HTML to PDF',         path: '/htmltopdf',          icon: AiOutlineFileText,  category: 'to-pdf', keywords: ['webpage', 'html'] },
  { name: 'TXT to PDF',          path: '/txttopdf',           icon: MdOutlineTextFields, category: 'to-pdf', keywords: ['text', 'plain'] },
  { name: 'Markdown to PDF',     path: '/markdowntopdf',      icon: MdOutlineTextFields, category: 'to-pdf', keywords: ['md'] },

  // Convert FROM PDF
  { name: 'PDF to Word',         path: '/pdftoword',          icon: AiOutlineFileWord,  category: 'from-pdf', keywords: ['docx'] },
  { name: 'PDF to Excel',        path: '/pdftoexcel',         icon: AiOutlineFileExcel, category: 'from-pdf', keywords: ['xlsx', 'tables'] },
  { name: 'PDF to PowerPoint',   path: '/pdftopptx',          icon: AiOutlineFilePpt,   category: 'from-pdf', keywords: ['pptx', 'slides'] },
  { name: 'PDF to Text',         path: '/pdftotext',          icon: AiOutlineFileText,  category: 'from-pdf', keywords: ['plain text'] },
  { name: 'PDF to HTML',         path: '/pdftohtml',          icon: AiOutlineFileText,  category: 'from-pdf', keywords: ['webpage'] },
  { name: 'PDF to CSV',          path: '/pdftocsv',           icon: AiOutlineFileExcel, category: 'from-pdf', keywords: ['comma', 'tables'] },
  { name: 'PDF to JPG',          path: '/pdftojpg',           icon: AiOutlineFileImage, category: 'from-pdf', keywords: ['jpeg', 'image'] },
  { name: 'PDF to PNG',          path: '/pdftopng',           icon: AiOutlineFileImage, category: 'from-pdf', keywords: ['image'] },
  { name: 'PDF to Images',       path: '/upload/pdftoimage',  icon: FiImage,            category: 'from-pdf', keywords: ['extract images'] },
  { name: 'PDF to PDF/A',        path: '/pdftopdf-a',         icon: AiOutlineFilePdf,   category: 'from-pdf', keywords: ['archive', 'iso'] },

  // Edit / Annotate
  { name: 'Edit PDF',            path: '/editpdf',            icon: FiEdit,      category: 'edit', keywords: ['annotate', 'edit'] },
  { name: 'Add Watermark',       path: '/upload/addwatermark', icon: FiDroplet,  category: 'edit', keywords: ['stamp'] },
  { name: 'Page Numbers',        path: '/upload/pagenumbers', icon: FiHash,      category: 'edit', keywords: ['numbering'] },
  { name: 'Header & Footer',     path: '/headerfooter',       icon: FiType,      category: 'edit', keywords: ['footer', 'header'] },
  { name: 'Crop PDF',            path: '/croppdf',            icon: FiCrop,      category: 'edit', keywords: ['trim margins'] },
  { name: 'Resize Pages',        path: '/resizepdf',          icon: FiMaximize2, category: 'edit', keywords: ['dimensions'] },
  { name: 'Reverse Order',       path: '/reversepdf',         icon: FiArrowDownLeft, category: 'edit', keywords: ['reverse pages'] },
  { name: 'Grayscale PDF',       path: '/grayscalepdf',       icon: FiFilter,    category: 'edit', keywords: ['black white', 'bw'] },
  { name: 'Web Optimize',        path: '/weboptimize',        icon: FiZap,       category: 'edit', keywords: ['linearize', 'fast web'] },
  { name: 'Edit Metadata',       path: '/upload/metadata',    icon: FiEdit,      category: 'edit', keywords: ['author', 'title', 'info'] },
  { name: 'Extract Images',      path: '/extractimages',      icon: FiImage,     category: 'edit', keywords: ['images from pdf'] },
  { name: 'OCR PDF',             path: '/ocrpdf',             icon: MdOutlineTextFields, category: 'edit', keywords: ['scan', 'searchable'] },

  // Security
  { name: 'Protect PDF',         path: '/upload/protect',     icon: FiShield,    category: 'security', keywords: ['password', 'encrypt'] },
  { name: 'Unlock PDF',          path: '/upload/unlock',      icon: FiUnlock,    category: 'security', keywords: ['remove password'] },
  { name: 'Sign PDF',            path: '/signpdf',            icon: MdDraw,      category: 'security', keywords: ['signature'] },
  { name: 'Redact PDF',          path: '/redactpdf',          icon: FiEyeOff,    category: 'security', keywords: ['hide', 'censor'] },
  { name: 'Compare PDFs',        path: '/comparepdf',         icon: MdCompare,   category: 'security', keywords: ['diff'] },
];

const CATEGORY_LABEL: Record<Tool['category'], string> = {
  core: 'Core',
  'to-pdf': 'Convert TO PDF',
  'from-pdf': 'Convert FROM PDF',
  edit: 'Edit & Annotate',
  security: 'Security',
  other: 'Other',
};

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [convertDropdown, setConvertDropdown] = useState(false);
  const [allOptionsDropdown, setAllOptionsDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const convertRef = useRef<HTMLDivElement>(null);
  const moreRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdowns when clicking outside them or pressing Escape
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (convertRef.current && !convertRef.current.contains(e.target as Node)) {
        setConvertDropdown(false);
      }
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setAllOptionsDropdown(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setConvertDropdown(false);
        setAllOptionsDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  // Global `/` keyboard shortcut to focus search (like GitHub / Slack)
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      if (e.key === '/' && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        searchRef.current?.focus();
      } else if (e.key === 'Escape' && searchFocused) {
        searchRef.current?.blur();
        setSearchQuery('');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [searchFocused]);

  const goto = (path: string) => {
    setMenuOpen(false);
    setConvertDropdown(false);
    setAllOptionsDropdown(false);
    setSearchQuery('');
    searchRef.current?.blur();
    navigate(path);
  };

  // Filter tools by name + keyword match (case-insensitive)
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return TOOLS.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.keywords?.some(k => k.toLowerCase().includes(q)) ||
      CATEGORY_LABEL[t.category].toLowerCase().includes(q),
    ).slice(0, 8);
  }, [searchQuery]);

  const toolsByCategory = useMemo(() => {
    const out: Record<Tool['category'], Tool[]> = { core: [], 'to-pdf': [], 'from-pdf': [], edit: [], security: [], other: [] };
    TOOLS.forEach(t => out[t.category].push(t));
    return out;
  }, []);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">

          {/* Logo */}
          <button
            onClick={() => goto('/')}
            className="flex items-center space-x-2 text-gray-900 hover:text-blue-600 transition-colors shrink-0"
          >
            <FiFile className="text-2xl" />
            <span className="text-xl font-bold hidden sm:block">PDF Workshop</span>
          </button>

          {/* Search input — visible on md+ */}
          <div className="relative flex-1 max-w-md hidden md:block">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setTimeout(() => setSearchFocused(false), 150)}
              placeholder="Search tools... ( / )"
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-y-auto z-50">
                {searchResults.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button
                      key={t.path}
                      onMouseDown={(e) => { e.preventDefault(); goto(t.path); }}
                      className="w-full px-4 py-2 text-left hover:bg-blue-50 flex items-center gap-3"
                    >
                      <Icon className="text-gray-500 shrink-0" />
                      <div className="flex-1">
                        <div className="text-sm text-gray-900">{t.name}</div>
                        <div className="text-xs text-gray-500">{CATEGORY_LABEL[t.category]}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
            {searchQuery && searchResults.length === 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl p-4 text-sm text-gray-500">
                No tools match "{searchQuery}"
              </div>
            )}
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-1 shrink-0">
            <button onClick={() => goto('/')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Home</button>
            <button onClick={() => goto('/upload/merge')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Merge</button>
            <button onClick={() => goto('/upload/split')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Split</button>
            <button onClick={() => goto('/upload/compress')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Compress</button>

            {/* Convert dropdown */}
            <div className="relative" ref={convertRef}>
              <button
                onClick={() => { setConvertDropdown(!convertDropdown); setAllOptionsDropdown(false); }}
                aria-expanded={convertDropdown}
                aria-haspopup="true"
                className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1 rounded-lg ${
                  convertDropdown ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                Convert <FiChevronDown className={`transition-transform ${convertDropdown ? 'rotate-180' : ''}`} />
              </button>
              {convertDropdown && (
                <div className="absolute top-full left-0 w-72 bg-white rounded-lg shadow-xl py-2 animate-fadeIn max-h-[32rem] overflow-y-auto border border-gray-100">
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Convert TO PDF</div>
                  {toolsByCategory['to-pdf'].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.path} onClick={() => goto(t.path)} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 flex items-center gap-2 text-sm">
                        <Icon /> {t.name}
                      </button>
                    );
                  })}
                  <div className="border-t border-gray-200 my-1"></div>
                  <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">Convert FROM PDF</div>
                  {toolsByCategory['from-pdf'].map((t) => {
                    const Icon = t.icon;
                    return (
                      <button key={t.path} onClick={() => goto(t.path)} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 flex items-center gap-2 text-sm">
                        <Icon /> {t.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* All tools dropdown */}
            <div className="relative" ref={moreRef}>
              <button
                onClick={() => { setAllOptionsDropdown(!allOptionsDropdown); setConvertDropdown(false); }}
                aria-expanded={allOptionsDropdown}
                aria-haspopup="true"
                className={`px-3 py-2 text-sm font-medium transition-all flex items-center gap-1 rounded-lg ${
                  allOptionsDropdown ? 'text-blue-600 bg-blue-50' : 'text-gray-700 hover:text-blue-600'
                }`}
              >
                <FiGrid /> More <FiChevronDown className={`transition-transform ${allOptionsDropdown ? 'rotate-180' : ''}`} />
              </button>
              {allOptionsDropdown && (
                <div className="absolute top-full right-0 w-72 bg-white rounded-lg shadow-xl py-2 animate-fadeIn max-h-[32rem] overflow-y-auto border border-gray-100">
                  {(['edit', 'security', 'core'] as const).map(cat => (
                    <div key={cat}>
                      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase">{CATEGORY_LABEL[cat]}</div>
                      {toolsByCategory[cat].map((t) => {
                        const Icon = t.icon;
                        return (
                          <button key={t.path} onClick={() => goto(t.path)} className="w-full px-4 py-2 text-left text-gray-700 hover:bg-blue-50 flex items-center gap-2 text-sm">
                            <Icon /> {t.name}
                          </button>
                        );
                      })}
                      <div className="border-t border-gray-200 my-1"></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={() => goto('/blog')} className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-blue-600">Blog</button>
          </div>

          {/* Social + mobile menu */}
          <div className="hidden lg:flex items-center space-x-3 shrink-0">
            <a href="https://github.com/DanGatobu" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600"><FaGithub className="text-xl" /></a>
            <a href="https://www.linkedin.com/in/dan-gatobu-012544214/" target="_blank" rel="noopener noreferrer" className="text-gray-500 hover:text-blue-600"><FaLinkedin className="text-xl" /></a>
          </div>
          <button onClick={() => setMenuOpen(!menuOpen)} className="lg:hidden text-gray-600 hover:text-blue-600">
            {menuOpen ? <FiX className="text-2xl" /> : <FiMenu className="text-2xl" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-white border-t border-gray-200 shadow-lg">
          <div className="px-4 py-3 max-h-[calc(100vh-4rem)] overflow-y-auto">
            {/* Mobile search */}
            <div className="relative mb-3 md:hidden">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search tools..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {searchQuery ? (
              <div className="space-y-1">
                {searchResults.length > 0 ? searchResults.map((t) => {
                  const Icon = t.icon;
                  return (
                    <button key={t.path} onClick={() => goto(t.path)} className="w-full px-3 py-2 text-left hover:bg-blue-50 rounded-lg flex items-center gap-2">
                      <Icon className="text-gray-500" />
                      <span className="text-sm">{t.name}</span>
                    </button>
                  );
                }) : <div className="p-4 text-sm text-gray-500">No tools match "{searchQuery}"</div>}
              </div>
            ) : (
              <div className="space-y-2">
                <button onClick={() => goto('/')} className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Home</button>
                <button onClick={() => goto('/blog')} className="w-full text-left px-3 py-2 text-gray-700 hover:bg-blue-50 rounded-lg">Blog</button>

                {(['core', 'to-pdf', 'from-pdf', 'edit', 'security'] as const).map(cat => (
                  <div key={cat} className="border-t border-gray-200 pt-2">
                    <p className="px-2 py-2 text-xs font-semibold text-gray-500 uppercase">{CATEGORY_LABEL[cat]}</p>
                    {toolsByCategory[cat].map((t) => {
                      const Icon = t.icon;
                      return (
                        <button key={t.path} onClick={() => goto(t.path)} className="w-full px-3 py-2 text-left text-gray-700 hover:bg-blue-50 rounded-lg flex items-center gap-2 text-sm">
                          <Icon /> {t.name}
                        </button>
                      );
                    })}
                  </div>
                ))}

                <div className="border-t border-gray-200 pt-2 flex justify-center space-x-6">
                  <a href="https://github.com/DanGatobu" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600"><FaGithub className="text-2xl" /></a>
                  <a href="https://www.linkedin.com/in/dan-gatobu-012544214/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-blue-600"><FaLinkedin className="text-2xl" /></a>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
