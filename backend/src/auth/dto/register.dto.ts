import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    minLength: 2,
    maxLength: 100,
  })
  @IsString({ message: 'Name must be a string' })
  @MinLength(2, { message: 'Name must be at least 2 characters long' })
  @MaxLength(100, { message: 'Name must not exceed 100 characters' })
  @IsNotEmpty({ message: 'Name is required' })
  name: string;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
