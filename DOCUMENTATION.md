# IntApp - Short-Form Video Application

A modern short-form video web application (similar to TikTok) built with Next.js, tRPC, Prisma, and PostgreSQL.

---

## 📋 Table of Contents

1. [Overview](#overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Database Schema](#database-schema)
5. [API Reference](#api-reference)
6. [Project Structure](#project-structure)
7. [Troubleshooting](#troubleshooting)

---

## Overview

### Features
- **Authentication**: Sign up/login with credentials or Discord OAuth
- **Video Upload**: AWS S3 or local file storage
- **Video Feed**: Infinite scroll with autoplay
- **Social**: Like/unlike videos with real-time updates
- **UI**: Responsive design with Tailwind CSS

### Tech Stack
- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **API**: tRPC (end-to-end type safety)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5
- **Storage**: AWS S3 (optional, falls back to local)
- **Styling**: Tailwind CSS 4.0
- **State**: TanStack Query

---

## Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker/Podman)

### Setup Steps

1. **Clone and install**
   ```bash
   git clone <repo> && cd intapp
   npm install
   ```

2. **Configure environment** (create `.env`)
   ```env
   DATABASE_URL=postgresql://user:pass@localhost:5432/intapp
   AUTH_SECRET=your-secret-key-here  # Generate: openssl rand -base64 32
   
   # Optional: AWS S3 (app uses local storage if not set)
   AWS_REGION=us-east-1
   S3_BUCKET=your-bucket
   AWS_ACCESS_KEY_ID=...
   AWS_SECRET_ACCESS_KEY=...
   ```

3. **Setup database**
   ```bash
   # Option A: Docker (recommended)
   ./start-database.sh
   
   # Option B: Local PostgreSQL
   # Create database: CREATE DATABASE intapp;
   
   # Run migrations
   npx prisma generate
   npx prisma migrate dev --name init
   ```

4. **Create upload directory** (if using local storage)
   ```bash
   mkdir -p public/uploads  # Linux/macOS
   # or New-Item -ItemType Directory -Path "public\uploads" -Force  # Windows
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

### Verify Installation
1. Sign up at `/auth`
2. Upload a video at `/upload`
3. View feed at `/feed`

---

## Architecture

### High-Level Architecture

**📹 [Architecture Video](./public/SA.mkv)**

The application follows a **full-stack TypeScript architecture** with clear separation:

```
┌─────────────────┐
│  Presentation   │  Next.js App Router, React Components
├─────────────────┤
│     API Layer   │  tRPC Routers (auth, video, post)
├─────────────────┤
│ Business Logic  │  NextAuth, File Upload, Validation
├─────────────────┤
│   Data Layer    │  Prisma ORM → PostgreSQL, AWS S3
└─────────────────┘
```

### Key Flows

#### Video Upload Flow

![Video Upload and Processing Flow](./public/Video%20Upload%20and%20Processing%20Flow.png)

```
User selects file → /api/upload/presign → Upload to S3/Local 
→ video.createMetadata → Video appears in feed
```

**Process Steps:**
1. User selects video file
2. Client calls `/api/upload/presign` with filename and content type
3. Server generates presigned URL (S3) or upload key (local)
4. Client uploads file directly to S3 or POSTs to `/api/upload/local`
5. Client calls `video.createMetadata` tRPC mutation
6. Server creates Video record in database
7. Video appears in feed

#### Authentication Flow

![Authentication and Session Flow](./public/Authentication%20and%20Session%20Flow.png)

```
User submits credentials → auth.login → bcrypt validation 
→ NextAuth creates session → Protected routes accessible
```

**Process Steps:**
1. User submits credentials
2. Client calls `auth.login` tRPC mutation
3. Server validates credentials with bcrypt
4. NextAuth creates JWT session
5. Session stored in cookies
6. Protected routes can access `session.user`

#### Video Feed Flow

![Video Feed Flow](./public/Selection.png)

```
/feed → video.feed query → Database pagination → Render VideoCards 
→ IntersectionObserver triggers autoplay
```

**Process Steps:**
1. User navigates to `/feed`
2. Client calls `video.feed` tRPC query
3. Server queries database with pagination
4. Server checks like status for authenticated users
5. Returns videos with metadata
6. Client renders VideoCard components
7. IntersectionObserver triggers autoplay when 50% visible

### Design Patterns
- **Type Safety**: End-to-end via Prisma + tRPC
- **Server Components**: Next.js App Router for performance
- **Optimistic Updates**: UI updates immediately (likes)
- **Transactions**: Database consistency (like counts)
- **Progressive Enhancement**: Works with/without S3

---

## Database Schema

### Entity Relationship Diagram

```mermaid
erDiagram
    User ||--o{ Account : "has"
    User ||--o{ Session : "has"
    User ||--o{ Post : "creates"
    User ||--o{ Video : "uploads"
    User ||--o{ Like : "gives"
    Video ||--o{ Like : "receives"
    
    User {
        string id PK
        string email UK
        string name
        string password
        datetime createdAt
    }
    
    Video {
        string id PK
        string userId FK
        string url
        string title
        int likeCount
        datetime createdAt
    }
    
    Like {
        string id PK
        string userId FK
        string videoId FK
        datetime createdAt
    }
    
    Post {
        int id PK
        string createdById FK
        string name
        datetime createdAt
    }
    
    Account {
        string id PK
        string userId FK
        string provider
    }
    
    Session {
        string id PK
        string userId FK
        string sessionToken UK
    }
```

### Models Overview

**Core Models:**
- **User**: Accounts with email/password auth
- **Video**: Video metadata (title, description, URL, likeCount)
- **Like**: User-video relationships (unique constraint)
- **Post**: User posts

**Auth Models** (NextAuth.js):
- **Account**: OAuth provider accounts
- **Session**: User sessions
- **VerificationToken**: Email verification

See `prisma/schema.prisma` for complete schema definition.

---

## API Reference

### tRPC Routers

Base URL: `http://localhost:3000/api/trpc`

#### Auth Router (`auth`)

| Endpoint | Type | Description |
|----------|------|-------------|
| `auth.register` | Mutation | Create new user `{name, email, password}` |
| `auth.login` | Mutation | Authenticate user `{email, password}` |
| `auth.me` | Query | Get current user (protected) |

#### Video Router (`video`)

| Endpoint | Type | Description |
|----------|------|-------------|
| `video.createMetadata` | Mutation | Create video record `{url, title?, description?, duration?, thumbnail?}` (protected) |
| `video.feed` | Query | Get paginated feed `{cursor?, limit?}` |
| `video.like` | Mutation | Like a video `{videoId}` (protected) |
| `video.unlike` | Mutation | Unlike a video `{videoId}` (protected) |
| `video.userLikes` | Query | Get user's liked videos `{userId?}` (protected) |

### REST API Routes

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/upload/presign` | POST | Get S3 presigned URL or local upload key `{filename, contentType}` |
| `/api/upload/local` | POST | Upload file to local storage (multipart/form-data) |
| `/api/auth/[...nextauth]` | POST | NextAuth endpoints (signin, signout, callback, session) |

### Example Usage

```typescript
// Register user
await trpc.auth.register.mutate({
  name: "John Doe",
  email: "john@example.com",
  password: "secure123"
});

// Get video feed
const { videos, nextCursor } = await trpc.video.feed.query({
  limit: 10,
  cursor: undefined
});

// Like a video
await trpc.video.like.mutate({ videoId: "clx123..." });
```

---

## Project Structure

```
intapp/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/
│   └── uploads/               # Local video storage
├── src/
│   ├── app/                   # Next.js pages
│   │   ├── api/              # API routes
│   │   ├── auth/             # Auth page
│   │   ├── feed/             # Feed page
│   │   └── upload/           # Upload page
│   ├── components/           # React components
│   │   ├── AuthForm.tsx
│   │   ├── Feed.tsx
│   │   ├── VideoCard.tsx
│   │   └── UploadForm.tsx
│   ├── server/               # Server-side code
│   │   ├── api/
│   │   │   └── routers/      # tRPC routers (auth, video)
│   │   ├── auth/             # NextAuth config
│   │   └── db.ts             # Prisma client
│   └── trpc/                 # tRPC client setup
├── .env                      # Environment variables
└── package.json
```

### Key Files

- `prisma/schema.prisma` - Database schema
- `src/server/api/routers/video.ts` - Video business logic
- `src/server/api/routers/auth.ts` - Authentication logic
- `src/components/Feed.tsx` - Video feed component
- `src/components/UploadForm.tsx` - Upload component

---

## Troubleshooting

### Database Connection Errors
- Verify PostgreSQL is running: `pg_isready` or `docker ps`
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `CREATE DATABASE intapp;`

### Prisma Client Not Generated
```bash
npx prisma generate
# Or reinstall: rm -rf node_modules generated/prisma && npm install
```

### Migration Errors
```bash
# Reset database (WARNING: Deletes data)
npx prisma migrate reset

# Or push schema (dev only)
npx prisma db push
```

### Upload Failures
- **File size**: Maximum 20MB
- **File type**: Only `video/*` MIME types
- **S3**: Check AWS credentials and bucket permissions
- **Local**: Ensure `public/uploads/` exists and is writable

### Authentication Not Working
- Verify `AUTH_SECRET` is set in `.env`
- Check user exists: `npm run db:studio`
- Clear browser cookies

### Port Already in Use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill
```

### Development Scripts

```bash
npm run dev          # Start dev server
npm run build         # Build for production
npm run typecheck     # Type checking
npm run lint          # Linting
npm run db:studio     # Open Prisma Studio
npm run db:push       # Push schema changes (dev)
```

---

## Additional Resources

- **Schema Diagrams Guide**: See `SCHEMA_DIAGRAMS_GUIDE.md` for detailed diagram creation guide
- **Architecture Diagrams**: 
  - [Video Upload Flow](./public/Video%20Upload%20and%20Processing%20Flow.png)
  - [Authentication Flow](./public/Authentication%20and%20Session%20Flow.png)
  - [Video Feed Flow](./public/Selection.png)

### Documentation Links
- [Next.js Docs](https://nextjs.org/docs)
- [tRPC Docs](https://trpc.io/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [NextAuth Docs](https://next-auth.js.org/)

---

**Version:** 0.1.0 | **Last Updated:** 2024-12-XX
