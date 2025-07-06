'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { ContentUploadProgress } from '@/types';

interface VideoUploadProps {
  onUploadComplete: (result: any) => void;
  onUploadProgress: (progress: ContentUploadProgress) => void;
}

export default function VideoUpload({ onUploadComplete, onUploadProgress }: VideoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    author: '',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Create preview
      const url = URL.createObjectURL(file);
      setPreview(url);

      // Auto-fill title from filename
      if (!formData.title) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
      }
    }
  }, [formData.title]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm'],
    },
    multiple: false,
    maxSize: 500 * 1024 * 1024, // 500MB
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedFiles.length || !formData.title || !formData.author) {
      alert('Please fill in all required fields and select a video file');
      return;
    }

    setUploading(true);
    const file = acceptedFiles[0];

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('contentType', 'video');
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
      setPreview(null);

    } catch (error) {
      console.error('Upload error:', error);
      onUploadProgress({
        filename: file.name,
        progress: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Video</h2>
        <p className="text-gray-400">Upload and process video content</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* File Drop Zone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-white bg-gray-900'
              : 'border-gray-600 hover:border-gray-400'
          }`}
        >
          <input {...getInputProps()} />
          {preview ? (
            <div className="space-y-4">
              <video
                src={preview}
                controls
                className="max-w-full max-h-64 mx-auto rounded-lg"
              />
              <p className="text-sm text-gray-400">
                {acceptedFiles[0]?.name} ({(acceptedFiles[0]?.size / 1024 / 1024).toFixed(2)} MB)
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-lg bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop the video here' : 'Drag and drop a video file'}
                </p>
                <p className="text-sm text-gray-400">
                  Or click to select a file (MP4, MOV, AVI, MKV, WebM - Max 500MB)
                </p>
              </div>
            </div>
          )}
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

        {/* Upload Button */}
        <button
          type="submit"
          disabled={uploading || !acceptedFiles.length}
          className="w-full py-3 bg-white text-black font-medium rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {uploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </form>

      {/* Processing Info */}
      {uploading && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-2">Processing Information</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Uploading original video file</li>
            <li>• Generating thumbnail at 10% duration</li>
            <li>• Creating multiple resolutions (1080p, 720p, 480p)</li>
            <li>• Optimizing for web playback</li>
            <li>• Extracting metadata and duration</li>
          </ul>
        </div>
      )}
    </div>
  );
}