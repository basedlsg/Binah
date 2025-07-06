import { NextRequest, NextResponse } from 'next/server';
import { storageService } from '@/services/storage';
import { processingService } from '@/services/processing';
import { ContentType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const contentType = formData.get('contentType') as ContentType;
    const title = formData.get('title') as string;
    const description = formData.get('description') as string;
    const tags = formData.get('tags') as string;
    const author = formData.get('author') as string;

    if (!file || !contentType || !title || !author) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const contentId = uuidv4();

    // Upload original file
    const uploadResult = await storageService.uploadFile({
      contentType,
      originalName: file.name,
      buffer,
      metadata: {
        contentId,
        title,
        author,
        originalSize: file.size.toString(),
      },
    });

    let processedContent;
    let thumbnailUrl = '';

    // Process content based on type
    switch (contentType) {
      case 'video':
        const videoResult = await processingService.processVideo({
          inputBuffer: buffer,
          outputFormats: [
            { format: 'mp4', resolution: '1920x1080', bitrate: 2000 },
            { format: 'mp4', resolution: '1280x720', bitrate: 1000 },
            { format: 'mp4', resolution: '854x480', bitrate: 500 },
          ],
        });

        // Upload processed formats
        const processedFormats = [];
        for (const format of videoResult.processedFormats) {
          const formatUpload = await storageService.uploadFile({
            contentType: 'video',
            originalName: `${title}_${format.resolution}.${format.format}`,
            buffer: format.buffer,
            metadata: {
              contentId,
              resolution: format.resolution,
              bitrate: format.bitrate.toString(),
            },
          });

          processedFormats.push({
            format: format.format,
            url: formatUpload.cdnUrl,
            resolution: format.resolution,
            bitrate: format.bitrate,
          });
        }

        // Upload thumbnail
        thumbnailUrl = await storageService.uploadThumbnail(
          contentId,
          videoResult.thumbnailBuffer
        );

        processedContent = {
          id: contentId,
          title,
          description,
          type: contentType,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          fileUrl: uploadResult.cdnUrl,
          thumbnailUrl,
          fileSize: file.size,
          author,
          isPublished: false,
          duration: videoResult.duration,
          resolution: videoResult.resolution,
          codec: videoResult.codec,
          bitrate: videoResult.bitrate,
          processedFormats,
        };
        break;

      case 'writing':
        const writingResult = await processingService.processWriting({
          content: buffer.toString('utf-8'),
          format: 'markdown',
        });

        processedContent = {
          id: contentId,
          title,
          description,
          type: contentType,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          fileUrl: uploadResult.cdnUrl,
          fileSize: file.size,
          author,
          isPublished: false,
          content: writingResult.processedContent,
          wordCount: writingResult.wordCount,
          readingTime: writingResult.readingTime,
          format: 'markdown' as const,
          excerpt: writingResult.excerpt,
        };
        break;

      case 'music':
        const musicResult = await processingService.processMusic({
          inputBuffer: buffer,
          filename: file.name,
        });

        // Generate audio thumbnail
        const audioThumbnailBuffer = await processingService.generateThumbnail(
          file.type,
          buffer
        );
        thumbnailUrl = await storageService.uploadThumbnail(
          contentId,
          audioThumbnailBuffer
        );

        processedContent = {
          id: contentId,
          title,
          description,
          type: contentType,
          createdAt: new Date(),
          updatedAt: new Date(),
          tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
          fileUrl: uploadResult.cdnUrl,
          thumbnailUrl,
          fileSize: file.size,
          author,
          isPublished: false,
          duration: musicResult.duration,
          genre: musicResult.genre,
          bpm: musicResult.bpm,
          artist: musicResult.metadata.artist,
          waveformData: musicResult.waveformData,
          metadata: musicResult.metadata,
        };
        break;

      default:
        return NextResponse.json(
          { error: 'Unsupported content type' },
          { status: 400 }
        );
    }

    // In a real application, you would save this to a database
    // For now, we'll just return the processed content
    return NextResponse.json({
      success: true,
      data: processedContent,
      message: 'Content uploaded successfully',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Upload endpoint - use POST to upload files',
  });
}