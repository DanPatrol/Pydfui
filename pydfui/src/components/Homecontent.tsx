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
  AiOutlineSafety
} from 'react-icons/ai';
import { FiLayers, FiCrop } from 'react-icons/fi';

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
    title: 'Merge PDF',
    description: 'Merge PDF files in the order that you want with the easiest merger available.',
    href: '/upload/merge',
    icon: <AiOutlineFileText />,
    color: 'text-blue-600',
    gradient: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Split PDF',
    description: 'Split PDF files into multiple files easily.',
    href: '/upload/split',
    icon: <AiOutlineScissor />,
    color: 'text-purple-600',
    gradient: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Remove Pages',
    description: 'Remove unwanted pages from your PDF document.',
    href: '/upload/removepages',
    icon: <AiOutlineDelete />,
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
  },
  {
    title: 'Extract Pages',
    description: 'Extract selected pages from your PDF file.',
    href: '/upload/extract',
    icon: <AiOutlineOrderedList />,
    color: 'text-green-600',
    gradient: 'from-green-500 to-green-600',
  },
  {
    title: 'Organize PDF',
    description: 'Organize and reorder pages in your PDF document.',
    href: '/upload/organize',
    icon: <AiOutlineOrderedList />,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    title: 'Compress PDF',
    description: 'Reduce the file size of your PDFs without compromising quality.',
    href: '/upload/compress',
    icon: <AiOutlineCompress />,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    title: 'Repair PDF',
    description: 'Repair damaged or corrupted PDF files.',
    href: '/upload/repair',
    icon: <AiOutlineTool />,
    color: 'text-yellow-600',
    gradient: 'from-yellow-500 to-yellow-600',
  },
  {
    title: 'WORD to PDF',
    description: 'Convert Word documents to PDF format.',
    href: '/upload/wtpdf',
    icon: <AiOutlineFileWord />,
    color: 'text-blue-700',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF format.',
    href: '/upload/jpegtopdf',
    icon: <AiOutlineFileImage />,
    color: 'text-pink-600',
    gradient: 'from-pink-500 to-pink-600',
  },
  {
    title: 'EXCEL to PDF',
    description: 'Convert Excel spreadsheets to PDF format.',
    href: '/upload/exceltopdf',
    icon: <AiOutlineFileExcel />,
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    title: 'PowerPoint to PDF',
    description: 'Convert PowerPoint presentations to PDF.',
    href: '/pptxtopdf',
    icon: <AiOutlineFilePpt />,
    color: 'text-orange-600',
    gradient: 'from-orange-500 to-orange-600',
  },
  {
    title: 'PDF to PowerPoint',
    description: 'Convert PDF pages to editable PowerPoint slides.',
    href: '/pdftopptx',
    icon: <AiOutlineFilePpt />,
    color: 'text-red-600',
    gradient: 'from-red-500 to-red-600',
  },
  {
    title: 'Rotate PDF',
    description: 'Rotate pages in your PDF document.',
    href: '/upload/rotate',
    icon: <AiOutlineRotateRight />,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-cyan-600',
  },
  {
    title: 'Add Watermark',
    description: 'Add a watermark to your PDF document.',
    href: '/upload/addwatermark',
    icon: <AiOutlineFileProtect />,
    color: 'text-violet-600',
    gradient: 'from-violet-500 to-violet-600',
  },
  {
    title: 'Protect PDF',
    description: 'Add password protection to secure your PDF files.',
    href: '/upload/protect',
    icon: <AiOutlineLock />,
    color: 'text-red-700',
    gradient: 'from-red-600 to-red-700',
  },
  {
    title: 'Sign PDF',
    description: 'Add digital signatures to authenticate your PDF documents.',
    href: '/signpdf',
    icon: <AiOutlineFileProtect />,
    color: 'text-blue-700',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    title: 'Compare PDF',
    description: 'Compare two PDF versions and identify differences.',
    href: '/comparepdf',
    icon: <AiOutlineDiff />,
    color: 'text-purple-700',
    gradient: 'from-purple-600 to-purple-700',
  },
  {
    title: 'Unlock PDF',
    description: 'Remove password protection from your PDF files.',
    href: '/upload/unlock',
    icon: <AiOutlineUnlock />,
    color: 'text-green-700',
    gradient: 'from-green-600 to-green-700',
  },
  {
    title: 'Add Page Numbers',
    description: 'Add page numbers to your PDF document.',
    href: '/pagenumbers',
    icon: <AiOutlineNumber />,
    color: 'text-blue-800',
    gradient: 'from-blue-700 to-blue-800',
  },
  {
    title: 'Remove Blank Pages',
    description: 'Automatically detect and remove blank pages from PDFs.',
    href: '/removeblank',
    icon: <AiOutlineFileUnknown />,
    color: 'text-gray-700',
    gradient: 'from-gray-600 to-gray-700',
  },
  {
    title: 'PDF to Images',
    description: 'Convert PDF pages to JPG or PNG images.',
    href: '/pdftoimage',
    icon: <AiOutlinePicture />,
    color: 'text-indigo-600',
    gradient: 'from-indigo-500 to-indigo-600',
  },
  {
    title: 'Flatten PDF',
    description: 'Convert forms and annotations to static content.',
    href: '/flatten',
    icon: <FiLayers />,
    color: 'text-teal-600',
    gradient: 'from-teal-500 to-teal-600',
  },
  {
    title: 'Edit Metadata',
    description: 'View and edit PDF title, author, and properties.',
    href: '/upload/metadata',
    icon: <AiOutlineInfoCircle />,
    color: 'text-cyan-600',
    gradient: 'from-cyan-500 to-cyan-600',
  },
];

const Homecontent = () => {
  return (
    <div id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      {/* Section header */}
      <div className="text-center mb-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
          All PDF Workshop Tools
        </h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose from our comprehensive suite of PDF tools. Fast, secure, and completely free.
        </p>
      </div>

      {/* Tools grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {pdfTools.map((tool, index) => (
          <a
            key={index}
            href={tool.href}
            className="group block"
          >
            <div className="relative bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 overflow-hidden border border-gray-100 h-full">
              {/* Gradient top border */}
              <div className={`h-1 bg-gradient-to-r ${tool.gradient}`}></div>
              
              {/* Card content */}
              <div className="p-6">
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-lg bg-gradient-to-r ${tool.gradient} text-white text-3xl mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  {tool.icon}
                </div>
                
                {/* Title */}
                <h3 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {tool.title}
                </h3>
                
                {/* Description */}
                <p className="text-gray-600 text-sm leading-relaxed">
                  {tool.description}
                </p>
              </div>

              {/* Hover arrow */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className={`w-8 h-8 rounded-full bg-gradient-to-r ${tool.gradient} flex items-center justify-center text-white`}>
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
