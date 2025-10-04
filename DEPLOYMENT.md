# Deployment Guide

This guide will help you deploy your CrossFit Routines app to free services using GitHub Actions, Render, and Vercel.

## 🚀 Services Used

- **Backend**: Render (free tier)
- **Frontend**: Vercel (free tier) 
- **Database**: PostgreSQL on Render (free tier)
- **CI/CD**: GitHub Actions

## 📋 Prerequisites

1. GitHub repository with your code
2. Render account (free)
3. Vercel account (free)
4. Cloudinary account (free)

## 🔧 Setup Steps

### 1. Backend Deployment (Render)

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub

2. **Create Database**
   - In Render dashboard, click "New +"
   - Select "PostgreSQL"
   - Name: `crossfit-routines-db`
   - Plan: Free
   - Click "Create Database"

3. **Create Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - **Name**: `crossfit-routines-api`
     - **Root Directory**: `backend`
     - **Environment**: `Node`
     - **Build Command**: `npm install && npm run build`
     - **Start Command**: `npm run start:prod`
     - **Plan**: Free

4. **Environment Variables**
   Add these in Render dashboard:
   ```
   NODE_ENV=production
   PORT=10000
   DATABASE_URL=<from your database>
   JWT_SECRET=<generate a strong secret>
   CORS_ORIGIN=https://your-frontend-app.vercel.app
   IMAGE_STORAGE_PROVIDER=cloudinary
   CLOUDINARY_CLOUD_NAME=<your_cloudinary_cloud_name>
   CLOUDINARY_API_KEY=<your_cloudinary_api_key>
   CLOUDINARY_API_SECRET=<your_cloudinary_api_secret>
   ```

### 2. Frontend Deployment (Vercel)

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub

2. **Import Project**
   - Click "New Project"
   - Import your GitHub repository
   - Configure:
     - **Framework Preset**: Vite
     - **Root Directory**: `frontend`
     - **Build Command**: `npm run build`
     - **Output Directory**: `dist`

3. **Environment Variables**
   Add in Vercel dashboard:
   ```
   VITE_API_URL=https://crossfit-routines-api.onrender.com/api
   ```

### 3. GitHub Actions Setup

1. **Add Secrets to GitHub**
   Go to your repo → Settings → Secrets and variables → Actions

   Add these secrets:
   ```
   RENDER_SERVICE_ID=<from your Render service>
   RENDER_API_KEY=<from Render account settings>
   VERCEL_TOKEN=<from Vercel account settings>
   VERCEL_ORG_ID=<from Vercel team settings>
   VERCEL_PROJECT_ID=<from your Vercel project>
   ```

2. **Get Required IDs**
   - **Render Service ID**: In your service dashboard, look for "Service ID"
   - **Render API Key**: Account Settings → API Keys
   - **Vercel Token**: Account Settings → Tokens
   - **Vercel Org ID**: Team Settings → General
   - **Vercel Project ID**: Project Settings → General

### 4. Cloudinary Setup

1. **Create Account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for free account

2. **Get Credentials**
   - Go to Dashboard
   - Copy:
     - Cloud Name
     - API Key
     - API Secret

3. **Add to Environment Variables**
   - Add these to both Render and Vercel

## 🔄 CI/CD Pipeline

The GitHub Actions workflow will:
1. Trigger on push to `main` branch
2. Build and test backend
3. Deploy backend to Render
4. Build frontend
5. Deploy frontend to Vercel

## 🗄️ Database Migration

After first deployment, you need to run migrations:

1. **Connect to Render Database**
   - Get connection string from Render dashboard
   - Use a PostgreSQL client (pgAdmin, DBeaver, etc.)

2. **Run Migration**
   ```bash
   # In your local backend directory
   npm run migration:run
   ```

## 🧪 Testing Deployment

1. **Backend Health Check**
   - Visit: `https://crossfit-routines-api.onrender.com/api/health`
   - Should return: `{"status": "ok"}`

2. **Frontend**
   - Visit your Vercel URL
   - Test user registration/login
   - Test image upload

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (should be 18)
   - Verify all dependencies are in package.json
   - Check build logs in Render/Vercel

2. **Database Connection**
   - Verify DATABASE_URL is correct
   - Check if database is running
   - Run migrations manually

3. **CORS Issues**
   - Update CORS settings in backend
   - Verify frontend URL in allowed origins

4. **Image Upload Issues**
   - Check Cloudinary credentials
   - Verify IMAGE_STORAGE_PROVIDER setting

### Logs

- **Backend**: Render dashboard → Service → Logs
- **Frontend**: Vercel dashboard → Project → Functions → Logs
- **GitHub Actions**: Repository → Actions tab

## 📝 Environment Variables Reference

### Backend (Render)
```
NODE_ENV=production
PORT=10000
DATABASE_URL=<postgresql://...>
JWT_SECRET=<your-jwt-secret>
CORS_ORIGIN=https://your-frontend-app.vercel.app
IMAGE_STORAGE_PROVIDER=cloudinary
CLOUDINARY_CLOUD_NAME=<your-cloud-name>
CLOUDINARY_API_KEY=<your-api-key>
CLOUDINARY_API_SECRET=<your-api-secret>
```

### Frontend (Vercel)
```
VITE_API_URL=https://crossfit-routines-api.onrender.com/api
```

## 🎉 Success!

Once deployed, you'll have:
- **Backend API**: `https://crossfit-routines-api.onrender.com`
- **Frontend App**: `https://your-app.vercel.app`
- **Database**: PostgreSQL on Render
- **Image Storage**: Cloudinary

Your app will automatically deploy whenever you push to the `main` branch!
