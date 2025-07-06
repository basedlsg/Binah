import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import { parseFile } from 'music-metadata';
import MarkdownIt from 'markdown-it';
import { storageService } from './storage';

// Set FFmpeg binary path
if (ffmpegStatic) {
  ffmpeg.setFfmpegPath(ffmpegStatic);
}

interface VideoProcessingOptions {
  inputBuffer: Buffer;
  outputFormats: Array<{
    format: string;
    resolution: string;
    bitrate: number;
  }>;
}

interface VideoProcessingResult {
  duration: number;
  resolution: string;
  codec: string;
  bitrate: number;
  thumbnailBuffer: Buffer;
  processedFormats: Array<{
    format: string;
    url: string;
    resolution: string;
    bitrate: number;
    buffer: Buffer;
  }>;
}

interface WritingProcessingOptions {
  content: string;
  format: 'markdown' | 'html';
}

interface WritingProcessingResult {
  processedContent: string;
  wordCount: number;
  readingTime: number;
  excerpt: string;
}

interface MusicProcessingOptions {
  inputBuffer: Buffer;
  filename: string;
}

interface MusicProcessingResult {
  metadata: {
    title: string;
    artist: string;
    album?: string;
    year?: number;
    genre?: string;
    duration: number;
    bitrate: number;
    sampleRate: number;
  };
  waveformData: number[];
  duration: number;
  genre?: string;
  bpm?: number;
}

class ProcessingService {
  private markdown: MarkdownIt;

  constructor() {
    this.markdown = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
    });
  }

  async processVideo(options: VideoProcessingOptions): Promise<VideoProcessingResult> {
    const { inputBuffer, outputFormats } = options;
    
    return new Promise((resolve, reject) => {
      const tempInputPath = `/tmp/input_${Date.now()}.mp4`;
      const tempThumbnailPath = `/tmp/thumbnail_${Date.now()}.jpg`;
      
      // Write input buffer to temporary file
      require('fs').writeFileSync(tempInputPath, inputBuffer);
      
      // Get video metadata
      ffmpeg.ffprobe(tempInputPath, async (err, metadata) => {
        if (err) {
          reject(err);
          return;
        }

        const videoStream = metadata.streams.find(s => s.codec_type === 'video');
        if (!videoStream) {
          reject(new Error('No video stream found'));
          return;
        }

        const duration = metadata.format.duration || 0;
        const resolution = `${videoStream.width}x${videoStream.height}`;
        const codec = videoStream.codec_name || 'unknown';
        const bitrate = parseInt(videoStream.bit_rate || '0');

        // Generate thumbnail
        ffmpeg(tempInputPath)
          .screenshots({
            timestamps: ['10%'],
            filename: 'thumbnail.jpg',
            folder: '/tmp',
            size: '320x240'
          })
          .on('end', async () => {
            const thumbnailBuffer = require('fs').readFileSync(tempThumbnailPath);
            
            // Process video formats
            const processedFormats = [];
            
            for (const format of outputFormats) {
              const outputPath = `/tmp/output_${Date.now()}_${format.resolution}.${format.format}`;
              
              await new Promise<void>((resolveFormat, rejectFormat) => {
                ffmpeg(tempInputPath)
                  .output(outputPath)
                  .videoCodec('libx264')
                  .audioCodec('aac')
                  .size(format.resolution)
                  .videoBitrate(format.bitrate)
                  .audioBitrate('128k')
                  .on('end', () => {
                    const buffer = require('fs').readFileSync(outputPath);
                    processedFormats.push({
                      format: format.format,
                      url: '', // Will be set after upload
                      resolution: format.resolution,
                      bitrate: format.bitrate,
                      buffer
                    });
                    resolveFormat();
                  })
                  .on('error', rejectFormat)
                  .run();
              });
            }

            // Clean up temporary files
            require('fs').unlinkSync(tempInputPath);
            require('fs').unlinkSync(tempThumbnailPath);

            resolve({
              duration,
              resolution,
              codec,
              bitrate,
              thumbnailBuffer,
              processedFormats
            });
          })
          .on('error', reject);
      });
    });
  }

  async processWriting(options: WritingProcessingOptions): Promise<WritingProcessingResult> {
    const { content, format } = options;
    
    let processedContent: string;
    
    if (format === 'markdown') {
      processedContent = this.markdown.render(content);
    } else {
      processedContent = content;
    }

    // Calculate word count
    const wordCount = content.trim().split(/\s+/).length;
    
    // Calculate reading time (average 200 words per minute)
    const readingTime = Math.ceil(wordCount / 200);
    
    // Generate excerpt (first 150 characters)
    const excerpt = content.substring(0, 150) + (content.length > 150 ? '...' : '');

    return {
      processedContent,
      wordCount,
      readingTime,
      excerpt: excerpt.replace(/[#*_`]/g, '').trim()
    };
  }

  async processMusic(options: MusicProcessingOptions): Promise<MusicProcessingResult> {
    const { inputBuffer, filename } = options;
    
    // Parse metadata
    const metadata = await parseFile(inputBuffer);
    
    // Generate waveform data
    const waveformData = await this.generateWaveformData(inputBuffer);
    
    // Extract BPM if available
    const bpm = this.extractBPM(metadata);
    
    return {
      metadata: {
        title: metadata.common.title || filename,
        artist: metadata.common.artist || 'Unknown Artist',
        album: metadata.common.album,
        year: metadata.common.year,
        genre: metadata.common.genre?.[0],
        duration: metadata.format.duration || 0,
        bitrate: metadata.format.bitrate || 0,
        sampleRate: metadata.format.sampleRate || 0,
      },
      waveformData,
      duration: metadata.format.duration || 0,
      genre: metadata.common.genre?.[0],
      bpm
    };
  }

  private async generateWaveformData(audioBuffer: Buffer): Promise<number[]> {
    // This is a simplified implementation
    // In a real application, you would use a proper audio analysis library
    const sampleCount = 1000;
    const waveformData: number[] = [];
    
    // Generate mock waveform data based on buffer size
    for (let i = 0; i < sampleCount; i++) {
      const position = Math.floor((i / sampleCount) * audioBuffer.length);
      const sample = audioBuffer[position] || 0;
      waveformData.push(sample / 255); // Normalize to 0-1
    }
    
    return waveformData;
  }

  private extractBPM(metadata: any): number | undefined {
    // Try to extract BPM from various metadata fields
    if (metadata.common.bpm) {
      return metadata.common.bpm;
    }
    
    // Look for BPM in additional tags
    if (metadata.native) {
      for (const format of Object.values(metadata.native)) {
        if (Array.isArray(format)) {
          for (const tag of format) {
            if (tag.id?.toLowerCase().includes('bpm') && typeof tag.value === 'number') {
              return tag.value;
            }
          }
        }
      }
    }
    
    return undefined;
  }

  async generateThumbnail(contentType: string, buffer: Buffer): Promise<Buffer> {
    if (contentType.startsWith('video/')) {
      // For videos, extract frame at 10% of duration
      const tempPath = `/tmp/input_${Date.now()}.mp4`;
      const thumbnailPath = `/tmp/thumbnail_${Date.now()}.jpg`;
      
      require('fs').writeFileSync(tempPath, buffer);
      
      return new Promise((resolve, reject) => {
        ffmpeg(tempPath)
          .screenshots({
            timestamps: ['10%'],
            filename: 'thumbnail.jpg',
            folder: '/tmp',
            size: '320x240'
          })
          .on('end', () => {
            const thumbnailBuffer = require('fs').readFileSync(thumbnailPath);
            require('fs').unlinkSync(tempPath);
            require('fs').unlinkSync(thumbnailPath);
            resolve(thumbnailBuffer);
          })
          .on('error', reject);
      });
    } else if (contentType.startsWith('audio/')) {
      // For audio, generate a simple waveform thumbnail
      return this.generateAudioThumbnail(buffer);
    } else {
      // For other types, generate a placeholder
      return this.generatePlaceholderThumbnail();
    }
  }

  private async generateAudioThumbnail(buffer: Buffer): Promise<Buffer> {
    // Generate a simple waveform visualization
    // This is a placeholder implementation
    const canvas = require('canvas');
    const width = 320;
    const height = 240;
    const canvasElement = canvas.createCanvas(width, height);
    const ctx = canvasElement.getContext('2d');
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // White waveform
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    
    // Draw simplified waveform
    ctx.beginPath();
    const samples = 100;
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * width;
      const y = height / 2 + Math.sin(i * 0.1) * 50;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.stroke();
    
    return canvasElement.toBuffer('image/jpeg');
  }

  private async generatePlaceholderThumbnail(): Promise<Buffer> {
    const canvas = require('canvas');
    const width = 320;
    const height = 240;
    const canvasElement = canvas.createCanvas(width, height);
    const ctx = canvasElement.getContext('2d');
    
    // Black background
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, width, height);
    
    // White border
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    
    // White text
    ctx.fillStyle = '#FFFFFF';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('MALKUTH', width / 2, height / 2);
    
    return canvasElement.toBuffer('image/jpeg');
  }
}

export const processingService = new ProcessingService();