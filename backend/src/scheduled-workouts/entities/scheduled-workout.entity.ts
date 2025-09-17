import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Routine } from '../../routines/entities/routine.entity';

@Entity('scheduled_workouts')
export class ScheduledWorkout extends BaseEntity {
  @Column({ type: 'date' })
  date: Date;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ default: false })
  completed: boolean;

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
