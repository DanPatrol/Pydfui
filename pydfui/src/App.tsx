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

const AppContent = () => {
  const location = useLocation();
  
  const handleReorder = (newOrder: React.ReactNode[]) => {
    console.log('New Order:', newOrder);
  };

  // Hide footer on preview/editing pages
  const hideFooterRoutes = ['/preview', '/split', '/compress', '/removepages', '/extractpages', '/organizepages', '/rotate', '/addwatermark', '/batch-preview', '/protect', '/unlock', '/pagenumbers', '/removeblank', '/pdftoimage', '/flatten', '/metadata'];
  const shouldShowFooter = !hideFooterRoutes.includes(location.pathname);

  return (
    <div className="overflow-x-hidden text-neutral-300 antialiased selection:bg-cyan-300 selection:text-cyan-900">
      {/* Background applied to the full page */}
      <div className="min-h-screen bg-[#b2f5f3] bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(30,58,138,0.4),rgba(10,10,58,0))]">
        {/* Adjusting container to take full width and reducing padding */}
        <div className="w-full mx-auto px-4"> {/* Reduced padding */}
          <NavBar />

            <Routes>
              {/* Route for UploadFile Component */}
              <Route path="/" element={<Homepage />} />
              <Route path="/upload/:action" element={<UploadFile />} />
              {/* Route for AdjusterList Component */}
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
              <Route path="/blog" element={<BlogList />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
            </Routes>

          {shouldShowFooter && <Footter />}
        </div>
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AppContent />
    </Router>
  );
};

export default App;
