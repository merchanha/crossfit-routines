import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class HealthService {
  private readonly logger = new Logger(HealthService.name);

  constructor(
    private readonly configService: ConfigService,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  async getHealth() {
    const databaseStatus = await this.checkDatabaseConnection();

    return {
      status: databaseStatus ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get('NODE_ENV'),
      version: process.env.npm_package_version || '1.0.0',
      database: databaseStatus ? 'connected' : 'disconnected',
      memory: {
        used:
          Math.round((process.memoryUsage().heapUsed / 1024 / 1024) * 100) /
          100,
        total:
          Math.round((process.memoryUsage().heapTotal / 1024 / 1024) * 100) /
          100,
      },
    };
  }

  async getReadiness() {
    const databaseStatus = await this.checkDatabaseConnection();
    const isReady = databaseStatus;

    return {
      status: isReady ? 'ready' : 'not ready',
      timestamp: new Date().toISOString(),
      checks: {
        database: databaseStatus ? 'ok' : 'error',
      },
    };
  }

  getLiveness() {
    return {
      status: 'alive',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }

  private async checkDatabaseConnection(): Promise<boolean> {
    try {
      await this.dataSource.query('SELECT 1');
      return true;
    } catch (error) {
      this.logger.error('Database connection check failed:', error);
      return false;
    }
  }

  async getDetailedHealth() {
    const databaseStatus = await this.checkDatabaseConnection();
    const databaseInfo = await this.getDatabaseInfo();

    return {
      status: databaseStatus ? 'ok' : 'error',
      timestamp: new Date().toISOString(),
      database: {
        connected: databaseStatus,
        ...databaseInfo,
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        cpu: process.cpuUsage(),
        platform: process.platform,
        nodeVersion: process.version,
      },
    };
  }

  private async getDatabaseInfo() {
    try {
      const result = await this.dataSource.query(`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as version,
          now() as current_time
      `);

      return {
        name: result[0]?.database_name,
        user: result[0]?.current_user,
        version: result[0]?.version,
        currentTime: result[0]?.current_time,
      };
    } catch (error) {
      this.logger.error('Failed to get database info:', error);
      return {
        name: 'unknown',
        user: 'unknown',
        version: 'unknown',
        currentTime: null,
      };
    }
  }
}
