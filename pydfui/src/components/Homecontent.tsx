
import { Card } from 'react-bootstrap';
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
  AiOutlineFileText
} from 'react-icons/ai';

interface PDFTool {
  title: string;
  description: string;
  href: string;
  icon: JSX.Element;
}

const pdfTools: PDFTool[] = [
  {
    title: 'Merge PDF',
    description: 'Merge PDF files in the order that you want with the easiest merger available.',
    href: '/upload/merge',
    icon: <AiOutlineFileText />,
  },
  {
    title: 'Split PDF',
    description: 'Split PDF files into multiple files easily.',
    href: '/upload/split',
    icon: <AiOutlineScissor />,
  },
  {
    title: 'Remove Pages',
    description: 'Remove unwanted pages from your PDF document.',
    href: '/upload/removepages',
    icon: <AiOutlineDelete />,
  },
  {
    title: 'Extract Pages',
    description: 'Extract selected pages from your PDF file.',
    href: '/upload/extract',
    icon: <AiOutlineOrderedList />,
  },
  {
    title: 'Organize PDF',
    description: 'Organize and reorder pages in your PDF document.',
    href: '/upload/organize',
    icon: <AiOutlineOrderedList />,
  },
  {
    title: 'Compress PDF',
    description: 'Reduce the file size of your PDFs without compromising quality.',
    href: '/upload/compress',
    icon: <AiOutlineCompress />,
  },
  {
    title: 'Repair PDF',
    description: 'Repair damaged or corrupted PDF files.',
    href: '/upload/repair',
    icon: <AiOutlineTool />,
  },
  {
    title: 'WORD to PDF',
    description: 'Convert Word documents to PDF format.',
    href: '/upload/wtpdf',
    icon: <AiOutlineFileWord />,
  },
  {
    title: 'JPG to PDF',
    description: 'Convert JPG images to PDF format.',
    href: '/upload/jpegtopdf',
    icon: <AiOutlineFileImage />,
  },
  {
    title: 'EXCEL to PDF',
    description: 'Convert Excel spreadsheets to PDF format.',
    href: '/upload/exceltopdf',
    icon: <AiOutlineFileExcel />,
  },
  {
    title: 'Rotate PDF',
    description: 'Rotate pages in your PDF document.',
    href: '/upload/rotate',
    icon: <AiOutlineRotateRight />,
  },
  {
    title: 'Add Watermark',
    description: 'Add a watermark to your PDF document.',
    href: '/upload/addwatermark',
    icon: <AiOutlineFileProtect />,
  },
  
  // {
  //   title: 'Unlock PDF',
  //   description: 'Remove security restrictions from your PDF.',
  //   href: '/unlock_pdf',
  //   icon: <AiOutlineLock />,
  // },
  // {
  //   title: 'Sign PDF',
  //   description: 'Add an electronic signature to your PDF.',
  //   href: '/sign-pdf',
  //   icon: <AiOutlineFileDone />,
  // },
  
];

const Homecontent = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
      {pdfTools.map((tool, index) => (
        <a
          key={index}
          href={tool.href}
          className="hover:no-underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Card
            className="shadow-lg rounded-lg overflow-hidden transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            style={{ width: '100%', height: '100%' }}
          >
            <Card.Body className="relative p-4">
              {/* Icon at the top-left corner */}
              <div className="absolute top-3 left-3 text-3xl text-indigo-600">
                {tool.icon}
              </div>
              {/* Card Content */}
              <div className="pt-10">
                <Card.Title className="font-bold text-lg mb-2 text-gray-800">{tool.title}</Card.Title>
                <Card.Text className="text-gray-600 text-sm">{tool.description}</Card.Text>
              </div>
            </Card.Body>
          </Card>
        </a>
      ))}
    </div>
  );
};

export default Homecontent;
