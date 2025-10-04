import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  ImageStorageService,
  ImageUploadResult,
} from '../interfaces/image-storage.interface';

@Injectable()
export class LocalStorageService implements ImageStorageService {
  async uploadImage(
    file: Express.Multer.File,
    folder: string = 'profiles',
  ): Promise<ImageUploadResult> {
    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'uploads', folder);
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const fileName = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadsDir, fileName);

    // Save file
    fs.writeFileSync(filePath, file.buffer);

    // Generate URL
    const url = `/uploads/${folder}/${fileName}`;

    return {
      url,
      fileId: fileName,
      fileName: file.originalname,
    };
  }

  async deleteImage(fileId: string): Promise<void> {
    // For local storage, fileId is the filename
    const filePath = path.join(process.cwd(), 'uploads', 'profiles', fileId);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  getImageUrl(fileId: string, transformations?: any): string {
    // For local storage, return the relative path
    return `/uploads/profiles/${fileId}`;
  }
}
