'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { WritingContent } from '@/types';

interface WritingViewerProps {
  content: WritingContent;
  className?: string;
}

export default function WritingViewer({ content, className = '' }: WritingViewerProps) {
  const [fontSize, setFontSize] = useState(16);
  const [darkMode, setDarkMode] = useState(true);
  const [showMetadata, setShowMetadata] = useState(false);

  const fontSizes = [
    { label: 'Small', value: 14 },
    { label: 'Medium', value: 16 },
    { label: 'Large', value: 18 },
    { label: 'Extra Large', value: 20 },
  ];

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  return (
    <div className={`max-w-none ${className}`}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 pb-4 border-b border-gray-700">
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{content.title}</h1>
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
            <span>By <span className="text-white font-medium">{content.author}</span></span>
            <span>•</span>
            <span>{formatDate(content.createdAt)}</span>
            <span>•</span>
            <span>{content.readingTime} min read</span>
            <span>•</span>
            <span>{content.wordCount} words</span>
          </div>
          
          {content.description && (
            <p className="text-gray-300 mt-3 text-lg leading-relaxed">
              {content.description}
            </p>
          )}
        </div>

        {/* Reading Controls */}
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          {/* Font Size */}
          <div className="relative">
            <select
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 text-sm"
            >
              {fontSizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>

          {/* Metadata Toggle */}
          <button
            onClick={() => setShowMetadata(!showMetadata)}
            className="p-2 rounded hover:bg-gray-800 transition-colors"
            title="Show metadata"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>

          {/* Share Button */}
          <button
            onClick={() => navigator.share?.({ title: content.title, url: window.location.href })}
            className="p-2 rounded hover:bg-gray-800 transition-colors"
            title="Share"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tags */}
      {content.tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {content.tags.map((tag) => (
            <span
              key={tag}
              className="px-3 py-1 bg-gray-800 text-gray-300 text-sm rounded-full border border-gray-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Metadata Panel */}
      {showMetadata && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6 border border-gray-700">
          <h3 className="font-semibold mb-3">Content Metadata</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Format:</span>
              <span className="ml-2 text-white">{content.format.toUpperCase()}</span>
            </div>
            <div>
              <span className="text-gray-400">File Size:</span>
              <span className="ml-2 text-white">{(content.fileSize / 1024).toFixed(1)} KB</span>
            </div>
            <div>
              <span className="text-gray-400">Created:</span>
              <span className="ml-2 text-white">{formatDate(content.createdAt)}</span>
            </div>
            <div>
              <span className="text-gray-400">Updated:</span>
              <span className="ml-2 text-white">{formatDate(content.updatedAt)}</span>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <span className={`ml-2 ${content.isPublished ? 'text-green-400' : 'text-yellow-400'}`}>
                {content.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Word Count:</span>
              <span className="ml-2 text-white">{content.wordCount.toLocaleString()}</span>
            </div>
          </div>
          
          {content.excerpt && (
            <div className="mt-4">
              <span className="text-gray-400">Excerpt:</span>
              <p className="mt-1 text-gray-300 italic">{content.excerpt}</p>
            </div>
          )}
        </div>
      )}

      {/* Content */}
      <article 
        className="prose prose-invert max-w-none"
        style={{ fontSize: `${fontSize}px` }}
      >
        <div className="writing-content">
          {content.format === 'markdown' ? (
            <ReactMarkdown
              components={{
                // Custom components for better styling
                h1: ({ children }) => (
                  <h1 className="text-3xl md:text-4xl font-bold mb-6 mt-8 first:mt-0 text-white">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-2xl md:text-3xl font-bold mb-4 mt-8 text-white border-b border-gray-700 pb-2">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-xl md:text-2xl font-bold mb-3 mt-6 text-white">
                    {children}
                  </h3>
                ),
                h4: ({ children }) => (
                  <h4 className="text-lg md:text-xl font-semibold mb-2 mt-4 text-white">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="mb-4 leading-relaxed text-gray-200">
                    {children}
                  </p>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-gray-600 pl-4 italic my-6 text-gray-300">
                    {children}
                  </blockquote>
                ),
                code: ({ children, className }) => {
                  const isInline = !className;
                  return isInline ? (
                    <code className="bg-gray-800 text-gray-200 px-1 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  ) : (
                    <code className="block bg-gray-900 text-gray-200 p-4 rounded-lg text-sm font-mono overflow-x-auto">
                      {children}
                    </code>
                  );
                },
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-4 space-y-1 text-gray-200">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-4 space-y-1 text-gray-200">
                    {children}
                  </ol>
                ),
                li: ({ children }) => (
                  <li className="leading-relaxed">{children}</li>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-white hover:text-gray-300 underline transition-colors"
                  >
                    {children}
                  </a>
                ),
                img: ({ src, alt }) => (
                  <img
                    src={src}
                    alt={alt}
                    className="max-w-full h-auto rounded-lg my-6 border border-gray-700"
                  />
                ),
                hr: () => (
                  <hr className="border-gray-700 my-8" />
                ),
                table: ({ children }) => (
                  <div className="overflow-x-auto my-6">
                    <table className="min-w-full border border-gray-700 rounded-lg">
                      {children}
                    </table>
                  </div>
                ),
                th: ({ children }) => (
                  <th className="border border-gray-700 px-4 py-2 bg-gray-800 text-white font-semibold text-left">
                    {children}
                  </th>
                ),
                td: ({ children }) => (
                  <td className="border border-gray-700 px-4 py-2 text-gray-200">
                    {children}
                  </td>
                ),
              }}
            >
              {content.content}
            </ReactMarkdown>
          ) : (
            <div 
              className="prose-content"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          )}
        </div>
      </article>

      {/* Footer */}
      <div className="mt-12 pt-6 border-t border-gray-700">
        <div className="flex flex-col md:flex-row md:items-center justify-between">
          <div className="text-sm text-gray-400">
            Last updated: {formatDate(content.updatedAt)}
          </div>
          
          <div className="flex items-center space-x-4 mt-4 md:mt-0">
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Report an issue
            </button>
            <button className="text-sm text-gray-400 hover:text-white transition-colors">
              Suggest edit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}