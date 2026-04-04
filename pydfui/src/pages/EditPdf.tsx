import React from 'react';
import { useLocation } from 'react-router-dom';
import PdfEditor from '../components/pdf-editor/PdfEditor';
import SEOHead from '../components/SEOHead';

const EditPdf: React.FC = () => {
  const location = useLocation();
  const { files } = location.state || {};
  const file: File | null = files && files.length > 0 ? files[0] : null;

  return (
    <>
      <SEOHead
        title="Edit PDF Online - Draw, Annotate & Add Text | PDF Workshop"
        description="Edit PDF files online. Draw, add text, shapes, highlights, and annotations. Free online PDF editor with undo/redo."
        url="https://www.pdfworkshop.sbs/editpdf"
        keywords="edit pdf, pdf editor, annotate pdf, draw on pdf, add text to pdf, free pdf editor online"
      />
      <PdfEditor initialFile={file} />
    </>
  );
};

export default EditPdf;
