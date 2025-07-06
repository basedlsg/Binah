'use client';

import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  type: 'video' | 'writing' | 'music';
  title: string;
  description: string;
  author: string;
  createdAt: string;
  fileUrl: string;
  thumbnailUrl?: string;
  content?: string;
  duration?: number;
  engagement: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  comments: Array<{
    id: string;
    author: string;
    content: string;
    createdAt: string;
    isBot: boolean;
    avatar?: string;
  }>;
}

interface SocialPostProps {
  post: Post;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onInteract: (postId: string, action: 'like' | 'comment' | 'share') => void;
}

export function SocialPost({ post, isExpanded, onToggleExpand, onInteract }: SocialPostProps) {
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);

  const handleLike = () => {
    setIsLiked(!isLiked);
    onInteract(post.id, 'like');
  };

  const getPostIcon = () => {
    switch (post.type) {
      case 'video':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        );
      case 'writing':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        );
      case 'music':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
        );
    }
  };

  const renderContent = () => {
    switch (post.type) {
      case 'video':
        return (
          <div className="relative aspect-video bg-gray-800 rounded-lg overflow-hidden">
            {post.thumbnailUrl ? (
              <img 
                src={post.thumbnailUrl} 
                alt={post.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-gray-400">
                  <svg className="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <div className="text-sm">Video Content</div>
                </div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 hover:bg-opacity-20 transition-all">
              <button className="bg-white bg-opacity-90 hover:bg-opacity-100 rounded-full p-3 transition-all">
                <svg className="w-6 h-6 text-black ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
            {post.duration && (
              <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
                {Math.floor(post.duration / 60)}:{(post.duration % 60).toString().padStart(2, '0')}
              </div>
            )}
          </div>
        );

      case 'writing':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="prose prose-invert max-w-none">
              {isExpanded || !post.content ? (
                <div 
                  className="text-gray-200 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: post.content || post.description }}
                />
              ) : (
                <div className="text-gray-200 leading-relaxed">
                  {post.description.length > 200 
                    ? post.description.substring(0, 200) + '...' 
                    : post.description
                  }
                  <button 
                    onClick={onToggleExpand}
                    className="text-blue-400 hover:text-blue-300 ml-2"
                  >
                    Read more
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'music':
        return (
          <div className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
              </div>
              <div className="flex-1">
                <div className="text-lg font-medium text-white">{post.title}</div>
                <div className="text-gray-400">{post.author}</div>
                {post.duration && (
                  <div className="text-sm text-gray-500">
                    {Math.floor(post.duration / 60)}:{(post.duration % 60).toString().padStart(2, '0')}
                  </div>
                )}
              </div>
              <button className="bg-white bg-opacity-10 hover:bg-opacity-20 rounded-full p-3 transition-all">
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
            </div>
            
            {/* Waveform visualization */}
            <div className="mt-4 h-16 bg-gray-700 rounded-lg flex items-center justify-center">
              <div className="flex items-end space-x-1 h-8">
                {Array.from({length: 50}, (_, i) => (
                  <div 
                    key={i}
                    className="bg-gradient-to-t from-purple-500 to-pink-500 rounded-sm"
                    style={{
                      width: '2px',
                      height: `${Math.random() * 100}%`,
                      opacity: 0.7
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <article className="bg-gray-900 rounded-lg p-6 border border-gray-800 hover:border-gray-700 transition-all">
      {/* Post Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-medium">
            {post.author.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-medium text-white">{post.author}</span>
              <span className="text-gray-400">{getPostIcon()}</span>
            </div>
            <div className="text-sm text-gray-500">
              {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 capitalize">
          {post.type}
        </div>
      </div>

      {/* Post Title */}
      <h2 className="text-xl font-semibold text-white mb-2">{post.title}</h2>
      
      {/* Post Content */}
      <div className="mb-4">
        {renderContent()}
      </div>

      {/* Engagement Stats */}
      <div className="flex items-center justify-between mb-4 text-sm text-gray-400">
        <div className="flex items-center space-x-4">
          <span>{post.engagement.views.toLocaleString()} views</span>
          <span>{post.engagement.likes} likes</span>
          <span>{post.engagement.comments} comments</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between border-t border-gray-800 pt-4">
        <div className="flex items-center space-x-6">
          <button 
            onClick={handleLike}
            className={`flex items-center space-x-2 hover:text-red-400 transition-colors ${
              isLiked ? 'text-red-400' : 'text-gray-400'
            }`}
          >
            <svg className="w-5 h-5" fill={isLiked ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
            <span>Like</span>
          </button>

          <button 
            onClick={() => setShowComments(!showComments)}
            className="flex items-center space-x-2 text-gray-400 hover:text-blue-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <span>Comment</span>
          </button>

          <button 
            onClick={() => onInteract(post.id, 'share')}
            className="flex items-center space-x-2 text-gray-400 hover:text-green-400 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
            <span>Share</span>
          </button>
        </div>
        
        <div className="text-xs text-gray-500">
          🤖 Bot activity: High
        </div>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-4 border-t border-gray-800 pt-4">
          <div className="space-y-3">
            {post.comments.slice(0, 3).map((comment) => (
              <div key={comment.id} className="flex space-x-3">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-600 to-gray-700 rounded-full flex items-center justify-center text-white text-sm">
                  {comment.isBot ? '🤖' : comment.author.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="flex items-center space-x-2 mb-1">
                      <span className="text-sm font-medium text-white">{comment.author}</span>
                      {comment.isBot && <span className="text-xs text-blue-400">Bot</span>}
                    </div>
                    <p className="text-sm text-gray-300">{comment.content}</p>
                  </div>
                  <div className="text-xs text-gray-500 mt-1 ml-3">
                    {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                  </div>
                </div>
              </div>
            ))}
            
            {post.comments.length > 3 && (
              <button className="text-sm text-blue-400 hover:text-blue-300 ml-11">
                View all {post.comments.length} comments
              </button>
            )}
          </div>
        </div>
      )}
    </article>
  );
}