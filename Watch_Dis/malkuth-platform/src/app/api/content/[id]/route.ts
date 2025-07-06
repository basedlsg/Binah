import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/services/storage';

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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find content by ID
    const content = mockContent.find(item => item.id === id);
    
    if (!content) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Generate signed URL for secure access if needed
    const includeSignedUrl = request.nextUrl.searchParams.get('signed') === 'true';
    
    if (includeSignedUrl) {
      try {
        const signedUrl = await storageService.getSignedUrl(content.fileUrl, 60);
        return NextResponse.json({
          success: true,
          data: {
            ...content,
            signedUrl,
          },
        });
      } catch (error) {
        console.error('Failed to generate signed URL:', error);
        // Return content without signed URL if generation fails
      }
    }

    return NextResponse.json({
      success: true,
      data: content,
    });

  } catch (error) {
    console.error('Content retrieval error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const updateData = await request.json();
    
    // Find content by ID
    const contentIndex = mockContent.findIndex(item => item.id === id);
    
    if (contentIndex === -1) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    // Update content
    const updatedContent = {
      ...mockContent[contentIndex],
      ...updateData,
      updatedAt: new Date(),
    };

    // In a real application, you would update this in a database
    mockContent[contentIndex] = updatedContent;

    return NextResponse.json({
      success: true,
      data: updatedContent,
      message: 'Content updated successfully',
    });

  } catch (error) {
    console.error('Content update error:', error);
    return NextResponse.json(
      { error: 'Failed to update content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Find content by ID
    const contentIndex = mockContent.findIndex(item => item.id === id);
    
    if (contentIndex === -1) {
      return NextResponse.json(
        { error: 'Content not found' },
        { status: 404 }
      );
    }

    const content = mockContent[contentIndex];

    // Delete files from storage
    try {
      await storageService.deleteFile(content.fileUrl);
      
      if (content.thumbnailUrl) {
        await storageService.deleteFile(content.thumbnailUrl);
      }

      // Delete processed formats if they exist
      if ('processedFormats' in content && content.processedFormats) {
        for (const format of content.processedFormats) {
          await storageService.deleteFile(format.url);
        }
      }
    } catch (storageError) {
      console.error('Failed to delete files from storage:', storageError);
      // Continue with deletion even if storage cleanup fails
    }

    // Remove from mock database
    mockContent.splice(contentIndex, 1);

    return NextResponse.json({
      success: true,
      message: 'Content deleted successfully',
    });

  } catch (error) {
    console.error('Content deletion error:', error);
    return NextResponse.json(
      { error: 'Failed to delete content', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}