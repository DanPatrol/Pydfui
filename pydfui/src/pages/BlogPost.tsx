import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { blogPosts } from '../data/blogPosts';
import { AiOutlineCalendar, AiOutlineClockCircle, AiOutlineUser, AiOutlineTag } from 'react-icons/ai';

const BlogPost: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = blogPosts.find(p => p.slug === slug);

  useEffect(() => {
    // Set page title and meta description for SEO
    if (post) {
      document.title = `${post.title} | PDF Tools Blog`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', post.metaDescription);
      }
    }
  }, [post]);

  // Simple markdown-like rendering
  const renderContent = (content: string) => {
    const lines = content.trim().split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    lines.forEach((line) => {
      if (line.startsWith('# ')) {
        elements.push(<h1 key={key++} className="text-3xl font-bold text-gray-900 mb-4 mt-8">{line.substring(2)}</h1>);
      } else if (line.startsWith('## ')) {
        elements.push(<h2 key={key++} className="text-2xl font-bold text-gray-800 mb-3 mt-6">{line.substring(3)}</h2>);
      } else if (line.startsWith('### ')) {
        elements.push(<h3 key={key++} className="text-xl font-bold text-gray-800 mb-2 mt-4">{line.substring(4)}</h3>);
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        elements.push(<li key={key++} className="ml-6 mb-2 text-gray-700">{line.substring(2)}</li>);
      } else if (line.startsWith('**') && line.endsWith('**')) {
        elements.push(<p key={key++} className="font-bold text-gray-800 mb-2">{line.replace(/\*\*/g, '')}</p>);
      } else if (line.trim() === '') {
        elements.push(<div key={key++} className="h-4"></div>);
      } else if (line.startsWith('✓') || line.startsWith('✗')) {
        elements.push(<li key={key++} className="ml-6 mb-2 text-gray-700">{line}</li>);
      } else {
        elements.push(<p key={key++} className="text-gray-700 mb-4 leading-relaxed">{line}</p>);
      }
    });

    return elements;
  };

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-blue-600 hover:underline">
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  // Get related posts (same category, excluding current)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white py-12">
        <div className="max-w-4xl mx-auto px-4">
          <Link to="/blog" className="text-blue-200 hover:text-white mb-4 inline-block">
            ← Back to Blog
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">{post.title}</h1>
          <p className="text-xl text-blue-100 mb-6">{post.description}</p>
          
          {/* Meta information */}
          <div className="flex flex-wrap gap-4 text-sm text-blue-100">
            <div className="flex items-center gap-2">
              <AiOutlineUser />
              <span>{post.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <AiOutlineCalendar />
              <span>{new Date(post.date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div className="flex items-center gap-2">
              <AiOutlineClockCircle />
              <span>{post.readTime}</span>
            </div>
            <div className="flex items-center gap-2">
              <AiOutlineTag />
              <span>{post.category}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-12">
        <article className="bg-white rounded-lg shadow-lg p-8 md:p-12">
          <div className="prose prose-lg max-w-none">
            {renderContent(post.content)}
          </div>

          {/* Tags */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Related Posts */}
        {relatedPosts.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {relatedPosts.map((relatedPost) => (
                <Link
                  key={relatedPost.id}
                  to={`/blog/${relatedPost.slug}`}
                  className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow p-6"
                >
                  <div className="text-sm text-blue-600 font-semibold mb-2">
                    {relatedPost.category}
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {relatedPost.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {relatedPost.description}
                  </p>
                  <div className="text-sm text-gray-500">
                    {relatedPost.readTime}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
