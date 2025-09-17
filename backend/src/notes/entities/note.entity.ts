import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Routine } from '../../routines/entities/routine.entity';

@Entity('workout_notes')
export class WorkoutNote extends BaseEntity {
  @Column({ type: 'date' })
  date: Date;

  @Column('text')
  content: string;

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
