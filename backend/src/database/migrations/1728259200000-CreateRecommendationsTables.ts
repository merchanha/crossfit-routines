import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateRecommendationsTables1728259200000
  implements MigrationInterface
{
  name = 'CreateRecommendationsTables1728259200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create recommendations table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recommendations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMP DEFAULT NULL,
        
        "userId" UUID NOT NULL,
        "performanceAnalysis" JSONB DEFAULT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        "expiresAt" TIMESTAMP DEFAULT NULL,
        
        CONSTRAINT "fk_recommendations_user" 
          FOREIGN KEY ("userId") 
          REFERENCES users(id) 
          ON DELETE CASCADE
      );
    `);

    // Create recommendation_items table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS recommendation_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMP DEFAULT NULL,
        
        "recommendationId" UUID NOT NULL,
        "routineId" UUID DEFAULT NULL,
        "itemType" VARCHAR(20) NOT NULL,
        reasoning TEXT,
        priority INTEGER NOT NULL DEFAULT 0,
        "routineData" JSONB DEFAULT NULL,
        
        CONSTRAINT "fk_recommendation_items_recommendation" 
          FOREIGN KEY ("recommendationId") 
          REFERENCES recommendations(id) 
          ON DELETE CASCADE,
        CONSTRAINT "fk_recommendation_items_routine" 
          FOREIGN KEY ("routineId") 
          REFERENCES routines(id) 
          ON DELETE SET NULL
      );
    `);

    // Create indexes for performance
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_recommendations_userId_createdAt" 
      ON recommendations("userId", "createdAt");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_recommendation_items_recommendationId" 
      ON recommendation_items("recommendationId");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_recommendation_items_routineId" 
      ON recommendation_items("routineId");
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DROP TABLE IF EXISTS recommendation_items;
    `);

    await queryRunner.query(`
      DROP TABLE IF EXISTS recommendations;
    `);
  }
}
