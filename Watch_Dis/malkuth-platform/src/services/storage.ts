import { Storage } from '@google-cloud/storage';
import { v4 as uuidv4 } from 'uuid';
import { ContentType } from '@/types';

interface UploadOptions {
  contentType: ContentType;
  originalName: string;
  buffer: Buffer;
  metadata?: Record<string, string>;
}

interface UploadResult {
  fileUrl: string;
  fileName: string;
  publicUrl: string;
  cdnUrl: string;
}

class StorageService {
  private storage: Storage;
  private bucketName: string;
  private cdnBaseUrl: string;

  constructor() {
    this.storage = new Storage({
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
    });
    this.bucketName = process.env.GOOGLE_CLOUD_STORAGE_BUCKET || 'malkuth-content';
    this.cdnBaseUrl = process.env.CDN_BASE_URL || `https://storage.googleapis.com/${this.bucketName}`;
  }

  private getFolderPath(contentType: ContentType): string {
    switch (contentType) {
      case 'video':
        return 'videos';
      case 'writing':
        return 'writing';
      case 'music':
        return 'music';
      default:
        return 'misc';
    }
  }

  private getFileExtension(originalName: string): string {
    return originalName.split('.').pop()?.toLowerCase() || '';
  }

  async uploadFile(options: UploadOptions): Promise<UploadResult> {
    const { contentType, originalName, buffer, metadata = {} } = options;
    const fileExtension = this.getFileExtension(originalName);
    const fileName = `${uuidv4()}.${fileExtension}`;
    const folderPath = this.getFolderPath(contentType);
    const filePath = `${folderPath}/${fileName}`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    // Set metadata for the file
    const fileMetadata = {
      metadata: {
        ...metadata,
        originalName,
        uploadedAt: new Date().toISOString(),
        contentType: contentType,
      },
    };

    // Upload file
    await file.save(buffer, {
      metadata: fileMetadata,
      public: true,
      validation: 'crc32c',
    });

    // Generate URLs
    const publicUrl = `https://storage.googleapis.com/${this.bucketName}/${filePath}`;
    const cdnUrl = `${this.cdnBaseUrl}/${filePath}`;

    return {
      fileUrl: filePath,
      fileName,
      publicUrl,
      cdnUrl,
    };
  }

  async uploadThumbnail(contentId: string, buffer: Buffer): Promise<string> {
    const fileName = `${contentId}-thumbnail.jpg`;
    const filePath = `thumbnails/${fileName}`;

    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    await file.save(buffer, {
      metadata: {
        contentType: 'image/jpeg',
        metadata: {
          type: 'thumbnail',
          contentId,
          generatedAt: new Date().toISOString(),
        },
      },
      public: true,
    });

    return `${this.cdnBaseUrl}/${filePath}`;
  }

  async getSignedUrl(filePath: string, expiresInMinutes: number = 60): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    const [url] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + expiresInMinutes * 60 * 1000,
    });

    return url;
  }

  async deleteFile(filePath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    await file.delete();
  }

  async copyFile(sourcePath: string, destinationPath: string): Promise<void> {
    const bucket = this.storage.bucket(this.bucketName);
    const sourceFile = bucket.file(sourcePath);
    const destinationFile = bucket.file(destinationPath);

    await sourceFile.copy(destinationFile);
  }

  async getFileMetadata(filePath: string): Promise<any> {
    const bucket = this.storage.bucket(this.bucketName);
    const file = bucket.file(filePath);

    const [metadata] = await file.getMetadata();
    return metadata;
  }

  async listFiles(contentType?: ContentType, prefix?: string): Promise<string[]> {
    const bucket = this.storage.bucket(this.bucketName);
    const folderPath = contentType ? this.getFolderPath(contentType) : '';
    const searchPrefix = prefix ? `${folderPath}/${prefix}` : folderPath;

    const [files] = await bucket.getFiles({ prefix: searchPrefix });
    return files.map(file => file.name);
  }

  generateCdnUrl(filePath: string): string {
    return `${this.cdnBaseUrl}/${filePath}`;
  }
}

export const storageService = new StorageService();