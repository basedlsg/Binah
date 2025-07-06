'use client';

import { useState, useEffect } from 'react';
import { Content, ContentFilter, ContentType, ContentUploadProgress } from '@/types';
import VideoUpload from './VideoUpload';
import WritingUpload from './WritingUpload';
import MusicUpload from './MusicUpload';
import VideoPlayer from './VideoPlayer';
import WritingViewer from './WritingViewer';
import MusicPlayer from './MusicPlayer';

interface ContentDashboardProps {
  className?: string;
}

type ViewMode = 'grid' | 'list';
type ActiveTab = 'browse' | 'upload' | 'manage';
type UploadType = 'video' | 'writing' | 'music';

export default function ContentDashboard({ className = '' }: ContentDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('browse');
  const [uploadType, setUploadType] = useState<UploadType>('video');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [content, setContent] = useState<Content[]>([]);
  const [filteredContent, setFilteredContent] = useState<Content[]>([]);
  const [selectedContent, setSelectedContent] = useState<Content | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<ContentUploadProgress[]>([]);
  const [filter, setFilter] = useState<ContentFilter>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  // Fetch content on mount
  useEffect(() => {
    fetchContent();
  }, []);

  // Filter content when filter or search changes
  useEffect(() => {
    filterContent();
  }, [content, filter, searchTerm]);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/content');
      const result = await response.json();
      if (result.success) {
        setContent(result.data);
      }
    } catch (error) {
      console.error('Failed to fetch content:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterContent = () => {
    let filtered = [...content];

    // Apply type filter
    if (filter.type) {
      filtered = filtered.filter(item => item.type === filter.type);
    }

    // Apply author filter
    if (filter.author) {
      filtered = filtered.filter(item => 
        item.author.toLowerCase().includes(filter.author!.toLowerCase())
      );
    }

    // Apply published filter
    if (filter.isPublished !== undefined) {
      filtered = filtered.filter(item => item.isPublished === filter.isPublished);
    }

    // Apply tag filter
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(item =>
        filter.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // Apply search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.author.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredContent(filtered);
  };

  const handleUploadComplete = (result: any) => {
    if (result.success) {
      setContent(prev => [result.data, ...prev]);
      setActiveTab('browse');
    }
  };

  const handleUploadProgress = (progress: ContentUploadProgress) => {
    setUploadProgress(prev => {
      const existing = prev.find(p => p.filename === progress.filename);
      if (existing) {
        return prev.map(p => p.filename === progress.filename ? progress : p);
      }
      return [...prev, progress];
    });

    // Remove completed uploads after a delay
    if (progress.status === 'completed') {
      setTimeout(() => {
        setUploadProgress(prev => prev.filter(p => p.filename !== progress.filename));
      }, 3000);
    }
  };

  const handleDeleteContent = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;

    try {
      const response = await fetch(`/api/content/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setContent(prev => prev.filter(item => item.id !== id));
        setSelectedContent(null);
      }
    } catch (error) {
      console.error('Failed to delete content:', error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedItems.size === 0 || !confirm(`Delete ${selectedItems.size} items?`)) return;

    for (const id of selectedItems) {
      try {
        await fetch(`/api/content/${id}`, { method: 'DELETE' });
      } catch (error) {
        console.error(`Failed to delete content ${id}:`, error);
      }
    }

    setContent(prev => prev.filter(item => !selectedItems.has(item.id)));
    setSelectedItems(new Set());
  };

  const toggleItemSelection = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(date));
  };

  const contentTypeIcons = {
    video: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
    ),
    writing: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    ),
    music: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
      </svg>
    ),
  };

  return (
    <div className={`bg-black text-white min-h-screen ${className}`}>
      {/* Header */}
      <header className="border-b border-gray-800 bg-black sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Content Management</h1>
            
            {/* Tab Navigation */}
            <nav className="flex space-x-1 bg-gray-900 rounded-lg p-1">
              {[
                { id: 'browse', label: 'Browse' },
                { id: 'upload', label: 'Upload' },
                { id: 'manage', label: 'Manage' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as ActiveTab)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-white text-black'
                      : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Upload Progress */}
      {uploadProgress.length > 0 && (
        <div className="border-b border-gray-800 bg-gray-900">
          <div className="container mx-auto px-6 py-4">
            <h3 className="font-medium mb-3">Upload Progress</h3>
            <div className="space-y-2">
              {uploadProgress.map((progress) => (
                <div key={progress.filename} className="flex items-center space-x-3">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm mb-1">
                      <span>{progress.filename}</span>
                      <span>{progress.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          progress.status === 'error' ? 'bg-red-500' : 'bg-white'
                        }`}
                        style={{ width: `${progress.progress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm text-gray-400">
                    {progress.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {/* Browse Tab */}
        {activeTab === 'browse' && (
          <div className="space-y-6">
            {/* Filters and Search */}
            <div className="flex flex-col md:flex-row md:items-center justify-between space-y-4 md:space-y-0">
              <div className="flex flex-wrap items-center gap-4">
                {/* Search */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:border-white focus:outline-none"
                  />
                  <svg className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>

                {/* Type Filter */}
                <select
                  value={filter.type || ''}
                  onChange={(e) => setFilter(prev => ({ ...prev, type: e.target.value as ContentType || undefined }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:border-white focus:outline-none"
                >
                  <option value="">All Types</option>
                  <option value="video">Video</option>
                  <option value="writing">Writing</option>
                  <option value="music">Music</option>
                </select>

                {/* Published Filter */}
                <select
                  value={filter.isPublished === undefined ? '' : filter.isPublished.toString()}
                  onChange={(e) => setFilter(prev => ({ 
                    ...prev, 
                    isPublished: e.target.value === '' ? undefined : e.target.value === 'true'
                  }))}
                  className="bg-gray-800 border border-gray-600 rounded-lg px-3 py-2 focus:border-white focus:outline-none"
                >
                  <option value="">All Status</option>
                  <option value="true">Published</option>
                  <option value="false">Draft</option>
                </select>
              </div>

              {/* View Controls */}
              <div className="flex items-center space-x-4">
                {selectedItems.size > 0 && (
                  <button
                    onClick={handleBulkDelete}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  >
                    Delete Selected ({selectedItems.size})
                  </button>
                )}

                <div className="flex bg-gray-800 rounded-lg">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-l-lg ${
                      viewMode === 'grid' ? 'bg-white text-black' : 'text-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M10 18h4v-2h-4v2zM3 6v2h18V6H3zm3 7h12v-2H6v2z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-r-lg ${
                      viewMode === 'list' ? 'bg-white text-black' : 'text-gray-400'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M4 6h16v2H4zm0 5h16v2H4zm0 5h16v2H4z" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Content Grid/List */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : filteredContent.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400">No content found</p>
              </div>
            ) : viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredContent.map((item) => (
                  <div
                    key={item.id}
                    className="bg-gray-900 rounded-lg overflow-hidden hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedContent(item)}
                  >
                    {/* Thumbnail */}
                    <div className="aspect-video bg-gray-800 relative">
                      {item.thumbnailUrl ? (
                        <img
                          src={item.thumbnailUrl}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          {contentTypeIcons[item.type]}
                        </div>
                      )}
                      
                      {/* Checkbox */}
                      <div
                        className="absolute top-2 left-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleItemSelection(item.id);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedItems.has(item.id)}
                          onChange={() => {}}
                          className="w-4 h-4 accent-white"
                        />
                      </div>

                      {/* Type Badge */}
                      <div className="absolute top-2 right-2">
                        <span className="px-2 py-1 bg-black bg-opacity-75 text-xs rounded-full">
                          {item.type}
                        </span>
                      </div>
                    </div>

                    {/* Content Info */}
                    <div className="p-4">
                      <h3 className="font-medium truncate mb-1">{item.title}</h3>
                      <p className="text-sm text-gray-400 truncate mb-2">{item.author}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{formatDate(item.createdAt)}</span>
                        <span>{formatFileSize(item.fileSize)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredContent.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center space-x-4 p-4 bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors cursor-pointer"
                    onClick={() => setSelectedContent(item)}
                  >
                    <input
                      type="checkbox"
                      checked={selectedItems.has(item.id)}
                      onChange={() => toggleItemSelection(item.id)}
                      className="w-4 h-4 accent-white"
                      onClick={(e) => e.stopPropagation()}
                    />
                    
                    <div className="w-12 h-12 bg-gray-800 rounded flex items-center justify-center">
                      {contentTypeIcons[item.type]}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium truncate">{item.title}</h3>
                      <p className="text-sm text-gray-400 truncate">{item.author}</p>
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      {formatDate(item.createdAt)}
                    </div>
                    
                    <div className="text-sm text-gray-400">
                      {formatFileSize(item.fileSize)}
                    </div>
                    
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.isPublished ? 'bg-green-800 text-green-300' : 'bg-yellow-800 text-yellow-300'
                    }`}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Upload Tab */}
        {activeTab === 'upload' && (
          <div className="space-y-6">
            {/* Upload Type Selector */}
            <div className="flex justify-center">
              <div className="flex bg-gray-900 rounded-lg p-1">
                {[
                  { id: 'video', label: 'Video', icon: contentTypeIcons.video },
                  { id: 'writing', label: 'Writing', icon: contentTypeIcons.writing },
                  { id: 'music', label: 'Music', icon: contentTypeIcons.music },
                ].map((type) => (
                  <button
                    key={type.id}
                    onClick={() => setUploadType(type.id as UploadType)}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-lg transition-colors ${
                      uploadType === type.id
                        ? 'bg-white text-black'
                        : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    {type.icon}
                    <span>{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Upload Component */}
            <div className="max-w-4xl mx-auto">
              {uploadType === 'video' && (
                <VideoUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadProgress={handleUploadProgress}
                />
              )}
              {uploadType === 'writing' && (
                <WritingUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadProgress={handleUploadProgress}
                />
              )}
              {uploadType === 'music' && (
                <MusicUpload
                  onUploadComplete={handleUploadComplete}
                  onUploadProgress={handleUploadProgress}
                />
              )}
            </div>
          </div>
        )}

        {/* Manage Tab */}
        {activeTab === 'manage' && (
          <div className="space-y-6">
            <div className="text-center py-12">
              <h2 className="text-xl font-semibold mb-4">Content Management</h2>
              <p className="text-gray-400 mb-6">Advanced content management features coming soon</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>• Bulk operations</p>
                <p>• Content analytics</p>
                <p>• Publishing workflows</p>
                <p>• User permissions</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Content Viewer Modal */}
      {selectedContent && (
        <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-lg max-w-6xl max-h-full overflow-auto w-full">
            <div className="flex items-center justify-between p-4 border-b border-gray-700">
              <h2 className="text-xl font-semibold">{selectedContent.title}</h2>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleDeleteContent(selectedContent.id)}
                  className="p-2 text-red-400 hover:text-red-300 transition-colors"
                  title="Delete"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedContent(null)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {selectedContent.type === 'video' && (
                <VideoPlayer content={selectedContent as any} />
              )}
              {selectedContent.type === 'writing' && (
                <WritingViewer content={selectedContent as any} />
              )}
              {selectedContent.type === 'music' && (
                <MusicPlayer content={selectedContent as any} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}