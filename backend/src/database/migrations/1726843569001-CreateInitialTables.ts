import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInitialTables1726843569001 implements MigrationInterface {
    name = 'CreateInitialTables1726843569001'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "email" character varying NOT NULL,
                "name" character varying NOT NULL,
                "profilePicture" character varying,
                "password" character varying NOT NULL,
                CONSTRAINT "UQ_users_email" UNIQUE ("email"),
                CONSTRAINT "PK_users_id" PRIMARY KEY ("id")
            )
        `);

        // Create routines table
        await queryRunner.query(`
            CREATE TABLE "routines" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "name" character varying NOT NULL,
                "description" text,
                "exercises" jsonb NOT NULL DEFAULT '[]',
                "estimatedDuration" integer,
                "userId" uuid NOT NULL,
                CONSTRAINT "PK_routines_id" PRIMARY KEY ("id")
            )
        `);

        // Create scheduled_workouts table
        await queryRunner.query(`
            CREATE TABLE "scheduled_workouts" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "date" character varying NOT NULL,
                "completed" boolean NOT NULL DEFAULT false,
                "notes" text,
                "finalDuration" integer,
                "userId" uuid NOT NULL,
                "routineId" uuid NOT NULL,
                CONSTRAINT "PK_scheduled_workouts_id" PRIMARY KEY ("id")
            )
        `);

        // Create workout_notes table
        await queryRunner.query(`
            CREATE TABLE "workout_notes" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "deletedAt" TIMESTAMP,
                "content" text NOT NULL,
                "userId" uuid NOT NULL,
                "routineId" uuid,
                "scheduledWorkoutId" uuid,
                CONSTRAINT "PK_workout_notes_id" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "routines" 
            ADD CONSTRAINT "FK_routines_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "scheduled_workouts" 
            ADD CONSTRAINT "FK_scheduled_workouts_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "scheduled_workouts" 
            ADD CONSTRAINT "FK_scheduled_workouts_routineId" 
            FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "workout_notes" 
            ADD CONSTRAINT "FK_workout_notes_userId" 
            FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "workout_notes" 
            ADD CONSTRAINT "FK_workout_notes_routineId" 
            FOREIGN KEY ("routineId") REFERENCES "routines"("id") ON DELETE CASCADE
        `);

        await queryRunner.query(`
            ALTER TABLE "workout_notes" 
            ADD CONSTRAINT "FK_workout_notes_scheduledWorkoutId" 
            FOREIGN KEY ("scheduledWorkoutId") REFERENCES "scheduled_workouts"("id") ON DELETE CASCADE
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints
        await queryRunner.query(`ALTER TABLE "workout_notes" DROP CONSTRAINT "FK_workout_notes_scheduledWorkoutId"`);
        await queryRunner.query(`ALTER TABLE "workout_notes" DROP CONSTRAINT "FK_workout_notes_routineId"`);
        await queryRunner.query(`ALTER TABLE "workout_notes" DROP CONSTRAINT "FK_workout_notes_userId"`);
        await queryRunner.query(`ALTER TABLE "scheduled_workouts" DROP CONSTRAINT "FK_scheduled_workouts_routineId"`);
        await queryRunner.query(`ALTER TABLE "scheduled_workouts" DROP CONSTRAINT "FK_scheduled_workouts_userId"`);
        await queryRunner.query(`ALTER TABLE "routines" DROP CONSTRAINT "FK_routines_userId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "workout_notes"`);
        await queryRunner.query(`DROP TABLE "scheduled_workouts"`);
        await queryRunner.query(`DROP TABLE "routines"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }
}
