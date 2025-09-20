import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { ScheduledWorkout } from '../../scheduled-workouts/entities/scheduled-workout.entity';
import { WorkoutNote } from '../../notes/entities/note.entity';
import { Exercise } from '../interfaces/exercise.interface';

@Entity('routines')
export class Routine extends BaseEntity {
  @Column()
  name: string;

  @Column('text')
  description: string;

  @Column({ nullable: true })
  videoUrl?: string;

  @Column({ nullable: true })
  estimatedDuration?: number; // Estimated duration in minutes

  @Column('jsonb')
  exercises: Exercise[];

  @Column()
  userId: string;

  @ManyToOne(() => User, (user) => user.routines)
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(
    () => ScheduledWorkout,
    (scheduledWorkout) => scheduledWorkout.routine,
  )
  scheduledWorkouts: ScheduledWorkout[];

  @OneToMany(() => WorkoutNote, (note) => note.routine)
  notes: WorkoutNote[];
}
