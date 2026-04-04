import './App.css';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import NavBar from './components/NavBar';
import UploadFile from './components/UploadFile';

import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

import Ajusterlist from './components/Ajusterlist';
import Homepage from './pages/Homepage';
import Splitpage from './pages/Splitpage';
import Compress from './pages/Compress';
import Removepages from './pages/Removepages';
import Extract from './pages/Extract';
import Organize from './pages/Organize';
import Endpage from './pages/Endpage';
import Rotate from './pages/Rotate';
import Watermark from './pages/Watermark';
import Footter from './components/Footer';
import BatchPreview from './pages/BatchPreview';
import ProtectPDF from './pages/ProtectPDF';
import UnlockPDF from './pages/UnlockPDF';
import PageNumbers from './pages/PageNumbers';
import RemoveBlankPages from './pages/RemoveBlankPages';
import PdfToImage from './pages/PdfToImage';
import FlattenPDF from './pages/FlattenPDF';
import MetadataEditor from './pages/MetadataEditor';
import BlogList from './pages/BlogList';
import BlogPost from './pages/BlogPost';
import SignPdf from './pages/SignPdf';
import PowerPointToPdf from './pages/PowerPointToPdf';
import PdfToPowerPoint from './pages/PdfToPowerPoint';
import ComparePdf from './pages/ComparePdf';
import PdfToExcel from './pages/PdfToExcel';
import PdfToWord from './pages/PdfToWord';
import HtmlToPdf from './pages/HtmlToPdf';
import CropPdf from './pages/CropPdf';
import RedactPdf from './pages/RedactPdf';
import PdfToPdfA from './pages/PdfToPdfA';
import PdfToText from './pages/PdfToText';
import GrayscalePdf from './pages/GrayscalePdf';
import ReversePdf from './pages/ReversePdf';
import ResizePdfPages from './pages/ResizePdfPages';
import AddHeaderFooter from './pages/AddHeaderFooter';
import ExtractImages from './pages/ExtractImages';
import PdfToHtml from './pages/PdfToHtml';
import WebOptimizePdf from './pages/WebOptimizePdf';
import OcrPdf from './pages/OcrPdf';
import PdfToCsv from './pages/PdfToCsv';
import TxtToPdf from './pages/TxtToPdf';
import MarkdownToPdf from './pages/MarkdownToPdf';
import PngToPdf from './pages/PngToPdf';
import PdfToJpg from './pages/PdfToJpg';
import PdfToPng from './pages/PdfToPng';
import EditPdf from './pages/EditPdf';

const AppContent = () => {
  const location = useLocation();

  const handleReorder = (newOrder: React.ReactNode[]) => {
    console.log('New Order:', newOrder);
  };

  // Hide footer on preview/editing pages
  const hideFooterRoutes = [
    '/preview', '/split', '/compress', '/removepages', '/extractpages',
    '/organizepages', '/rotate', '/addwatermark', '/batch-preview',
    '/protect', '/unlock', '/pagenumbers', '/removeblank', '/pdftoimage',
    '/flatten', '/metadata', '/signpdf', '/pptxtopdf', '/pdftopptx',
    '/comparepdf', '/pdftoexcel', '/pdftoword', '/htmltopdf', '/croppdf',
    '/redactpdf', '/pdftopdf-a', '/pdftotext', '/grayscalepdf',
    '/reversepdf', '/resizepdf', '/headerfooter', '/extractimages',
    '/pdftohtml', '/weboptimize', '/ocrpdf', '/pdftocsv', '/txttopdf',
    '/markdowntopdf', '/pngtopdf', '/pdftojpg', '/pdftopng', '/editpdf',
  ];
  const shouldShowFooter = !hideFooterRoutes.includes(location.pathname);

  return (
    <div className="overflow-x-hidden text-gray-900 antialiased selection:bg-blue-100 selection:text-blue-900">
      {/* Background applied to the full page */}
      <div className="min-h-screen bg-white">
        {/* Adjusting container to take full width and reducing padding */}
        <div className="w-full mx-auto px-4">
          <NavBar />

            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/upload/:action" element={<UploadFile />} />
              <Route
                path="/preview"
                element={
                  <DndProvider backend={HTML5Backend}>
                    <Ajusterlist onReorder={handleReorder} />
                  </DndProvider>
                }
              />
              <Route
                path="/split"
                element={
                  <DndProvider backend={HTML5Backend}>
                    <Splitpage onReorder={handleReorder} />
                  </DndProvider>
                }
              />
              <Route
                path="/compress"
                element={
                  <DndProvider backend={HTML5Backend}>
                    <Compress onReorder={handleReorder} />
                  </DndProvider>
                }
              />
              <Route
                path="/removepages"
                element={
                  <DndProvider backend={HTML5Backend}>
                    <Removepages />
                  </DndProvider>
                }
              />
              <Route
                path="/extractpages"
                element={
                  <DndProvider backend={HTML5Backend}>
                    <Extract />
                  </DndProvider>
                }
              />
              <Route
                path="/organizepages"
                element={
                  <DndProvider backend={HTML5Backend}>
                    <Organize />
                  </DndProvider>
                }
              />
              <Route path="/end/:action?" element={<Endpage />} />
              <Route path="/rotate" element={<Rotate />} />
              <Route path="/addwatermark" element={<Watermark />} />
              <Route path="/batch-preview" element={<BatchPreview />} />
              <Route path="/protect" element={<ProtectPDF />} />
              <Route path="/unlock" element={<UnlockPDF />} />
              <Route path="/pagenumbers" element={<PageNumbers />} />
              <Route path="/removeblank" element={<RemoveBlankPages />} />
              <Route path="/pdftoimage" element={<PdfToImage />} />
              <Route path="/flatten" element={<FlattenPDF />} />
              <Route path="/metadata" element={<MetadataEditor />} />
              <Route path="/signpdf" element={<SignPdf />} />
              <Route path="/pptxtopdf" element={<PowerPointToPdf />} />
              <Route path="/pdftopptx" element={<PdfToPowerPoint />} />
              <Route path="/comparepdf" element={<ComparePdf />} />
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />

              {/* New tool routes */}
              <Route path="/pdftoexcel" element={<PdfToExcel />} />
              <Route path="/pdftoword" element={<PdfToWord />} />
              <Route path="/htmltopdf" element={<HtmlToPdf />} />
              <Route path="/croppdf" element={<CropPdf />} />
              <Route path="/redactpdf" element={<RedactPdf />} />
              <Route path="/pdftopdf-a" element={<PdfToPdfA />} />
              <Route path="/pdftotext" element={<PdfToText />} />
              <Route path="/grayscalepdf" element={<GrayscalePdf />} />
              <Route path="/reversepdf" element={<ReversePdf />} />
              <Route path="/resizepdf" element={<ResizePdfPages />} />
              <Route path="/headerfooter" element={<AddHeaderFooter />} />
              <Route path="/extractimages" element={<ExtractImages />} />
              <Route path="/pdftohtml" element={<PdfToHtml />} />
              <Route path="/weboptimize" element={<WebOptimizePdf />} />
              <Route path="/ocrpdf" element={<OcrPdf />} />
              <Route path="/pdftocsv" element={<PdfToCsv />} />
              <Route path="/txttopdf" element={<TxtToPdf />} />
              <Route path="/markdowntopdf" element={<MarkdownToPdf />} />
              <Route path="/pngtopdf" element={<PngToPdf />} />
              <Route path="/pdftojpg" element={<PdfToJpg />} />
              <Route path="/pdftopng" element={<PdfToPng />} />
              <Route path="/editpdf" element={<EditPdf />} />
            </Routes>

          {shouldShowFooter && <Footter />}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AppContent />
    </Router>
  );
};

export default App;
