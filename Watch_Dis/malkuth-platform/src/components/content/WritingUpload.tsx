'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactMarkdown from 'react-markdown';
import { ContentUploadProgress } from '@/types';

interface WritingUploadProps {
  onUploadComplete: (result: any) => void;
  onUploadProgress: (progress: ContentUploadProgress) => void;
}

export default function WritingUpload({ onUploadComplete, onUploadProgress }: WritingUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [content, setContent] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    author: '',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setContent(text);
        
        // Auto-fill title from filename
        if (!formData.title) {
          const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
          setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
        }
      };
      reader.readAsText(file);
    }
  }, [formData.title]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'text/*': ['.md', '.txt', '.markdown'],
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim() || !formData.title || !formData.author) {
      alert('Please fill in all required fields and provide content');
      return;
    }

    setUploading(true);

    try {
      // Create a blob from the content
      const blob = new Blob([content], { type: 'text/markdown' });
      const file = new File([blob], `${formData.title}.md`, { type: 'text/markdown' });

      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('contentType', 'writing');
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('tags', formData.tags);
      uploadFormData.append('author', formData.author);

      // Start upload with progress tracking
      onUploadProgress({
        filename: file.name,
        progress: 0,
        status: 'uploading',
      });

      const response = await fetch('/api/content/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (!response.ok) {
        throw new Error('Upload failed');
      }

      const result = await response.json();
      
      onUploadProgress({
        filename: file.name,
        progress: 100,
        status: 'completed',
      });

      onUploadComplete(result);

      // Reset form
      setFormData({
        title: '',
        description: '',
        tags: '',
        author: '',
      });
      setContent('');

    } catch (error) {
      console.error('Upload error:', error);
      onUploadProgress({
        filename: 'content.md',
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(word => word.length > 0).length;
  const readingTime = Math.ceil(wordCount / 200); // 200 words per minute

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Writing</h2>
        <p className="text-gray-400">Create or upload written content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-white bg-gray-900'
              : 'border-gray-600 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-2">
            <div className="w-12 h-12 mx-auto rounded-lg bg-gray-800 flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-sm">
              {isDragActive ? 'Drop the file here' : 'Drag and drop a markdown file or click to select'}
            </p>
            <p className="text-xs text-gray-400">
              Supports .md, .txt, .markdown files (Max 10MB)
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Author *
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Tags
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData(prev => ({ ...prev, tags: e.target.value }))}
            placeholder="Separate tags with commas"
            className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
          />
        </div>

        {/* Content Editor */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium">
              Content *
            </label>
            <div className="flex items-center space-x-4">
              <span className="text-xs text-gray-400">
                {wordCount} words • {readingTime} min read
              </span>
              <button
                type="button"
                onClick={() => setShowPreview(!showPreview)}
                className="text-xs text-white hover:text-gray-300 transition-colors"
              >
                {showPreview ? 'Edit' : 'Preview'}
              </button>
            </div>
          </div>

          {showPreview ? (
            <div className="w-full min-h-[400px] p-4 bg-gray-800 border border-gray-600 rounded-lg overflow-auto">
              <div className="prose prose-invert max-w-none">
                <ReactMarkdown>{content}</ReactMarkdown>
              </div>
            </div>
          ) : (
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={20}
              placeholder="Write your content here using Markdown..."
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none font-mono text-sm"
              required
            />
          )}
        </div>

        {/* Markdown Help */}
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-2">Markdown Quick Reference</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
            <div>
              <p><code># Heading 1</code></p>
              <p><code>## Heading 2</code></p>
              <p><code>**Bold text**</code></p>
              <p><code>*Italic text*</code></p>
            </div>
            <div>
              <p><code>[Link](url)</code></p>
              <p><code>![Image](url)</code></p>
              <p><code>- List item</code></p>
              <p><code>`Code`</code></p>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <button
          type="submit"
          disabled={uploading || !content.trim()}
          className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Writing'}
        </button>
      </form>

      {/* Processing Info */}
      {uploading && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-2">Processing Information</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Converting markdown to HTML</li>
            <li>• Calculating word count and reading time</li>
            <li>• Generating excerpt</li>
            <li>• Optimizing for search and display</li>
          </ul>
        </div>
      )}
    </div>
  );
}