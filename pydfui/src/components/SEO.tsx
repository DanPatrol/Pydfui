import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title?: string;
  description?: string;
  path?: string;
  noIndex?: boolean;
}

const BASE_URL = 'https://pdfworkshop.sbs';

const SEO = ({ 
  title = 'PDF Workshop - Free Online PDF Tools',
  description = 'Free online PDF tools - merge, split, compress, watermark, protect, and edit PDFs. No registration required.',
  path = '/',
  noIndex = false
}: SEOProps) => {
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const canonicalUrl = `${BASE_URL}${cleanPath}`;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />
      {noIndex && <meta name="robots" content="noindex, nofollow" />}
    </Helmet>
  );
};

export default SEO;
