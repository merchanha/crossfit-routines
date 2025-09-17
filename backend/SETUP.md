# CrossFit Pro Backend Setup Guide

## Prerequisites

- Node.js 18+
- Docker and Docker Compose
- PostgreSQL (if not using Docker)

## Quick Start

### 1. Environment Setup

Create a `.env` file in the backend root directory:

```env
# Database Configuration
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=password
DATABASE_NAME=crossfit_pro

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Application Configuration
PORT=3001
NODE_ENV=development

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Swagger Configuration
SWAGGER_TITLE=CrossFit Pro API
SWAGGER_DESCRIPTION=API for CrossFit Pro workout management application
SWAGGER_VERSION=1.0.0
SWAGGER_PATH=api/docs
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Start Database with Docker

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Check if containers are running
docker-compose ps
```

### 4. Run the Application

```bash
# Development mode
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

## Database Access

- **PostgreSQL**: `localhost:5432`
- **pgAdmin**: `http://localhost:5050`
  - Email: `admin@crossfit.com`
  - Password: `admin`

## API Documentation

Once the application is running, visit:
- **Swagger UI**: `http://localhost:3001/api/docs`
- **API Base URL**: `http://localhost:3001`

## Available Scripts

- `npm run start` - Start the application
- `npm run start:dev` - Start in development mode with hot reload
- `npm run start:debug` - Start in debug mode
- `npm run build` - Build the application
- `npm run test` - Run unit tests
- `npm run test:e2e` - Run end-to-end tests
- `npm run test:cov` - Run tests with coverage
- `npm run lint` - Run ESLint
- `npm run format` - Format code with Prettier

## Project Structure

```
src/
├── config/                 # Configuration files
│   └── database.config.ts  # Database configuration
├── auth/                   # Authentication module
├── users/                  # User management module
├── routines/               # Workout routines module
├── scheduled-workouts/     # Workout scheduling module
├── notes/                  # Workout notes module
├── app.module.ts           # Root module
└── main.ts                 # Application entry point
```

## Next Steps

1. **Create Database Entities** - Define TypeORM entities
2. **Implement Authentication** - JWT-based auth system
3. **Add Business Logic** - Implement service methods
4. **Add Validation** - DTO validation rules
5. **Add Tests** - Unit and integration tests

## Troubleshooting

### Database Connection Issues

1. Ensure Docker is running
2. Check if PostgreSQL container is up: `docker-compose ps`
3. Verify database credentials in `.env`
4. Check logs: `docker-compose logs postgres`

### Port Conflicts

If port 3001 is already in use:
1. Change `PORT` in `.env` file
2. Update `CORS_ORIGIN` if needed
3. Restart the application

### TypeORM Issues

1. Ensure all entities are properly exported
2. Check database connection string
3. Verify entity decorators are correct
