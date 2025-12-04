# IntApp - Short-Form Video Application Documentation

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Database Schema](#database-schema)
5. [API Documentation](#api-documentation)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## Overview

**IntApp** is a modern short-form video web application (similar to TikTok) built with cutting-edge web technologies. It enables users to upload, share, and interact with short video content through a responsive web interface.

### Key Features
- **User Authentication**: Secure sign-up and login with credentials or Discord OAuth
- **Video Upload**: Support for both AWS S3 and local file storage
- **Video Feed**: Infinite scroll feed with autoplay functionality
- **Social Interactions**: Like/unlike videos with real-time updates
- **Responsive Design**: Modern UI built with Tailwind CSS

### Tech Stack
- **Frontend Framework**: Next.js 15 (App Router) with React 19
- **Type Safety**: TypeScript with end-to-end type safety via tRPC
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
- **Storage**: AWS S3 (with local fallback)
- **Styling**: Tailwind CSS 4.0
- **State Management**: TanStack Query (React Query)

---

## Architecture

### High-Level Architecture

The application follows a **full-stack TypeScript architecture** with clear separation between client and server:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   React      │  │  Next.js     │  │  TanStack   │       │
│  │  Components  │  │  App Router  │  │   Query     │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│           │                │                │                 │
│           └────────────────┼────────────────┘                │
│                            │                                  │
│                    ┌───────▼────────┐                         │
│                    │   tRPC Client  │                         │
│                    └───────┬────────┘                         │
└────────────────────────────┼──────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │  Next.js API    │
                    │     Routes      │
                    └────────┬────────┘
                             │
┌────────────────────────────┼──────────────────────────────────┐
│                    Server Layer                                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   tRPC       │  │  NextAuth    │  │   Prisma     │       │
│  │  Routers     │  │   Auth       │  │    ORM       │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│           │                │                │                 │
│           └────────────────┼────────────────┘                │
│                            │                                  │
│                    ┌───────▼────────┐                         │
│                    │  PostgreSQL    │                         │
│                    │   Database     │                         │
│                    └────────────────┘                         │
└───────────────────────────────────────────────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   AWS S3 /      │
                    │  Local Storage  │
                    └─────────────────┘
```

### Application Layers

#### 1. **Presentation Layer** (`src/app/`, `src/components/`)
- **Next.js App Router**: File-based routing with React Server Components
- **React Components**: Reusable UI components (AuthForm, Feed, VideoCard, etc.)
- **Client Components**: Interactive components using React hooks and TanStack Query

#### 2. **API Layer** (`src/server/api/`)
- **tRPC Routers**: Type-safe API endpoints organized by domain
  - `auth.ts`: Authentication operations (register, login, me)
  - `video.ts`: Video operations (create, feed, like/unlike)
  - `post.ts`: Post operations (if applicable)
- **tRPC Context**: Provides database and session to all procedures
- **Procedures**: 
  - `publicProcedure`: Accessible without authentication
  - `protectedProcedure`: Requires valid user session

#### 3. **Business Logic Layer** (`src/server/`)
- **Authentication**: NextAuth configuration with Credentials and Discord providers
- **Database**: Prisma client initialization with connection pooling
- **File Upload**: S3 presigned URL generation or local file handling

#### 4. **Data Layer**
- **Prisma ORM**: Type-safe database access
- **PostgreSQL**: Relational database for persistent storage
- **AWS S3**: Cloud storage for video files (optional)

### Data Flow Examples

#### Video Upload Flow
```
1. User selects video file
   ↓
2. Client calls /api/upload/presign
   ↓
3. Server generates presigned URL (S3) or upload key (local)
   ↓
4. Client uploads file directly to S3 or POSTs to /api/upload/local
   ↓
5. Client calls video.createMetadata tRPC mutation
   ↓
6. Server creates Video record in database
   ↓
7. Video appears in feed
```

#### Authentication Flow
```
1. User submits credentials
   ↓
2. Client calls auth.login tRPC mutation
   ↓
3. Server validates credentials with bcrypt
   ↓
4. NextAuth creates JWT session
   ↓
5. Session stored in cookies
   ↓
6. Protected routes can access session.user
```

#### Video Feed Flow
```
1. User navigates to /feed
   ↓
2. Client calls video.feed tRPC query
   ↓
3. Server queries database with pagination
   ↓
4. Server checks like status for authenticated users
   ↓
5. Returns videos with metadata
   ↓
6. Client renders VideoCard components
   ↓
7. IntersectionObserver triggers autoplay
```

### Key Design Patterns

1. **Type Safety**: End-to-end type safety from database to UI via Prisma + tRPC
2. **Server Components**: Next.js App Router uses React Server Components for better performance
3. **Optimistic Updates**: UI updates immediately, then syncs with server (likes)
4. **Transaction Safety**: Database transactions ensure data consistency (like counts)
5. **Progressive Enhancement**: Works with or without AWS S3 (local fallback)

---

## Setup Instructions

### Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js**: Version 18.x or higher ([Download](https://nodejs.org/))
- **npm**: Version 11.x or higher (comes with Node.js)
- **PostgreSQL**: Version 14 or higher ([Download](https://www.postgresql.org/download/))
  - Alternatively, use Docker/Podman for containerized database
- **Git**: For version control ([Download](https://git-scm.com/))

**Optional:**
- **Docker Desktop** or **Podman Desktop**: For running PostgreSQL in a container
- **AWS Account**: For S3 video storage (optional - local storage works without it)

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd intapp
```

### Step 2: Install Dependencies

```bash
npm install
```

This will:
- Install all npm packages
- Run `postinstall` script to generate Prisma client

### Step 3: Environment Configuration

Create a `.env` file in the root directory:

```bash
# Copy from example if available, or create new
touch .env
```

Add the following environment variables to `.env`:

```env
# Database Configuration
# Format: postgresql://USER:PASSWORD@HOST:PORT/DATABASE
DATABASE_URL=postgresql://postgres:password@localhost:5432/intapp

# NextAuth Configuration
# Generate a secret: openssl rand -base64 32
AUTH_SECRET=your-super-secret-key-change-in-production
AUTH_DISCORD_ID=                    # Optional: Discord OAuth Client ID
AUTH_DISCORD_SECRET=                # Optional: Discord OAuth Client Secret

# AWS S3 Configuration (Optional - app uses local storage if not set)
AWS_REGION=us-east-1
S3_BUCKET=your-bucket-name
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Node Environment
NODE_ENV=development
```

**Important Notes:**
- Replace `AUTH_SECRET` with a secure random string (use `openssl rand -base64 32`)
- If you don't have AWS credentials, the app will automatically use local file storage in `public/uploads/`
- For production, use a strong `AUTH_SECRET` and secure database credentials

### Step 4: Database Setup

#### Option A: Using Docker/Podman (Recommended for Development)

If you have Docker or Podman installed, use the provided script:

**On Windows (WSL):**
```bash
# 1. Install WSL if not already installed
# 2. Open WSL terminal
wsl

# 3. Navigate to project directory
cd /mnt/d/Intenship/intapp

# 4. Run the database script
./start-database.sh
```

**On Linux/macOS:**
```bash
./start-database.sh
```

This script will:
- Parse your `DATABASE_URL` from `.env`
- Create and start a PostgreSQL container
- Set up the database with the correct credentials

#### Option B: Using Local PostgreSQL

1. **Install PostgreSQL** on your system
2. **Create a database:**
   ```sql
   CREATE DATABASE intapp;
   ```
3. **Update `.env`** with your PostgreSQL connection string:
   ```env
   DATABASE_URL=postgresql://your_user:your_password@localhost:5432/intapp
   ```

### Step 5: Run Database Migrations

Generate Prisma client and apply database schema:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations to create tables
npx prisma migrate dev --name init
```

This will:
- Create all database tables (User, Video, Like, Post, Account, Session, VerificationToken)
- Set up indexes and relationships
- Generate TypeScript types for database models

**Optional:** View your database with Prisma Studio:
```bash
npm run db:studio
```

This opens a web interface at `http://localhost:5555` to browse and edit your database.

### Step 6: Create Upload Directory (Local Storage)

If you're not using AWS S3, create the local upload directory:

```bash
# On Windows (PowerShell)
New-Item -ItemType Directory -Path "public\uploads" -Force

# On Linux/macOS
mkdir -p public/uploads
```

### Step 7: Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Frontend**: http://localhost:3000
- **API Routes**: http://localhost:3000/api/*

### Step 8: Verify Installation

1. **Open** http://localhost:3000 in your browser
2. **Sign up** for a new account at `/auth`
3. **Upload a video** at `/upload`
4. **View feed** at `/feed`

### Development Scripts

```bash
# Start development server with Turbopack
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format:write
npm run format:check

# Database operations
npm run db:generate    # Generate Prisma client
npm run db:migrate     # Run migrations (production)
npm run db:push        # Push schema changes (development)
npm run db:studio      # Open Prisma Studio
```

---

## Database Schema

### Schema Diagrams

> **Add your schema diagrams here.**
> 
> You can include:
> - Entity Relationship Diagram (ERD)
> - Table structure diagrams
> - Relationship mapping diagrams
> - Any other visual representations of the database schema

---

**Reference:** The complete Prisma schema is defined in `prisma/schema.prisma`. The database includes the following main models:

- **User**: User accounts with authentication
- **Video**: Video metadata and content
- **Like**: User-video like relationships
- **Post**: User posts
- **Account, Session, VerificationToken**: NextAuth.js required models

For detailed model definitions, relationships, and constraints, see `prisma/schema.prisma`.

---

## API Documentation

### tRPC API

All API endpoints are type-safe and accessible via tRPC. The API is organized into routers:

#### Base URL
- Development: `http://localhost:3000/api/trpc`
- Production: `https://your-domain.com/api/trpc`

#### Auth Router (`auth`)

##### `auth.register`
Register a new user account.

**Input:**
```typescript
{
  name: string;
  email: string;
  password: string; // minimum 6 characters
}
```

**Output:**
```typescript
{
  success: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}
```

**Example:**
```typescript
const result = await trpc.auth.register.mutate({
  name: "John Doe",
  email: "john@example.com",
  password: "securepassword123"
});
```

##### `auth.login`
Authenticate a user and create a session.

**Input:**
```typescript
{
  email: string;
  password: string;
}
```

**Output:**
```typescript
{
  success: boolean;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}
```

**Example:**
```typescript
const result = await trpc.auth.login.mutate({
  email: "john@example.com",
  password: "securepassword123"
});
```

##### `auth.me`
Get the current authenticated user.

**Input:** None (protected procedure)

**Output:**
```typescript
{
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  };
}
```

**Example:**
```typescript
const result = await trpc.auth.me.query();
```

#### Video Router (`video`)

##### `video.createMetadata`
Create a video record in the database after upload.

**Input:**
```typescript
{
  url: string; // Video URL (S3 or local)
  title?: string;
  description?: string;
  duration?: number; // seconds
  thumbnail?: string; // Thumbnail URL
}
```

**Output:**
```typescript
{
  success: boolean;
  video: {
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    duration: number | null;
    likeCount: number;
    createdAt: Date;
    userId: string;
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  };
}
```

**Example:**
```typescript
const result = await trpc.video.createMetadata.mutate({
  url: "https://s3.amazonaws.com/bucket/video.mp4",
  title: "My First Video",
  description: "This is a test video",
  duration: 30
});
```

##### `video.feed`
Get paginated video feed.

**Input:**
```typescript
{
  cursor?: string; // Video ID for pagination
  limit?: number; // 1-20, default 10
}
```

**Output:**
```typescript
{
  videos: Array<{
    id: string;
    url: string;
    title: string | null;
    description: string | null;
    thumbnail: string | null;
    duration: number | null;
    likeCount: number;
    createdAt: Date;
    userId: string;
    isLiked: boolean; // true if current user liked this video
    user: {
      id: string;
      name: string | null;
      email: string;
      image: string | null;
    };
  }>;
  nextCursor: string | null; // Use for next page
}
```

**Example:**
```typescript
const result = await trpc.video.feed.query({
  limit: 10,
  cursor: undefined // First page
});

// Next page
const nextPage = await trpc.video.feed.query({
  limit: 10,
  cursor: result.nextCursor
});
```

##### `video.like`
Like a video.

**Input:**
```typescript
{
  videoId: string;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

**Example:**
```typescript
await trpc.video.like.mutate({ videoId: "clx123..." });
```

##### `video.unlike`
Unlike a video.

**Input:**
```typescript
{
  videoId: string;
}
```

**Output:**
```typescript
{
  success: boolean;
}
```

**Example:**
```typescript
await trpc.video.unlike.mutate({ videoId: "clx123..." });
```

##### `video.userLikes`
Get list of video IDs liked by a user.

**Input:**
```typescript
{
  userId?: string; // Optional, defaults to current user
}
```

**Output:**
```typescript
{
  videoIds: string[];
}
```

**Example:**
```typescript
const result = await trpc.video.userLikes.query();
// Returns: { videoIds: ["clx123...", "clx456..."] }
```

### REST API Routes

#### `POST /api/upload/presign`
Get presigned URL for S3 upload or upload key for local storage.

**Request Body:**
```json
{
  "filename": "video.mp4",
  "contentType": "video/mp4"
}
```

**Response (S3 Mode):**
```json
{
  "presignedUrl": "https://s3.amazonaws.com/bucket/video.mp4?X-Amz-...",
  "url": "https://s3.amazonaws.com/bucket/video.mp4",
  "key": "videos/1234567890-video.mp4"
}
```

**Response (Local Mode):**
```json
{
  "uploadKey": "1234567890-video.mp4",
  "url": "/uploads/1234567890-video.mp4"
}
```

#### `POST /api/upload/local`
Upload file to local storage (multipart/form-data).

**Request:**
- Method: `POST`
- Content-Type: `multipart/form-data`
- Body: Form data with `file` field

**Response:**
```json
{
  "success": true,
  "url": "/uploads/1234567890-video.mp4"
}
```

#### `POST /api/auth/[...nextauth]`
NextAuth.js authentication endpoint. Handles:
- `/api/auth/signin`
- `/api/auth/signout`
- `/api/auth/callback/*`
- `/api/auth/session`

See [NextAuth.js documentation](https://next-auth.js.org/) for details.

---

## Deployment

### Production Checklist

Before deploying to production:

- [ ] Set `NODE_ENV=production` in environment variables
- [ ] Use a strong `AUTH_SECRET` (generate with `openssl rand -base64 32`)
- [ ] Configure production database (managed PostgreSQL service recommended)
- [ ] Set up AWS S3 bucket with proper CORS and permissions
- [ ] Configure domain and SSL certificate
- [ ] Set up environment variables in hosting platform
- [ ] Run database migrations: `npm run db:migrate`
- [ ] Build the application: `npm run build`
- [ ] Test the production build locally: `npm run preview`

### Environment Variables for Production

```env
DATABASE_URL=postgresql://user:password@prod-db-host:5432/intapp
AUTH_SECRET=<strong-random-secret>
NODE_ENV=production
AWS_REGION=us-east-1
S3_BUCKET=your-production-bucket
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
```

### Deployment Platforms

#### Vercel (Recommended for Next.js)

1. **Connect Repository** to Vercel
2. **Configure Environment Variables** in Vercel dashboard
3. **Set Build Command**: `npm run build`
4. **Set Output Directory**: `.next`
5. **Deploy**

#### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:18-alpine AS base

# Install dependencies
FROM base AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci

# Build application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/generated ./generated

EXPOSE 3000
CMD ["node", "server.js"]
```

Build and run:
```bash
docker build -t intapp .
docker run -p 3000:3000 --env-file .env intapp
```

### Database Migrations in Production

```bash
# Run migrations
npm run db:migrate

# Or with Prisma CLI
npx prisma migrate deploy
```

**Important:** Always backup your database before running migrations in production.

---

## Troubleshooting

### Common Issues

#### Database Connection Errors

**Error:** `Can't reach database server`

**Solutions:**
1. Verify PostgreSQL is running:
   ```bash
   # Check if PostgreSQL is running
   pg_isready
   ```
2. Check `DATABASE_URL` in `.env` file
3. Verify database credentials
4. Check firewall/network settings
5. For Docker: Ensure container is running:
   ```bash
   docker ps
   ```

#### Prisma Client Not Generated

**Error:** `Cannot find module '@prisma/client'` or similar

**Solutions:**
```bash
# Regenerate Prisma client
npx prisma generate

# Or reinstall dependencies
rm -rf node_modules generated/prisma
npm install
```

#### Migration Errors

**Error:** Migration conflicts or schema drift

**Solutions:**
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Or push schema without migrations (development only)
npx prisma db push
```

#### Upload Failures

**Error:** File upload fails

**Solutions:**
1. **Check file size**: Maximum 20MB
2. **Verify file type**: Only `video/*` MIME types accepted
3. **S3 Issues:**
   - Verify AWS credentials in `.env`
   - Check S3 bucket permissions (public-read ACL)
   - Verify CORS configuration on S3 bucket
4. **Local Storage Issues:**
   - Ensure `public/uploads/` directory exists
   - Check write permissions on directory
   - Verify disk space

#### Authentication Not Working

**Error:** Login fails or session not persisting

**Solutions:**
1. Verify `AUTH_SECRET` is set in `.env`
2. Check that user exists in database:
   ```bash
   npm run db:studio
   ```
3. Verify password hashing (should use bcrypt)
4. Check browser cookies are enabled
5. Clear browser cookies and try again

#### TypeScript Errors

**Error:** Type errors in IDE or build

**Solutions:**
```bash
# Regenerate Prisma client (updates types)
npx prisma generate

# Check for type errors
npm run typecheck

# Restart TypeScript server in IDE
```

#### Port Already in Use

**Error:** `Port 3000 is already in use`

**Solutions:**
1. Find and kill process using port 3000:
   ```bash
   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   
   # Linux/macOS
   lsof -ti:3000 | xargs kill
   ```
2. Or change port in `package.json`:
   ```json
   "dev": "next dev --turbo -p 3001"
   ```

### Getting Help

1. **Check Logs**: Review console output and server logs
2. **Prisma Studio**: Use `npm run db:studio` to inspect database
3. **Environment Variables**: Verify all required variables are set
4. **Documentation**: Refer to:
   - [Next.js Docs](https://nextjs.org/docs)
   - [tRPC Docs](https://trpc.io/docs)
   - [Prisma Docs](https://www.prisma.io/docs)
   - [NextAuth Docs](https://next-auth.js.org/)

---

## Additional Resources

### Project Structure

```
intapp/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/
│   └── uploads/               # Local video storage
├── src/
│   ├── app/                   # Next.js App Router pages
│   │   ├── api/               # API routes
│   │   ├── auth/              # Auth page
│   │   ├── feed/              # Feed page
│   │   └── upload/            # Upload page
│   ├── components/            # React components
│   ├── server/                # Server-side code
│   │   ├── api/               # tRPC routers
│   │   ├── auth/              # NextAuth config
│   │   └── db.ts              # Prisma client
│   ├── styles/                # Global styles
│   └── trpc/                  # tRPC client setup
├── .env                       # Environment variables (not in git)
├── package.json               # Dependencies and scripts
└── DOCUMENTATION.md           # This file
```

### Key Files to Understand

- `prisma/schema.prisma`: Database schema definition
- `src/server/api/trpc.ts`: tRPC setup and context
- `src/server/api/routers/video.ts`: Video business logic
- `src/server/api/routers/auth.ts`: Authentication logic
- `src/server/auth/config.ts`: NextAuth configuration
- `src/app/api/upload/presign/route.ts`: S3 presigned URL generation
- `src/components/Feed.tsx`: Video feed component
- `src/components/UploadForm.tsx`: Video upload component

---

**Last Updated:** 2024-12-XX
**Version:** 0.1.0

