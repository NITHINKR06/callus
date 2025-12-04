# IntApp - Short-Form Video Application

A modern short-form video web application (similar to TikTok) built with Next.js, tRPC, Prisma, and PostgreSQL.

[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-green)](https://www.prisma.io/)

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL 14+ (or Docker/Podman)

### Setup

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
   mkdir -p public/uploads
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```
   Open http://localhost:3000

---

## ✨ Features

- **🔐 Authentication**: Sign up/login with credentials or Discord OAuth
- **📹 Video Upload**: AWS S3 or local file storage
- **📱 Video Feed**: Infinite scroll with autoplay
- **❤️ Social**: Like/unlike videos with real-time updates
- **🎨 UI**: Responsive design with Tailwind CSS

---

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 (App Router), React 19, TypeScript
- **API**: tRPC (end-to-end type safety)
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: NextAuth.js v5
- **Storage**: AWS S3 (optional, falls back to local)
- **Styling**: Tailwind CSS 4.0
- **State**: TanStack Query

---

## 📐 Architecture

### High-Level Overview

**📹 [Architecture Video](./public/SA.mkv)**

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

#### Authentication Flow

![Authentication and Session Flow](./public/Authentication%20and%20Session%20Flow.png)

```
User submits credentials → auth.login → bcrypt validation 
→ NextAuth creates session → Protected routes accessible
```

#### Video Feed Flow

![Video Feed Flow](./public/Selection.png)

```
/feed → video.feed query → Database pagination → Render VideoCards 
→ IntersectionObserver triggers autoplay
```

---

## 🗄️ Database Schema

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
        datetime createdAt
    }
    
    Video {
        string id PK
        string userId FK
        string url
        int likeCount
        datetime createdAt
    }
    
    Like {
        string id PK
        string userId FK
        string videoId FK
    }
```

**Core Models:**
- **User**: Accounts with email/password auth
- **Video**: Video metadata (title, description, URL, likeCount)
- **Like**: User-video relationships
- **Post**: User posts

See `prisma/schema.prisma` for complete schema.

---

## 🔌 API Reference

### tRPC Routers

**Auth Router (`auth`)**
- `auth.register` - Create new user `{name, email, password}`
- `auth.login` - Authenticate user `{email, password}`
- `auth.me` - Get current user (protected)

**Video Router (`video`)**
- `video.createMetadata` - Create video record (protected)
- `video.feed` - Get paginated feed `{cursor?, limit?}`
- `video.like` - Like a video `{videoId}` (protected)
- `video.unlike` - Unlike a video `{videoId}` (protected)
- `video.userLikes` - Get user's liked videos (protected)

### REST API Routes

- `POST /api/upload/presign` - Get S3 presigned URL or local upload key
- `POST /api/upload/local` - Upload file to local storage
- `POST /api/auth/[...nextauth]` - NextAuth endpoints

---

## 📁 Project Structure

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
│   ├── server/               # Server-side code
│   │   ├── api/routers/      # tRPC routers
│   │   └── auth/             # NextAuth config
│   └── trpc/                 # tRPC client setup
└── .env                      # Environment variables
```

---

## 🛠️ Development

```bash
npm run dev          # Start dev server
npm run build         # Build for production
npm run typecheck     # Type checking
npm run lint          # Linting
npm run db:studio     # Open Prisma Studio
npm run db:push       # Push schema changes (dev)
```

---

## 🐛 Troubleshooting

**Database connection errors:**
- Verify PostgreSQL is running: `pg_isready` or `docker ps`
- Check `DATABASE_URL` in `.env`
- Ensure database exists: `CREATE DATABASE intapp;`

**Upload fails:**
- File size: Maximum 20MB
- File type: Only `video/*` MIME types
- S3: Check AWS credentials and bucket permissions
- Local: Ensure `public/uploads/` exists and is writable

**Auth not working:**
- Verify `AUTH_SECRET` is set in `.env`
- Check user exists: `npm run db:studio`
- Clear browser cookies

**Port already in use:**
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/macOS
lsof -ti:3000 | xargs kill
```

---

## 📚 Documentation

For detailed documentation, see **[DOCUMENTATION.md](./DOCUMENTATION.md)**

Additional guides:
- **[Schema Diagrams Guide](./SCHEMA_DIAGRAMS_GUIDE.md)** - How to create and maintain schema diagrams

---

## 📝 Notes

- File size limit: 20MB (enforced client and server)
- Content type validation: Only `video/*` files accepted
- Local uploads stored in `public/uploads/`
- S3 uploads require proper bucket permissions (public-read ACL)

---

## 📄 License

MIT

---

**Version:** 0.1.0 | **Last Updated:** 2024-12-XX
