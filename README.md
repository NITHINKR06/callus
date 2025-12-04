# Shortform — Minimal Short-Form Video Prototype

## Overview
A minimal short-form video web app built with Next.js, tRPC, Prisma, and Tailwind. Supports user auth, video upload (S3 or local), feed playback, and likes.

## Features
- Sign up / Login with credentials
- Video upload (S3 presigned or local fallback)
- Feed with autoplay muted videos
- Like / Unlike with transactional updates
- Responsive UI with Tailwind CSS

## Tech Stack
- **Next.js** (App Router) - React framework
- **TypeScript** - Type safety
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - ORM for database
- **PostgreSQL** - Database (or MySQL)
- **Tailwind CSS** - Styling
- **NextAuth** - Authentication
- **AWS S3 SDK** - Optional video storage

## Quick Start

### 1. Clone and Install

```bash
git clone <repo> && cd <repo>
npm install
```

### 2. Environment Setup

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/shortform

# NextAuth
AUTH_SECRET=super-secret-change-in-production
AUTH_DISCORD_ID=
AUTH_DISCORD_SECRET=

# AWS S3 (optional - app will use local uploads if not set)
AWS_REGION=us-east-1
S3_BUCKET=my-bucket
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...

# Node Environment
NODE_ENV=development
```

**Note:** If you don't have AWS credentials, the app will automatically use local file storage in `public/uploads/`.

### 3. Database Setup

```bash
# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name init

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/src
  /app
    /api
      /trpc/[trpc]/route.ts
      /upload
        /presign/route.ts
        /local/route.ts
    /auth/page.tsx
    /feed/page.tsx
    /upload/page.tsx
    layout.tsx
    page.tsx
  /components
    AuthForm.tsx
    UploadForm.tsx
    Feed.tsx
    VideoCard.tsx
    Navbar.tsx
    SessionProvider.tsx
  /server
    /api
      /routers
        auth.ts
        video.ts
      root.ts
      trpc.ts
    /auth
      config.ts
      index.ts
    db.ts
/prisma
  schema.prisma
```

## Database Schema

The app uses three main models:

- **User**: User accounts with email/password auth
- **Video**: Video metadata (title, description, URL, likeCount)
- **Like**: User-video like relationships

See `prisma/schema.prisma` for the complete schema.

## API Endpoints

### tRPC Routers

#### Auth Router (`auth`)
- `register({ name, email, password })` - Create new user
- `login({ email, password })` - Authenticate user
- `me()` - Get current user (protected)

#### Video Router (`video`)
- `createMetadata({ url, title?, description?, duration?, thumbnail? })` - Create video record (protected)
- `feed({ cursor?, limit? })` - Get paginated video feed
- `like({ videoId })` - Like a video (protected)
- `unlike({ videoId })` - Unlike a video (protected)
- `userLikes({ userId? })` - Get user's liked videos (protected)

### REST API Routes

- `POST /api/upload/presign` - Get S3 presigned URL or local upload key
- `POST /api/upload/local` - Upload file to local storage

## Upload Flow

1. User selects video file
2. Client calls `/api/upload/presign` with filename and content type
3. Server returns:
   - **S3 mode**: Presigned URL and final public URL
   - **Local mode**: Upload key and final `/uploads/...` path
4. Client uploads file:
   - **S3**: PUT directly to presigned URL
   - **Local**: POST form data to `/api/upload/local`
5. On success, client calls `video.createMetadata` with final URL
6. Video appears in feed

![Video Upload and Processing Flow](./public/Video Upload and Processing Flow.png)

## Features in Detail

### Video Feed
- Infinite scroll pagination
- Autoplay muted videos when 50% visible (IntersectionObserver)
- Pause other videos when scrolling
- Shows user info, timestamp, like count

![Video Feed Flow](./public/Selection.png)

### Likes
- Optimistic UI updates
- Transactional database updates (likeCount stays consistent)
- Requires authentication

### Authentication
- Credentials-based auth with bcrypt password hashing
- NextAuth session management
- Protected routes redirect to `/auth` if not logged in

![Authentication and Session Flow](./public/Authentication and Session Flow.png)

## Development

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format:write

# Database
npm run db:studio  # Open Prisma Studio
npm run db:push    # Push schema changes (dev)
```

## Demo Script (2 minutes)

1. **0–10s**: Intro - "Shortform, a minimal short-form video app built with Next.js, tRPC, Prisma, and Tailwind"
2. **10–30s**: Show sign up / login flow - create account, sign in
3. **30–55s**: Upload a short MP4 - show file selection, upload progress, explain presign → upload → createMetadata flow
4. **55–85s**: Show feed - autoplay behavior, like/unlike, show database changes (Prisma Studio)
5. **85–110s**: Show key code files - `prisma/schema.prisma`, `server/api/routers/video.ts`, `components/UploadForm.tsx`
6. **110–120s**: Wrap up - repo link, how to run locally

## Notes

- File size limit: 20MB (enforced client and server)
- Content type validation: Only `video/*` files accepted
- Local uploads stored in `public/uploads/` (create directory if needed)
- S3 uploads require proper bucket permissions (public-read ACL)

## Troubleshooting

**Database connection errors:**
- Ensure PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Run `npx prisma migrate dev` to set up schema

**Upload fails:**
- Check file size (< 20MB)
- Verify file is video format
- For S3: check AWS credentials and bucket permissions
- For local: ensure `public/uploads/` directory exists and is writable

**Auth not working:**
- Ensure `AUTH_SECRET` is set in `.env`
- Check that user exists in database
- Verify password hashing (bcrypt)

## License

MIT
