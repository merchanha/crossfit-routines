import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduledWorkoutsService } from './scheduled-workouts.service';
import { ScheduledWorkoutsController } from './scheduled-workouts.controller';
import { ScheduledWorkout } from './entities/scheduled-workout.entity';
import { Routine } from '../routines/entities/routine.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ScheduledWorkout, Routine])],
  controllers: [ScheduledWorkoutsController],
  providers: [ScheduledWorkoutsService],
  exports: [ScheduledWorkoutsService],
})
export class ScheduledWorkoutsModule {}
