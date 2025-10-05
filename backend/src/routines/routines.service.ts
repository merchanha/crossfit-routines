import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateRoutineDto } from './dto/create-routine.dto';
import { UpdateRoutineDto } from './dto/update-routine.dto';
import { Routine } from './entities/routine.entity';

@Injectable()
export class RoutinesService {
  constructor(
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
  ) {}

  async create(
    createRoutineDto: CreateRoutineDto,
    userId: string,
  ): Promise<Routine> {
    try {
      console.log('🔍 Creating routine:', { createRoutineDto, userId });
      
      const routine = this.routineRepository.create({
        ...createRoutineDto,
        userId,
      });

      console.log('🔍 Routine created, saving to database...');
      const savedRoutine = await this.routineRepository.save(routine);
      console.log('✅ Routine saved successfully:', savedRoutine.id);
      
      return savedRoutine;
    } catch (error) {
      console.error('❌ Error creating routine:', error);
      throw error;
    }
  }

  async findAll(userId: string): Promise<Routine[]> {
    try {
      console.log('🔍 Finding routines for user:', userId);
      
      const routines = await this.routineRepository.find({
        where: { userId },
        relations: ['scheduledWorkouts', 'notes'],
        order: { createdAt: 'DESC' },
      });
      
      console.log('✅ Found routines:', routines.length);
      return routines;
    } catch (error) {
      console.error('❌ Error finding routines:', error);
      throw error;
    }
  }

  async findOne(id: string, userId: string): Promise<Routine> {
    const routine = await this.routineRepository.findOne({
      where: { id, userId },
      relations: ['scheduledWorkouts', 'notes', 'user'],
    });

    if (!routine) {
      throw new NotFoundException(`Routine with ID ${id} not found`);
    }

    return routine;
  }

  async update(
    id: string,
    updateRoutineDto: UpdateRoutineDto,
    userId: string,
  ): Promise<Routine> {
    const routine = await this.findOne(id, userId);

    // Update routine
    Object.assign(routine, updateRoutineDto);
    return this.routineRepository.save(routine);
  }

  async remove(id: string, userId: string): Promise<void> {
    const routine = await this.findOne(id, userId);
    await this.routineRepository.softDelete(id);
  }

  async findByUser(userId: string): Promise<Routine[]> {
    return this.routineRepository.find({
      where: { userId },
      relations: ['scheduledWorkouts'],
      order: { createdAt: 'DESC' },
    });
  }

  async searchRoutines(userId: string, searchTerm: string): Promise<Routine[]> {
    return this.routineRepository
      .createQueryBuilder('routine')
      .where('routine.userId = :userId', { userId })
      .andWhere(
        '(routine.name ILIKE :searchTerm OR routine.description ILIKE :searchTerm)',
        { searchTerm: `%${searchTerm}%` },
      )
      .orderBy('routine.createdAt', 'DESC')
      .getMany();
  }

  async getRoutineStats(userId: string): Promise<{
    totalRoutines: number;
    totalExercises: number;
    mostUsedExercise: string;
  }> {
    const routines = await this.routineRepository.find({
      where: { userId },
    });

    const totalRoutines = routines.length;
    const totalExercises = routines.reduce(
      (sum, routine) => sum + routine.exercises.length,
      0,
    );

    // Find most used exercise
    const exerciseCount: { [key: string]: number } = {};
    routines.forEach((routine) => {
      routine.exercises.forEach((exercise) => {
        exerciseCount[exercise.name] = (exerciseCount[exercise.name] || 0) + 1;
      });
    });

    const mostUsedExercise =
      Object.entries(exerciseCount).sort(([, a], [, b]) => b - a)[0]?.[0] ||
      'No exercises yet';

    return {
      totalRoutines,
      totalExercises,
      mostUsedExercise,
    };
  }
}
