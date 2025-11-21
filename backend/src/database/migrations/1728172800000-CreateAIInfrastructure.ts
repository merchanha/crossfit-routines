import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Migration: Create AI Infrastructure
 *
 * This migration creates the database tables needed for AI features:
 * 1. ai_interactions - Tracks all AI requests for analytics and rate limiting
 * 2. Adds aiGenerated flag to routines table
 *
 * Run with: npm run db:migration:run
 * Revert with: npm run db:migration:revert
 */
export class CreateAIInfrastructure1728172800000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create ai_interactions table
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS ai_interactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
        "deletedAt" TIMESTAMP DEFAULT NULL,
        
        "userId" UUID NOT NULL,
        "interactionType" VARCHAR(50) NOT NULL,
        prompt TEXT NOT NULL,
        response JSONB DEFAULT NULL,
        "aiProvider" VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'success',
        "tokensUsed" INTEGER NOT NULL DEFAULT 0,
        "responseTimeMs" INTEGER DEFAULT NULL,
        "errorMessage" TEXT DEFAULT NULL,
        metadata JSONB DEFAULT NULL,
        
        CONSTRAINT "fk_ai_interactions_user" 
          FOREIGN KEY ("userId") 
          REFERENCES users(id) 
          ON DELETE CASCADE
      );
    `);

    // Create indexes for fast queries
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ai_interactions_userId_createdAt" 
      ON ai_interactions("userId", "createdAt");
    `);

    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "idx_ai_interactions_interactionType_createdAt" 
      ON ai_interactions("interactionType", "createdAt");
    `);

    // Add aiGenerated column to routines table (if not exists)
    await queryRunner.query(`
      ALTER TABLE routines 
      ADD COLUMN IF NOT EXISTS "aiGenerated" BOOLEAN NOT NULL DEFAULT FALSE;
    `);

    console.log('✅ AI infrastructure tables created successfully');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove aiGenerated column from routines
    await queryRunner.query(`
      ALTER TABLE routines 
      DROP COLUMN IF EXISTS "aiGenerated";
    `);

    // Drop indexes
    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_ai_interactions_interactionType_createdAt";
    `);

    await queryRunner.query(`
      DROP INDEX IF EXISTS "idx_ai_interactions_userId_createdAt";
    `);

    // Drop ai_interactions table
    await queryRunner.query(`
      DROP TABLE IF EXISTS ai_interactions;
    `);

    console.log('✅ AI infrastructure tables removed successfully');
  }
}
