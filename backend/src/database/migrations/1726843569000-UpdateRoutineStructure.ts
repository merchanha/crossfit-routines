import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateRoutineStructure1726843569000 implements MigrationInterface {
  name = 'UpdateRoutineStructure1726843569000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add estimatedDuration column to routines table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='routines' AND column_name='estimatedDuration') THEN
          ALTER TABLE "routines" ADD "estimatedDuration" integer;
        END IF;
      END $$;
    `);

    // Add finalDuration column to scheduled_workouts table if it doesn't exist
    await queryRunner.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='scheduled_workouts' AND column_name='finalDuration') THEN
          ALTER TABLE "scheduled_workouts" ADD "finalDuration" integer;
        END IF;
      END $$;
    `);

    // Remove duration field from exercises in routines.exercises JSONB column
    // This is more complex since it's a JSONB field, so we'll update existing records
    await queryRunner.query(`
      UPDATE "routines" 
      SET "exercises" = (
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', exercise->>'id',
            'name', exercise->>'name',
            'sets', CASE WHEN exercise->>'sets' IS NOT NULL AND exercise->>'sets' != '' THEN (exercise->>'sets')::integer ELSE NULL END,
            'reps', CASE WHEN exercise->>'reps' IS NOT NULL AND exercise->>'reps' != '' THEN (exercise->>'reps')::integer ELSE NULL END,
            'notes', exercise->>'notes'
          )
        )
        FROM jsonb_array_elements("exercises") AS exercise
      )
      WHERE "exercises" IS NOT NULL AND jsonb_typeof("exercises") = 'array';
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove the new columns
    await queryRunner.query(
      `ALTER TABLE "scheduled_workouts" DROP COLUMN "finalDuration"`,
    );

    await queryRunner.query(
      `ALTER TABLE "routines" DROP COLUMN "estimatedDuration"`,
    );

    // Note: We cannot easily restore the duration field in exercises JSONB
    // This would require manual data restoration if needed
  }
}
