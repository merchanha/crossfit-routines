import { Entity, Column, OneToMany, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { Routine } from '../../routines/entities/routine.entity';
import { ScheduledWorkout } from '../../scheduled-workouts/entities/scheduled-workout.entity';
import { WorkoutNote } from '../../notes/entities/note.entity';
import * as bcrypt from 'bcryptjs';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  profilePicture?: string;

  @Column()
  @Exclude()
  password: string;

  @OneToMany(() => Routine, (routine) => routine.user)
  routines: Routine[];

  @OneToMany(
    () => ScheduledWorkout,
    (scheduledWorkout) => scheduledWorkout.user,
  )
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

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      this.password = await bcrypt.hash(this.password, 12);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }

  private calculateCurrentStreak(): number {
    if (!this.scheduledWorkouts) return 0;

    const completedWorkouts = this.scheduledWorkouts
      .filter((workout) => workout.completed)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (const workout of completedWorkouts) {
      const workoutDate = new Date(workout.date);
      workoutDate.setHours(0, 0, 0, 0);

      const daysDiff = Math.floor(
        (today.getTime() - workoutDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysDiff === streak) {
        streak++;
        today.setDate(today.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }

  private getFavoriteExercise(): string {
    if (!this.routines) return 'No exercises yet';

    const exerciseCount: { [key: string]: number } = {};

    this.routines.forEach((routine) => {
      routine.exercises.forEach((exercise) => {
        exerciseCount[exercise.name] = (exerciseCount[exercise.name] || 0) + 1;
      });
    });

    const favorite = Object.entries(exerciseCount).sort(
      ([, a], [, b]) => b - a,
    )[0];

    return favorite ? favorite[0] : 'No exercises yet';
  }
}
