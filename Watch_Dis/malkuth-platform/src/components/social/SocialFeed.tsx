'use client';

import { useState } from 'react';
import { SocialPost } from './SocialPost';

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

interface SocialFeedProps {
  posts: Post[];
  onPostUpdate: () => void;
}

export function SocialFeed({ posts, onPostUpdate }: SocialFeedProps) {
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  const handlePostInteraction = async (postId: string, action: 'like' | 'comment' | 'share') => {
    try {
      await fetch(`/api/social/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, action })
      });
      onPostUpdate();
    } catch (error) {
      console.error('Failed to interact with post:', error);
    }
  };

  if (posts.length === 0) {
    return (
      <div className="bg-gray-900 rounded-lg p-8 text-center">
        <div className="text-gray-400 mb-4">
          <svg className="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m0 0V3a1 1 0 011 1v13.5A2.5 2.5 0 0115.5 20h-7A2.5 2.5 0 016 17.5V4z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 9h6m-6 3h6m-6 3h4" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">Welcome to Malkuth</h3>
        <p className="text-gray-400 mb-4">
          Your digital laboratory for content and AI engagement. Create your first post to start attracting bot interactions.
        </p>
        <div className="text-sm text-gray-500">
          Upload videos, write articles, or share music to see how AI bots engage with your content in real-time.
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {posts.map((post) => (
        <SocialPost 
          key={post.id} 
          post={post} 
          isExpanded={expandedPost === post.id}
          onToggleExpand={() => setExpandedPost(
            expandedPost === post.id ? null : post.id
          )}
          onInteract={handlePostInteraction}
        />
      ))}
    </div>
  );
}