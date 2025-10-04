import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
// @ts-ignore - ImageKit doesn't have TypeScript definitions
import ImageKit from 'imagekit';
import {
  ImageStorageService,
  ImageUploadResult,
} from '../interfaces/image-storage.interface';

@Injectable()
export class ImageKitService implements ImageStorageService {
  private imagekit: ImageKit;

  constructor(private configService: ConfigService) {
    const publicKey = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY');
    const privateKey = this.configService.get<string>('IMAGEKIT_PRIVATE_KEY');
    const urlEndpoint = this.configService.get<string>('IMAGEKIT_URL_ENDPOINT');

    if (!publicKey || !privateKey || !urlEndpoint) {
      throw new Error(
        'ImageKit configuration is missing. Please check your environment variables.',
      );
    }

    this.imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    });
  }

  private generateSignature(privateKey: string, timestamp: number): string {
    return crypto
      .createHmac('sha1', privateKey)
      .update(timestamp.toString())
      .digest('hex');
  }

  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'profiles',
  ): Promise<ImageUploadResult> {
    try {
      // Generate authentication parameters for server-side upload
      const timestamp = Math.floor(Date.now() / 1000);
      const signature = this.generateSignature(
        this.configService.get<string>('IMAGEKIT_PRIVATE_KEY')!,
        timestamp,
      );
      const token = this.configService.get<string>('IMAGEKIT_PUBLIC_KEY')!;
      const expire = timestamp + 3600; // 1 hour expiry

      // @ts-ignore - ImageKit upload method with auth parameters
      const uploadResult: any = await this.imagekit.upload({
        file: file.buffer,
        fileName: file.originalname,
        folder: `/${folder}`,
        useUniqueFileName: true,
        // @ts-ignore - auth parameters for ImageKit v3+
        token,
        signature,
        expire,
      });

      return {
        url: uploadResult.url,
        fileId: uploadResult.fileId,
        fileName: uploadResult.name,
      };
    } catch (error) {
      throw new Error(`Failed to upload image to ImageKit: ${error.message}`);
    }
  }

  async deleteImage(fileId: string): Promise<void> {
    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      throw new Error(`Failed to delete image from ImageKit: ${error.message}`);
    }
  }

  getImageUrl(fileId: string, transformations?: any): string {
    return this.imagekit.url({
      src: fileId,
      transformation: transformations,
    });
  }
}
