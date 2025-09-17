import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';

export class DatabaseSeeder {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = AppDataSource;
  }

  async seed() {
    try {
      await this.dataSource.initialize();
      console.log('🌱 Starting database seeding...');

      // Add your seed data here
      // Example:
      // await this.seedUsers();
      // await this.seedRoutines();

      console.log('✅ Database seeding completed!');
    } catch (error) {
      console.error('❌ Error seeding database:', error);
    } finally {
      await this.dataSource.destroy();
    }
  }

  // Example seed methods
  // private async seedUsers() {
  //   const userRepository = this.dataSource.getRepository(User);
  //   // Add seed logic here
  // }
}

// Run seeder if called directly
if (require.main === module) {
  const seeder = new DatabaseSeeder();
  seeder.seed();
}
