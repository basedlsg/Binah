import { NextRequest, NextResponse } from 'next/server';
import { ContentFilter } from '@/types';

// Mock database - in a real application, this would be a proper database
const mockContent = [
  {
    id: '1',
    title: 'Sample Video',
    description: 'A sample video for testing',
    type: 'video' as const,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    tags: ['sample', 'test'],
    fileUrl: 'https://example.com/video.mp4',
    thumbnailUrl: 'https://example.com/thumbnail.jpg',
    fileSize: 1024000,
    author: 'Test User',
    isPublished: true,
    duration: 120,
    resolution: '1920x1080',
    codec: 'h264',
    bitrate: 2000,
    processedFormats: [
      {
        format: 'mp4',
        url: 'https://example.com/video_1080p.mp4',
        resolution: '1920x1080',
        bitrate: 2000,
      },
      {
        format: 'mp4',
        url: 'https://example.com/video_720p.mp4',
        resolution: '1280x720',
        bitrate: 1000,
      },
    ],
  },
  {
    id: '2',
    title: 'Sample Article',
    description: 'A sample article for testing',
    type: 'writing' as const,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    tags: ['article', 'test'],
    fileUrl: 'https://example.com/article.md',
    fileSize: 5000,
    author: 'Test Author',
    isPublished: true,
    content: '<h1>Sample Article</h1><p>This is a sample article.</p>',
    wordCount: 500,
    readingTime: 3,
    format: 'markdown' as const,
    excerpt: 'This is a sample article for testing purposes...',
  },
  {
    id: '3',
    title: 'Sample Music',
    description: 'A sample music track for testing',
    type: 'music' as const,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    tags: ['music', 'test'],
    fileUrl: 'https://example.com/music.mp3',
    thumbnailUrl: 'https://example.com/waveform.jpg',
    fileSize: 8000000,
    author: 'Test Artist',
    isPublished: true,
    duration: 180,
    genre: 'Electronic',
    bpm: 120,
    artist: 'Test Artist',
    waveformData: new Array(1000).fill(0).map(() => Math.random()),
    metadata: {
      title: 'Sample Music',
      artist: 'Test Artist',
      album: 'Test Album',
      year: 2024,
      genre: 'Electronic',
      duration: 180,
      bitrate: 320,
      sampleRate: 44100,
    },
  },
];

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const searchParams = url.searchParams;

    // Parse query parameters
    const filter: ContentFilter = {
      type: searchParams.get('type') as any,
      author: searchParams.get('author') || undefined,
      isPublished: searchParams.get('isPublished') === 'true' ? true : 
                   searchParams.get('isPublished') === 'false' ? false : undefined,
      search: searchParams.get('search') || undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
    };

    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    // Filter content
    let filteredContent = mockContent;

    if (filter.type) {
      filteredContent = filteredContent.filter(item => item.type === filter.type);
    }

    if (filter.author) {
      filteredContent = filteredContent.filter(item => 
        item.author.toLowerCase().includes(filter.author!.toLowerCase())
      );
    }

    if (filter.isPublished !== undefined) {
      filteredContent = filteredContent.filter(item => item.isPublished === filter.isPublished);
    }

    if (filter.search) {
      const searchTerm = filter.search.toLowerCase();
      filteredContent = filteredContent.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }

    if (filter.tags && filter.tags.length > 0) {
      filteredContent = filteredContent.filter(item =>
        filter.tags!.some(tag => item.tags.includes(tag))
      );
    }

    // Sort content
    filteredContent.sort((a, b) => {
      const aValue = a[sortBy as keyof typeof a];
      const bValue = b[sortBy as keyof typeof b];
      
      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    // Paginate
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedContent = filteredContent.slice(startIndex, endIndex);

    // Calculate pagination info
    const totalItems = filteredContent.length;
    const totalPages = Math.ceil(totalItems / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return NextResponse.json({
      success: true,
      data: paginatedContent,
      pagination: {
        page,
        limit,
        totalItems,
        totalPages,
        hasNextPage,
        hasPreviousPage,
      },
      filters: filter,
    });

  } catch (error) {
    console.error('Content listing error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const contentData = await request.json();
    
    // Validate required fields
    if (!contentData.title || !contentData.type || !contentData.author) {
      return NextResponse.json(
        { error: 'Missing required fields: title, type, author' },
        { status: 400 }
      );
    }

    // Create new content
    const newContent = {
      id: Date.now().toString(),
      createdAt: new Date(),
      updatedAt: new Date(),
      isPublished: false,
      tags: [],
      ...contentData,
    };

    // In a real application, you would save this to a database
    mockContent.push(newContent);

    return NextResponse.json({
      success: true,
      data: newContent,
      message: 'Content created successfully',
    });

  } catch (error) {
    console.error('Content creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}