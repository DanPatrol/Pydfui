
import Homehero from '../components/Homehero';
import Homecontent from '../components/Homecontent';
import SEOHead from '../components/SEOHead';

const Homepage = () => {
  return (
    <div>
      <SEOHead
        title="PDF Workshop - Free Online PDF Tools"
        description="Free online PDF tools - merge, split, compress, watermark, protect, and edit PDFs. No registration required. Fast, secure, and easy to use."
        url="https://pdfworkshop.sbs/"
        keywords="pdf tools, merge pdf, split pdf, compress pdf, pdf editor, free pdf tools, online pdf, pdf converter"
      />
      <Homehero/>
      <Homecontent/>
    </div>
  );
}

export default Homepage;
