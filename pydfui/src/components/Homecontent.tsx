import { useState } from 'react';
import {
  AiOutlineRotateRight,
  AiOutlineFileProtect,
  AiOutlineScissor,
  AiOutlineDelete,
  AiOutlineOrderedList,
  AiOutlineCompress,
  AiOutlineTool,
  AiOutlineFileImage,
  AiOutlineFileWord,
  AiOutlineFileExcel,
  AiOutlineFileText,
  AiOutlineLock,
  AiOutlineUnlock,
  AiOutlineNumber,
  AiOutlineFileUnknown,
  AiOutlinePicture,
  AiOutlineInfoCircle,
  AiOutlineFilePpt,
  AiOutlineEdit,
  AiOutlineFileAdd,
  AiOutlineDiff,
  AiOutlineEyeInvisible,
  AiOutlineSafety,
  AiOutlineSwap,
  AiOutlineExpandAlt,
  AiOutlineAlignCenter,
  AiOutlineGlobal,
  AiOutlineScan,
  AiOutlineTable,
  AiOutlineFileMarkdown,
} from 'react-icons/ai';
import { FiLayers, FiCrop, FiCode, FiMaximize } from 'react-icons/fi';

interface PDFTool {
  title: string;
  description: string;
  href: string;
  icon: JSX.Element;
  color: string;
  gradient: string;
}

const pdfTools: PDFTool[] = [
  {
    title: 'Edit PDF',
    description: 'Draw, annotate, add text, shapes, and highlights to your PDF.',
    href: '/upload/editpdf',
    icon: <AiOutlineEdit />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Merge PDF',
    description: 'Merge PDF files in the order that you want with the easiest merger available.',
    href: '/upload/merge',
    icon: <AiOutlineFileText />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Split PDF',
    description: 'Split PDF files into multiple files easily.',
    href: '/upload/split',
    icon: <AiOutlineScissor />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Remove Pages',
    description: 'Remove unwanted pages from your PDF document.',
    href: '/upload/removepages',
    icon: <AiOutlineDelete />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Extract Pages',
    description: 'Extract selected pages from your PDF file.',
    href: '/upload/extract',
    icon: <AiOutlineOrderedList />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Organize PDF',
    description: 'Organize and reorder pages in your PDF document.',
    href: '/upload/organize',
    icon: <AiOutlineOrderedList />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Compress PDF',
    description: 'Reduce the file size of your PDFs without compromising quality.',
    href: '/upload/compress',
    icon: <AiOutlineCompress />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Repair PDF',
    description: 'Repair damaged or corrupted PDF files.',
    href: '/upload/repair',
    icon: <AiOutlineTool />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'WORD to PDF',
    description: 'Convert Word documents to PDF format.',
    href: '/upload/wtpdf',
    icon: <AiOutlineFileWord />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF format.',
    href: '/upload/jpegtopdf',
    icon: <AiOutlineFileImage />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'EXCEL to PDF',
    description: 'Convert Excel spreadsheets to PDF format.',
    href: '/upload/exceltopdf',
    icon: <AiOutlineFileExcel />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF.',
    href: '/upload/pptxtopdf',
    icon: <AiOutlineFilePpt />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to PowerPoint',
    description: 'Convert PDF pages to editable PowerPoint slides.',
    href: '/upload/pdftopptx',
    icon: <AiOutlineFilePpt />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Rotate PDF',
    description: 'Rotate pages in your PDF document.',
    href: '/upload/rotate',
    icon: <AiOutlineRotateRight />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Add Watermark',
    description: 'Add a watermark to your PDF document.',
    href: '/upload/addwatermark',
    icon: <AiOutlineFileProtect />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Protect PDF',
    description: 'Add password protection to secure your PDF files.',
    href: '/upload/protect',
    icon: <AiOutlineLock />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Sign PDF',
    description: 'Add digital signatures to authenticate your PDF documents.',
    href: '/upload/signpdf',
    icon: <AiOutlineFileProtect />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Compare PDF',
    description: 'Compare two PDF versions and identify differences.',
    href: '/upload/comparepdf',
    icon: <AiOutlineDiff />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Unlock PDF',
    description: 'Remove password protection from your PDF files.',
    href: '/upload/unlock',
    icon: <AiOutlineUnlock />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Add Page Numbers',
    description: 'Add page numbers to your PDF document.',
    href: '/upload/pagenumbers',
    icon: <AiOutlineNumber />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Remove Blank Pages',
    description: 'Automatically detect and remove blank pages from PDFs.',
    href: '/upload/removeblank',
    icon: <AiOutlineFileUnknown />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to Images',
    description: 'Convert PDF pages to JPG or PNG images.',
    href: '/upload/pdftoimage',
    icon: <AiOutlinePicture />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Flatten PDF',
    description: 'Convert forms and annotations to static content.',
    href: '/upload/flatten',
    icon: <FiLayers />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Edit Metadata',
    description: 'View and edit PDF title, author, and properties.',
    href: '/upload/metadata',
    icon: <AiOutlineInfoCircle />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  // ===== NEW TOOLS =====
  {
    title: 'PDF to Word',
    description: 'Convert PDF documents to editable Word (DOCX) format.',
    href: '/pdftoword',
    icon: <AiOutlineFileWord />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to Excel',
    description: 'Extract tables from PDF and convert to Excel spreadsheets.',
    href: '/pdftoexcel',
    icon: <AiOutlineFileExcel />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to Text',
    description: 'Extract all text content from your PDF document.',
    href: '/upload/pdftotext',
    icon: <AiOutlineFileText />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to JPG',
    description: 'Convert PDF pages to high-quality JPG images.',
    href: '/upload/pdftojpg',
    icon: <AiOutlineFileImage />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to PNG',
    description: 'Convert PDF pages to crisp PNG images.',
    href: '/upload/pdftopng',
    icon: <AiOutlineFileImage />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to HTML',
    description: 'Convert PDF documents to HTML web format.',
    href: '/upload/pdftohtml',
    icon: <FiCode />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to CSV',
    description: 'Extract tabular data from PDF to CSV spreadsheet format.',
    href: '/upload/pdftocsv',
    icon: <AiOutlineTable />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'HTML to PDF',
    description: 'Convert HTML files to PDF format.',
    href: '/htmltopdf',
    icon: <FiCode />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PNG to PDF',
    description: 'Convert PNG images to PDF format.',
    href: '/pngtopdf',
    icon: <AiOutlinePicture />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Text to PDF',
    description: 'Convert plain text files to PDF format.',
    href: '/txttopdf',
    icon: <AiOutlineFileText />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Markdown to PDF',
    description: 'Convert Markdown files to beautifully formatted PDFs.',
    href: '/markdowntopdf',
    icon: <AiOutlineFileMarkdown />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'PDF to PDF/A',
    description: 'Convert to archival PDF/A format for long-term preservation.',
    href: '/pdftopdf-a',
    icon: <AiOutlineSafety />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Crop PDF',
    description: 'Crop and trim margins from your PDF pages.',
    href: '/upload/croppdf',
    icon: <FiCrop />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Redact PDF',
    description: 'Permanently remove sensitive text from your PDF.',
    href: '/upload/redactpdf',
    icon: <AiOutlineEyeInvisible />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Grayscale PDF',
    description: 'Convert your color PDF to black and white to save ink.',
    href: '/upload/grayscale',
    icon: <AiOutlineFileImage />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Reverse PDF Pages',
    description: 'Reverse the page order of your PDF document.',
    href: '/upload/reverse',
    icon: <AiOutlineSwap />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Change Page Size',
    description: 'Resize PDF pages to A4, Letter, Legal, A3, or A5.',
    href: '/upload/resizepdf',
    icon: <FiMaximize />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Add Header & Footer',
    description: 'Add custom headers and footers to your PDF pages.',
    href: '/upload/headerfooter',
    icon: <AiOutlineAlignCenter />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Extract Images',
    description: 'Extract all embedded images from your PDF document.',
    href: '/upload/extractimages',
    icon: <AiOutlinePicture />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Web-Optimize PDF',
    description: 'Optimize PDF for fast web viewing and downloading.',
    href: '/upload/weboptimize',
    icon: <AiOutlineGlobal />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'OCR PDF',
    description: 'Make scanned PDFs searchable with OCR text recognition.',
    href: '/upload/ocrpdf',
    icon: <AiOutlineScan />,
    color: 'text-blue-600',
    gradient: 'from-blue-600 to-blue-700',
  },
];

const Homecontent = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTools = searchQuery.trim()
    ? pdfTools.filter(
        (tool) =>
          tool.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          tool.description.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : pdfTools;

  return (
    <div id="features" className="max-w-7xl mx-auto p-3 sm:p-4 md:p-6 py-8 sm:py-12 md:py-16">
      {/* Section header */}
      <div className="text-center mb-8 sm:mb-10 md:mb-12">
        <h2 className="text-2xl xs:text-3xl sm:text-4xl font-bold text-gray-900 mb-3 sm:mb-4">
          All PDF Workshop Tools
        </h2>
        <p className="text-sm sm:text-base md:text-lg text-gray-600 max-w-2xl mx-auto">
          Choose from our comprehensive suite of PDF tools. Fast, secure, and completely free.
        </p>
      </div>

      {/* Search bar */}
      <div className="max-w-md mx-auto mb-6 sm:mb-8">
        <div className="relative">
          <AiOutlineFileText className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tools... (e.g. merge, compress, convert)"
            className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-xs text-gray-500 mt-2 text-center">
            {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''} found
          </p>
        )}
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
        {filteredTools.map((tool, index) => (
          <a
            key={index}
            href={tool.href}
            className="group block"
          >
            <div className="relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 sm:hover:-translate-y-2 overflow-hidden border border-gray-100 h-full">
              {/* Gradient top border */}
              <div className={`h-1 bg-gradient-to-r ${tool.gradient}`}></div>
              
              {/* Card content */}
              <div className="p-3 sm:p-4 md:p-6">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 rounded-lg bg-gradient-to-r ${tool.gradient} text-white text-xl sm:text-2xl md:text-3xl mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {tool.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-base sm:text-lg md:text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {tool.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-2 sm:bottom-3 md:bottom-4 right-2 sm:right-3 md:right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r ${tool.gradient} flex items-center justify-center text-white text-sm sm:text-base`}>
                  →
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

export default Homecontent;
