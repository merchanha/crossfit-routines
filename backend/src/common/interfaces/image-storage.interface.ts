export interface ImageUploadResult {
  url: string;
  fileId: string;
  fileName: string;
}

export interface ImageStorageService {
  uploadImage(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<ImageUploadResult>;

  deleteImage(fileId: string): Promise<void>;

  getImageUrl(fileId: string, transformations?: any): string;
}
