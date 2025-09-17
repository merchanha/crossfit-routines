import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { CreateScheduledWorkoutDto } from './dto/create-scheduled-workout.dto';
import { UpdateScheduledWorkoutDto } from './dto/update-scheduled-workout.dto';
import { ScheduledWorkout } from './entities/scheduled-workout.entity';
import { Routine } from '../routines/entities/routine.entity';

@Injectable()
export class ScheduledWorkoutsService {
  constructor(
    @InjectRepository(ScheduledWorkout)
    private readonly scheduledWorkoutRepository: Repository<ScheduledWorkout>,
    @InjectRepository(Routine)
    private readonly routineRepository: Repository<Routine>,
  ) {}

  async create(
    createScheduledWorkoutDto: CreateScheduledWorkoutDto,
    userId: string,
  ): Promise<ScheduledWorkout> {
    const { routineId, date, notes } = createScheduledWorkoutDto;

    // Verify routine exists and belongs to user
    const routine = await this.routineRepository.findOne({
      where: { id: routineId, userId },
    });

    if (!routine) {
      throw new NotFoundException('Routine not found');
    }

    // Parse date string to avoid timezone issues
    // If date is in YYYY-MM-DD format, create a date in local timezone
    const workoutDate = new Date(date + 'T00:00:00');

    // Check if workout is already scheduled for this date
    const existingWorkout = await this.scheduledWorkoutRepository.findOne({
      where: {
        routineId,
        date: workoutDate,
        userId,
      },
    });

    if (existingWorkout) {
      throw new BadRequestException('Workout already scheduled for this date');
    }

    const scheduledWorkout = this.scheduledWorkoutRepository.create({
      routineId,
      date: workoutDate,
      notes,
      userId,
    });

    const savedWorkout =
      await this.scheduledWorkoutRepository.save(scheduledWorkout);

    // Return the workout with routine data
    const workoutWithRoutine = await this.scheduledWorkoutRepository.findOne({
      where: { id: savedWorkout.id },
      relations: ['routine'],
    });

    console.log('Backend - workoutWithRoutine:', workoutWithRoutine);
    console.log('Backend - routine data:', workoutWithRoutine?.routine);

    if (!workoutWithRoutine) {
      throw new Error('Failed to retrieve created workout');
    }

    return workoutWithRoutine;
  }

  async findAll(userId: string): Promise<ScheduledWorkout[]> {
    return this.scheduledWorkoutRepository.find({
      where: { userId },
      relations: ['routine'],
      order: { date: 'ASC' },
    });
  }

  async findOne(id: string, userId: string): Promise<ScheduledWorkout> {
    const scheduledWorkout = await this.scheduledWorkoutRepository.findOne({
      where: { id, userId },
      relations: ['routine', 'user'],
    });

    if (!scheduledWorkout) {
      throw new NotFoundException(`Scheduled workout with ID ${id} not found`);
    }

    return scheduledWorkout;
  }

  async update(
    id: string,
    updateScheduledWorkoutDto: UpdateScheduledWorkoutDto,
    userId: string,
  ): Promise<ScheduledWorkout> {
    const scheduledWorkout = await this.findOne(id, userId);

    // Update scheduled workout
    Object.assign(scheduledWorkout, updateScheduledWorkoutDto);
    return this.scheduledWorkoutRepository.save(scheduledWorkout);
  }

  async remove(id: string, userId: string): Promise<void> {
    const scheduledWorkout = await this.findOne(id, userId);
    await this.scheduledWorkoutRepository.softDelete(id);
  }

  async findByDate(date: Date, userId: string): Promise<ScheduledWorkout[]> {
    // Create date range for the entire day in local timezone
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return this.scheduledWorkoutRepository.find({
      where: {
        userId,
        date: Between(startOfDay, endOfDay),
      },
      relations: ['routine'],
      order: { date: 'ASC' },
    });
  }

  async findByDateRange(
    startDate: Date,
    endDate: Date,
    userId: string,
  ): Promise<ScheduledWorkout[]> {
    return this.scheduledWorkoutRepository.find({
      where: {
        userId,
        date: Between(startDate, endDate),
      },
      relations: ['routine'],
      order: { date: 'ASC' },
    });
  }

  async findByWeek(
    startOfWeek: Date,
    userId: string,
  ): Promise<ScheduledWorkout[]> {
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return this.findByDateRange(startOfWeek, endOfWeek, userId);
  }

  async markCompleted(
    id: string,
    userId: string,
    notes?: string,
  ): Promise<ScheduledWorkout> {
    const scheduledWorkout = await this.findOne(id, userId);

    scheduledWorkout.completed = true;
    if (notes) {
      scheduledWorkout.notes = notes;
    }

    return this.scheduledWorkoutRepository.save(scheduledWorkout);
  }

  async getUpcomingWorkouts(
    userId: string,
    limit: number = 5,
  ): Promise<ScheduledWorkout[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.scheduledWorkoutRepository.find({
      where: {
        userId,
        date: Between(
          today,
          new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000),
        ), // Next 30 days
        completed: false,
      },
      relations: ['routine'],
      order: { date: 'ASC' },
      take: limit,
    });
  }

  async getWorkoutStats(userId: string): Promise<{
    totalScheduled: number;
    totalCompleted: number;
    completionRate: number;
    currentStreak: number;
  }> {
    const allWorkouts = await this.scheduledWorkoutRepository.find({
      where: { userId },
    });

    const totalScheduled = allWorkouts.length;
    const totalCompleted = allWorkouts.filter((w) => w.completed).length;
    const completionRate =
      totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

    // Calculate current streak
    const completedWorkouts = allWorkouts
      .filter((w) => w.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let currentStreak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const workout of completedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === currentStreak) {
        currentStreak++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }

    return {
      totalScheduled,
      totalCompleted,
      completionRate: Math.round(completionRate * 100) / 100,
      currentStreak,
    };
  }
}
