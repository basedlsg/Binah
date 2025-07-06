import { Content, ContentType } from '@/types';

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  if (bytes === 0) return '0 Bytes';
  
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  const formattedSize = Math.round(bytes / Math.pow(1024, i) * 100) / 100;
  
  return `${formattedSize} ${sizes[i]}`;
}

/**
 * Format duration in human readable format
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate reading time for text content
 */
export function calculateReadingTime(wordCount: number, wordsPerMinute: number = 200): number {
  return Math.ceil(wordCount / wordsPerMinute);
}

/**
 * Generate excerpt from text content
 */
export function generateExcerpt(content: string, maxLength: number = 150): string {
  // Remove markdown syntax and HTML tags
  const cleanContent = content
    .replace(/[#*_`]/g, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  
  if (cleanContent.length <= maxLength) {
    return cleanContent;
  }
  
  return cleanContent.substring(0, maxLength) + '...';
}

/**
 * Validate file type for content type
 */
export function validateFileType(file: File, contentType: ContentType): boolean {
  const validTypes = {
    video: ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'],
    writing: ['text/plain', 'text/markdown'],
    music: ['audio/mp3', 'audio/wav', 'audio/flac', 'audio/m4a', 'audio/ogg', 'audio/aac'],
  };
  
  return validTypes[contentType].some(type => 
    file.type.startsWith(type.split('/')[0]) || file.name.toLowerCase().endsWith(`.${type.split('/')[1]}`)
  );
}

/**
 * Get content type icon
 */
export function getContentTypeIcon(type: ContentType): string {
  const icons = {
    video: '🎥',
    writing: '📝',
    music: '🎵',
  };
  
  return icons[type];
}

/**
 * Sort content by various criteria
 */
export function sortContent(content: Content[], sortBy: string, sortOrder: 'asc' | 'desc' = 'desc'): Content[] {
  return [...content].sort((a, b) => {
    let aValue: any;
    let bValue: any;
    
    switch (sortBy) {
      case 'title':
        aValue = a.title.toLowerCase();
        bValue = b.title.toLowerCase();
        break;
      case 'author':
        aValue = a.author.toLowerCase();
        bValue = b.author.toLowerCase();
        break;
      case 'createdAt':
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
        break;
      case 'updatedAt':
        aValue = new Date(a.updatedAt).getTime();
        bValue = new Date(b.updatedAt).getTime();
        break;
      case 'fileSize':
        aValue = a.fileSize;
        bValue = b.fileSize;
        break;
      case 'type':
        aValue = a.type;
        bValue = b.type;
        break;
      default:
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
    }
    
    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });
}

/**
 * Filter content based on search term and filters
 */
export function filterContent(
  content: Content[],
  searchTerm: string,
  filters: {
    type?: ContentType;
    author?: string;
    tags?: string[];
    isPublished?: boolean;
  }
): Content[] {
  return content.filter(item => {
    // Search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const matchesSearch = 
        item.title.toLowerCase().includes(term) ||
        item.description?.toLowerCase().includes(term) ||
        item.author.toLowerCase().includes(term) ||
        item.tags.some(tag => tag.toLowerCase().includes(term));
      
      if (!matchesSearch) return false;
    }
    
    // Type filter
    if (filters.type && item.type !== filters.type) {
      return false;
    }
    
    // Author filter
    if (filters.author && !item.author.toLowerCase().includes(filters.author.toLowerCase())) {
      return false;
    }
    
    // Tags filter
    if (filters.tags && filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tag => item.tags.includes(tag));
      if (!hasMatchingTag) return false;
    }
    
    // Published filter
    if (filters.isPublished !== undefined && item.isPublished !== filters.isPublished) {
      return false;
    }
    
    return true;
  });
}

/**
 * Generate thumbnail URL for content
 */
export function getThumbnailUrl(content: Content): string | null {
  if (content.thumbnailUrl) {
    return content.thumbnailUrl;
  }
  
  // Return default thumbnails based on content type
  const defaultThumbnails = {
    video: '/images/default-video-thumbnail.jpg',
    writing: '/images/default-writing-thumbnail.jpg',
    music: '/images/default-music-thumbnail.jpg',
  };
  
  return defaultThumbnails[content.type] || null;
}

/**
 * Get content URL with CDN optimization
 */
export function getOptimizedContentUrl(content: Content, quality?: string): string {
  if (content.type === 'video' && 'processedFormats' in content && quality) {
    const format = content.processedFormats.find(f => f.resolution === quality);
    if (format) {
      return format.url;
    }
  }
  
  return content.fileUrl;
}

/**
 * Check if content is accessible (not expired, not private, etc.)
 */
export function isContentAccessible(content: Content): boolean {
  // Add your access control logic here
  return content.isPublished;
}

/**
 * Generate content metadata for SEO
 */
export function generateContentMetadata(content: Content) {
  const baseMetadata = {
    title: content.title,
    description: content.description || generateExcerpt(content.title, 160),
    author: content.author,
    keywords: content.tags.join(', '),
    type: content.type,
    createdAt: content.createdAt,
    updatedAt: content.updatedAt,
  };
  
  if (content.type === 'video' && 'duration' in content) {
    return {
      ...baseMetadata,
      duration: content.duration,
      videoUrl: content.fileUrl,
      thumbnailUrl: content.thumbnailUrl,
    };
  }
  
  if (content.type === 'writing' && 'wordCount' in content) {
    return {
      ...baseMetadata,
      wordCount: content.wordCount,
      readingTime: content.readingTime,
      excerpt: content.excerpt,
    };
  }
  
  if (content.type === 'music' && 'duration' in content) {
    return {
      ...baseMetadata,
      duration: content.duration,
      artist: content.artist,
      album: 'album' in content ? content.album : undefined,
      genre: 'genre' in content ? content.genre : undefined,
    };
  }
  
  return baseMetadata;
}