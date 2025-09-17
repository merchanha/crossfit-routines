# Backend Setup Guide - NestJS

This guide provides a complete setup for the CrossFit Pro backend using NestJS, including entities, schemas, database configuration, and API endpoints.

## 📋 Prerequisites

- Node.js 18+ 
- PostgreSQL (recommended) or MongoDB
- Docker (optional, for database)

## 🚀 Project Setup

### 1. Initialize NestJS Project

```bash
# Install NestJS CLI globally
npm i -g @nestjs/cli

# Create new project
nest new crossfit-pro-backend

# Navigate to project
cd crossfit-pro-backend

# Install additional dependencies
npm install @nestjs/typeorm typeorm pg @nestjs/passport passport passport-jwt @nestjs/jwt
npm install @nestjs/config @nestjs/swagger swagger-ui-express
npm install bcryptjs class-validator class-transformer
npm install --save-dev @types/pg @types/bcryptjs @types/passport-jwt
```

### 2. Environment Configuration

Create `.env` file:

```env
# Database
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=crossfit_pro

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# App
PORT=3001
NODE_ENV=development

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 🗄️ Database Schema & Entities

### Database Choice: PostgreSQL (Recommended)

**Why PostgreSQL?**
- ACID compliance for data integrity
- Excellent JSON support for flexible exercise data
- Strong typing and constraints
- Great performance for complex queries
- Excellent NestJS/TypeORM integration

### Entity Definitions

#### 1. User Entity (`src/entities/user.entity.ts`)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Routine } from './routine.entity';
import { ScheduledWorkout } from './scheduled-workout.entity';
import { WorkoutNote } from './workout-note.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column()
  password: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @OneToMany(() => Routine, (routine) => routine.user)
  routines: Routine[];

  @OneToMany(() => ScheduledWorkout, (scheduledWorkout) => scheduledWorkout.user)
  scheduledWorkouts: ScheduledWorkout[];

  @OneToMany(() => WorkoutNote, (note) => note.user)
  notes: WorkoutNote[];

  // Virtual field for stats (computed)
  get stats() {
    return {
      totalWorkouts: this.scheduledWorkouts?.length || 0,
      currentStreak: this.calculateCurrentStreak(),
      favoriteExercise: this.getFavoriteExercise(),
    };
  }

  private calculateCurrentStreak(): number {
    // Implementation for calculating current streak
    // This would be a computed property based on completed workouts
    return 7; // Placeholder
  }

  private getFavoriteExercise(): string {
    // Implementation for finding most used exercise
    return 'Push-ups'; // Placeholder
  }
}
```

#### 2. Routine Entity (`src/entities/routine.entity.ts`)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ScheduledWorkout } from './scheduled-workout.entity';
import { WorkoutNote } from './workout-note.entity';

@Entity('routines')
export class Routine {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  videoUrl?: string;

  @Column('jsonb')
  exercises: Exercise[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.routines)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => ScheduledWorkout, (scheduledWorkout) => scheduledWorkout.routine)
  scheduledWorkouts: ScheduledWorkout[];

  @OneToMany(() => WorkoutNote, (note) => note.routine)
  notes: WorkoutNote[];
}

// Exercise interface for JSONB storage
export interface Exercise {
  id: string;
  name: string;
  sets?: number;
  reps?: number;
  duration?: string;
  notes?: string;
}
```

#### 3. Scheduled Workout Entity (`src/entities/scheduled-workout.entity.ts`)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Routine } from './routine.entity';

@Entity('scheduled_workouts')
export class ScheduledWorkout {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: false })
  completed: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column()
  routineId: string;

  @ManyToOne(() => Routine, (routine) => routine.scheduledWorkouts)
  @JoinColumn({ name: 'routineId' })
  routine: Routine;

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.scheduledWorkouts)
  @JoinColumn({ name: 'userId' })
  user: User;
}
```

#### 4. Workout Note Entity (`src/entities/workout-note.entity.ts`)

```typescript
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Routine } from './routine.entity';

@Entity('workout_notes')
export class WorkoutNote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'date' })
  date: Date;

  @Column('text')
  content: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Relations
  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.notes)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  routineId?: string;

  @ManyToOne(() => Routine, (routine) => routine.notes)
  @JoinColumn({ name: 'routineId' })
  routine?: Routine;
}
```

## 🔧 Configuration Files

### Database Configuration (`src/config/database.config.ts`)

```typescript
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (
  configService: ConfigService,
): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.get('DATABASE_HOST'),
  port: configService.get('DATABASE_PORT'),
  username: configService.get('DATABASE_USERNAME'),
  password: configService.get('DATABASE_PASSWORD'),
  database: configService.get('DATABASE_NAME'),
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: configService.get('NODE_ENV') === 'development',
  logging: configService.get('NODE_ENV') === 'development',
  ssl: configService.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
});
```

### App Module (`src/app.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getDatabaseConfig } from './config/database.config';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RoutinesModule } from './routines/routines.module';
import { ScheduledWorkoutsModule } from './scheduled-workouts/scheduled-workouts.module';
import { NotesModule } from './notes/notes.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: getDatabaseConfig,
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RoutinesModule,
    ScheduledWorkoutsModule,
    NotesModule,
  ],
})
export class AppModule {}
```

## 🔐 Authentication & Authorization

### JWT Strategy (`src/auth/jwt.strategy.ts`)

```typescript
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET'),
    });
  }

  async validate(payload: any) {
    return { userId: payload.sub, email: payload.email };
  }
}
```

### Auth Module (`src/auth/auth.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [AuthService, JwtStrategy],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
```

## 📡 API Controllers & Services

### Users Controller (`src/users/users.controller.ts`)

```typescript
import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.usersService.findById(req.user.userId);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(req.user.userId, updateUserDto);
  }

  @Get('stats')
  async getUserStats(@Request() req) {
    return this.usersService.getUserStats(req.user.userId);
  }
}
```

### Routines Controller (`src/routines/routines.controller.ts`)

```typescript
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RoutinesService } from './routines.service';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';

@ApiTags('routines')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('routines')
export class RoutinesController {
  constructor(private readonly routinesService: RoutinesService) {}

  @Post()
  create(@Request() req, @Body() createRoutineDto: CreateRoutineDto) {
    return this.routinesService.create(req.user.userId, createRoutineDto);
  }

  @Get()
  findAll(@Request() req) {
    return this.routinesService.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.routinesService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateRoutineDto: UpdateRoutineDto,
    @Request() req,
  ) {
    return this.routinesService.update(id, req.user.userId, updateRoutineDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.routinesService.remove(id, req.user.userId);
  }
}
```

## 📝 DTOs (Data Transfer Objects)

### Create Routine DTO (`src/routines/dto/create-routine.dto.ts`)

```typescript
import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ExerciseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ required: false })
  @IsOptional()
  sets?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  reps?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  duration?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRoutineDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  videoUrl?: string;

  @ApiProperty({ type: [ExerciseDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExerciseDto)
  exercises: ExerciseDto[];
}
```

## 🚀 Running the Backend

### Development Commands

```bash
# Start development server
npm run start:dev

# Build for production
npm run build

# Start production server
npm run start:prod

# Run database migrations
npm run migration:run

# Generate migration
npm run migration:generate -- -n MigrationName
```

### Docker Setup (Optional)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: crossfit-postgres
    environment:
      POSTGRES_DB: crossfit_pro
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

## 🔗 Frontend Integration

### Update Frontend API Configuration

In your frontend `src/api/index.ts`, update the base URL:

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3001/api";
```

### Environment Variables for Frontend

Create `.env` in your frontend project:

```env
VITE_API_URL=http://localhost:3001/api
```

## 📚 Additional Resources

### Recommended Packages

```bash
# Validation and transformation
npm install class-validator class-transformer

# Swagger documentation
npm install @nestjs/swagger swagger-ui-express

# Rate limiting
npm install @nestjs/throttler

# File upload
npm install @nestjs/platform-express multer

# Caching
npm install @nestjs/cache-manager cache-manager
```

### Database Migration Example

```typescript
// src/migrations/1234567890-InitialSchema.ts
import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1234567890 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying NOT NULL,
        "name" character varying NOT NULL,
        "profilePicture" character varying,
        "password" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_users_id" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_users_email" UNIQUE ("email")
      )
    `);
    
    // Add other table creations...
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop tables in reverse order
    await queryRunner.query(`DROP TABLE "users"`);
  }
}
```

## 🎯 Next Steps

1. **Set up the project structure** following this guide
2. **Configure your database** (PostgreSQL recommended)
3. **Implement authentication** with JWT
4. **Create the entities and migrations**
5. **Build the API controllers and services**
6. **Add validation and error handling**
7. **Set up Swagger documentation**
8. **Test the API endpoints**
9. **Deploy to production**

This setup provides a solid foundation for a scalable, maintainable backend that perfectly matches your frontend requirements!
