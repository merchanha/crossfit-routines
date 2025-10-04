import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary } from 'cloudinary';
import {
  ImageStorageService,
  ImageUploadResult,
} from '../interfaces/image-storage.interface';

@Injectable()
export class CloudinaryService implements ImageStorageService {
  constructor(private configService: ConfigService) {
    const cloudName = this.configService.get<string>('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.configService.get<string>('CLOUDINARY_API_KEY');
    const apiSecret = this.configService.get<string>('CLOUDINARY_API_SECRET');

    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error(
        'Cloudinary configuration is missing. Please check your environment variables.',
      );
    }

    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'profiles',
  ): Promise<ImageUploadResult> {
    try {
      // Convert buffer to base64 string for Cloudinary
      const base64String = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;

      const uploadResult = await cloudinary.uploader.upload(base64String, {
        folder: folder,
        use_filename: true,
        unique_filename: true,
        resource_type: 'auto',
      });

      return {
        url: uploadResult.secure_url,
        fileId: uploadResult.public_id,
        fileName: uploadResult.original_filename || file.originalname,
      };
    } catch (error) {
      throw new Error(`Failed to upload image to Cloudinary: ${error.message}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(fileId);
    } catch (error) {
      throw new Error(
        `Failed to delete image from Cloudinary: ${error.message}`,
      );
    }
  }

  getImageUrl(fileId: string, transformations?: any): string {
    return cloudinary.url(fileId, {
      fetch_format: 'auto',
      quality: 'auto',
      ...transformations,
    });
  }
}
