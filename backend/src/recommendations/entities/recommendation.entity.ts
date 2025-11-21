import { Entity, Column, ManyToOne, OneToMany, JoinColumn } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { RecommendationItem } from './recommendation-item.entity';

export enum RecommendationStatus {
  PENDING = 'pending',
  VIEWED = 'viewed',
  DISMISSED = 'dismissed',
}

@Entity('recommendations')
export class Recommendation extends BaseEntity {
  @Column()
  userId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column('jsonb', { nullable: true })
  performanceAnalysis?: {
    averageDelta?: number; // Average difference between estimated and final duration
    totalWorkouts?: number;
    completedWorkouts?: number;
    strengths?: string[];
    weaknesses?: string[];
    trends?: {
      improving?: boolean;
      declining?: boolean;
      stable?: boolean;
    };
  };

  @Column({
    type: 'varchar',
    length: 20,
    default: RecommendationStatus.PENDING,
  })
  status: RecommendationStatus;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt?: Date;

  @OneToMany(() => RecommendationItem, (item) => item.recommendation, {
    cascade: true,
  })
  items: RecommendationItem[];
}
