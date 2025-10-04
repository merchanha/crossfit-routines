import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { User } from './entities/user.entity';
import { UserStatsDto } from './dto/user-stats.dto';
import type { ImageStorageService } from '../common/interfaces/image-storage.interface';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject('IMAGE_STORAGE_SERVICE')
    private readonly imageStorageService: ImageStorageService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { email, name, password, profilePicture } = createUserDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Create new user
    const user = this.userRepository.create({
      email,
      name,
      password,
      profilePicture,
    });

    return this.userRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: [
        'id',
        'email',
        'name',
        'profilePicture',
        'createdAt',
        'updatedAt',
      ],
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: [
        'id',
        'email',
        'name',
        'profilePicture',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email is being changed and if it's already taken
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    // Update user
    Object.assign(user, updateUserDto);
    return this.userRepository.save(user);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    await this.userRepository.softDelete(id);
  }

  async getUserStats(userId: string): Promise<UserStatsDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['scheduledWorkouts', 'routines'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      totalWorkouts: user.scheduledWorkouts?.length || 0,
      currentStreak: user.stats.currentStreak,
      favoriteExercise: user.stats.favoriteExercise,
    };
  }

  async updateProfile(
    userId: string,
    updateData: UpdateUserDto,
  ): Promise<User> {
    return this.update(userId, updateData);
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Validate current password
    const isCurrentPasswordValid = await user.validatePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Update password
    user.password = newPassword;
    await this.userRepository.save(user);
  }

  async uploadProfileImage(
    userId: string,
    file: Express.Multer.File,
  ): Promise<{ message: string; imageUrl: string }> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.',
      );
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File too large. Maximum size is 5MB.');
    }

    // Get current user to check for existing profile picture
    const user = await this.findOne(userId);

    // Delete old profile picture if it exists
    if (user.profilePicture) {
      try {
        // Extract fileId from URL (this will depend on the storage provider)
        const fileId = this.extractFileIdFromUrl(user.profilePicture);
        if (fileId) {
          await this.imageStorageService.deleteImage(fileId);
        }
      } catch (error) {
        console.warn('Failed to delete old profile picture:', error.message);
      }
    }

    // Upload new image using the storage service
    const uploadResult = await this.imageStorageService.uploadImage(
      file,
      'profiles',
    );

    // Update user's profile picture
    user.profilePicture = uploadResult.url;
    await this.userRepository.save(user);

    return {
      message: 'Image uploaded successfully',
      imageUrl: uploadResult.url,
    };
  }

  private extractFileIdFromUrl(url: string): string | null {
    // This method extracts the file ID from the URL
    // For local storage: /uploads/profiles/filename.ext -> filename.ext
    // For ImageKit: https://ik.imagekit.io/.../filename -> fileId from ImageKit
    if (url.startsWith('/uploads/')) {
      return url.split('/').pop() || null;
    }
    // For cloud providers, you might need to implement specific logic
    // For now, return null to avoid errors
    return null;
  }
}
