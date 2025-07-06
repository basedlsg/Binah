'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { ContentUploadProgress } from '@/types';

interface MusicUploadProps {
  onUploadComplete: (result: any) => void;
  onUploadProgress: (progress: ContentUploadProgress) => void;
}

export default function MusicUpload({ onUploadComplete, onUploadProgress }: MusicUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [audioPreview, setAudioPreview] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [waveform, setWaveform] = useState<number[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    author: '',
    album: '',
    genre: '',
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      // Create preview
      const url = URL.createObjectURL(file);
      setAudioPreview(url);

      // Auto-fill title from filename
      if (!formData.title) {
        const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
        setFormData(prev => ({ ...prev, title: nameWithoutExtension }));
      }

      // Generate simple waveform visualization
      generateWaveform(file);
    }
  }, [formData.title]);

  const { getRootProps, getInputProps, isDragActive, acceptedFiles } = useDropzone({
    onDrop,
    accept: {
      'audio/*': ['.mp3', '.wav', '.flac', '.m4a', '.ogg', '.aac'],
    },
    multiple: false,
    maxSize: 100 * 1024 * 1024, // 100MB
  });

  const generateWaveform = async (file: File) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      
      const channelData = audioBuffer.getChannelData(0);
      const sampleRate = audioBuffer.sampleRate;
      const samples = channelData.length;
      const blockSize = Math.floor(samples / 200); // 200 bars
      const waveformData: number[] = [];
      
      for (let i = 0; i < 200; i++) {
        const start = i * blockSize;
        const end = start + blockSize;
        let sum = 0;
        
        for (let j = start; j < end; j++) {
          sum += Math.abs(channelData[j]);
        }
        
        waveformData.push(sum / blockSize);
      }
      
      // Normalize to 0-1 range
      const maxValue = Math.max(...waveformData);
      const normalizedWaveform = waveformData.map(value => value / maxValue);
      
      setWaveform(normalizedWaveform);
    } catch (error) {
      console.error('Error generating waveform:', error);
      // Generate fallback waveform
      setWaveform(Array.from({ length: 200 }, () => Math.random() * 0.8 + 0.1));
    }
  };

  const handlePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = x / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!acceptedFiles.length || !formData.title || !formData.author) {
      alert('Please fill in all required fields and select an audio file');
      return;
    }

    setUploading(true);
    const file = acceptedFiles[0];

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('contentType', 'music');
      uploadFormData.append('title', formData.title);
      uploadFormData.append('description', formData.description);
      uploadFormData.append('tags', formData.tags);
      uploadFormData.append('author', formData.author);
      uploadFormData.append('album', formData.album);
      uploadFormData.append('genre', formData.genre);

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
        album: '',
        genre: '',
      });
      setAudioPreview(null);
      setWaveform([]);

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

  useEffect(() => {
    return () => {
      if (audioPreview) {
        URL.revokeObjectURL(audioPreview);
      }
    };
  }, [audioPreview]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Upload Music</h2>
        <p className="text-gray-400">Upload and process audio content</p>
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
          {audioPreview ? (
            <div className="space-y-4">
              {/* Audio Player */}
              <div className="bg-gray-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={handlePlay}
                      className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors"
                    >
                      {isPlaying ? (
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                        </svg>
                      ) : (
                        <svg className="w-6 h-6 ml-1" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      )}
                    </button>
                    <div className="text-sm">
                      <div className="font-medium">{acceptedFiles[0]?.name}</div>
                      <div className="text-gray-400">
                        {formatTime(currentTime)} / {formatTime(duration)}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm text-gray-400">
                    {(acceptedFiles[0]?.size / 1024 / 1024).toFixed(2)} MB
                  </div>
                </div>

                {/* Waveform */}
                <div 
                  className="h-16 bg-gray-700 rounded-lg flex items-end justify-center space-x-px px-2 cursor-pointer"
                  onClick={handleSeek}
                >
                  {waveform.map((value, index) => (
                    <div
                      key={index}
                      className={`w-1 rounded-sm transition-colors ${
                        index < (currentTime / duration) * waveform.length
                          ? 'bg-white'
                          : 'bg-gray-500'
                      }`}
                      style={{ height: `${Math.max(value * 100, 4)}%` }}
                    />
                  ))}
                </div>
              </div>

              <audio
                ref={audioRef}
                src={audioPreview}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto rounded-lg bg-gray-800 flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div>
                <p className="text-lg font-medium">
                  {isDragActive ? 'Drop the audio file here' : 'Drag and drop an audio file'}
                </p>
                <p className="text-sm text-gray-400">
                  Or click to select a file (MP3, WAV, FLAC, M4A, OGG, AAC - Max 100MB)
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
              Artist *
            </label>
            <input
              type="text"
              value={formData.author}
              onChange={(e) => setFormData(prev => ({ ...prev, author: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Album
            </label>
            <input
              type="text"
              value={formData.album}
              onChange={(e) => setFormData(prev => ({ ...prev, album: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Genre
            </label>
            <input
              type="text"
              value={formData.genre}
              onChange={(e) => setFormData(prev => ({ ...prev, genre: e.target.value }))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
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
          {uploading ? 'Uploading...' : 'Upload Music'}
        </button>
      </form>

      {/* Processing Info */}
      {uploading && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h3 className="font-medium mb-2">Processing Information</h3>
          <ul className="text-sm text-gray-400 space-y-1">
            <li>• Uploading original audio file</li>
            <li>• Extracting metadata (title, artist, album, genre)</li>
            <li>• Analyzing audio properties (duration, bitrate, sample rate)</li>
            <li>• Generating waveform visualization</li>
            <li>• Detecting BPM if available</li>
            <li>• Creating thumbnail/artwork</li>
          </ul>
        </div>
      )}
    </div>
  );
}