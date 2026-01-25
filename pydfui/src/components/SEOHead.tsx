import { useEffect } from 'react';

interface SEOHeadProps {
  title?: string;
  description?: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article';
  author?: string;
  publishedTime?: string;
  keywords?: string;
}

const SEOHead: React.FC<SEOHeadProps> = ({
  title = 'PDF Workshop - Free Online PDF Tools',
  description = 'Free online PDF tools - merge, split, compress, watermark, protect, and edit PDFs. No registration required.',
  image = 'https://pdfworkshop.sbs/og-image.jpg',
  url = 'https://pdfworkshop.sbs',
  type = 'website',
  author,
  publishedTime,
  keywords,
}) => {
  useEffect(() => {
    // Set page title
    document.title = title;

    // Helper function to set or update meta tags
    const setMetaTag = (name: string, content: string, property = false) => {
      const attribute = property ? 'property' : 'name';
      let element = document.querySelector(`meta[${attribute}="${name}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Basic meta tags
    setMetaTag('description', description);
    if (keywords) {
      setMetaTag('keywords', keywords);
    }

    // Open Graph tags
    setMetaTag('og:title', title, true);
    setMetaTag('og:description', description, true);
    setMetaTag('og:image', image, true);
    setMetaTag('og:url', url, true);
    setMetaTag('og:type', type, true);
    setMetaTag('og:site_name', 'PDF Workshop', true);

    // Twitter Card tags
    setMetaTag('twitter:card', 'summary_large_image');
    setMetaTag('twitter:title', title);
    setMetaTag('twitter:description', description);
    setMetaTag('twitter:image', image);

    // Article-specific tags
    if (type === 'article') {
      if (author) {
        setMetaTag('article:author', author, true);
      }
      if (publishedTime) {
        setMetaTag('article:published_time', publishedTime, true);
      }
    }

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

  }, [title, description, image, url, type, author, publishedTime, keywords]);

  return null; // This component doesn't render anything
};

export default SEOHead;
