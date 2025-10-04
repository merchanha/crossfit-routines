import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ImageStorageService } from '../interfaces/image-storage.interface';
import { CloudinaryService } from './cloudinary.service';
import { LocalStorageService } from './local-storage.service';

@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'IMAGE_STORAGE_SERVICE',
      useFactory: (configService: ConfigService) => {
        const provider = configService.get('IMAGE_STORAGE_PROVIDER', 'local');

        switch (provider) {
          case 'cloudinary':
            return new CloudinaryService(configService);
          case 'local':
          default:
            return new LocalStorageService();
        }
      },
      inject: [ConfigService],
    },
  ],
  exports: ['IMAGE_STORAGE_SERVICE'],
})
export class ImageStorageModule {}
