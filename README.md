# ReviewIQ 🤖

AI-powered Code Review & PR Assistant built with Next.js 14, Claude AI, PostgreSQL, and Redis.

---

## ⚡ Quick Start

### 1. Install dependencies
```bash
npm install
```

### 2. Set up environment variables
```bash
cp .env.example .env
```
Fill in all values in `.env` (see Environment Variables section below).

### 3. Start infrastructure (Docker)
```bash
docker compose up -d
```
This starts PostgreSQL on port `5432` and Redis on port `6379`.

### 4. Set up the database
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📋 All NPM Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on http://localhost:3000 |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:push` | Push schema to DB (no migration file) |
| `npm run db:migrate` | Create and run a migration |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
| `npm run db:seed` | Seed the database with sample data |

---

## 🔑 Environment Variables

```env
# App
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Database (PostgreSQL)
DATABASE_URL="postgresql://postgres:password@localhost:5432/ReviewIQ"

# Redis
REDIS_URL="redis://localhost:6379"

# GitHub OAuth
# → Go to: https://github.com/settings/developers → New OAuth App
# → Homepage URL: http://localhost:3000
# → Callback URL: http://localhost:3000/api/auth/callback/github
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# JWT Secret (min 32 chars, any random string)
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters

# Anthropic Claude API
# → Get key at: https://console.anthropic.com
ANTHROPIC_API_KEY=sk-ant-...
```

---

## 🐳 Docker Compose Setup

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
      POSTGRES_DB: ReviewIQ
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

Then run:
```bash
docker compose up -d
```

---

## 🏗️ Project Structure

```
ReviewIQ/
├── app/
│   ├── (dashboard)/          # Protected dashboard routes
│   │   ├── layout.tsx        # Sidebar + auth guard
│   │   ├── dashboard/        # Main dashboard page
│   │   └── reviews/          # Reviews list + detail
│   ├── api/
│   │   ├── auth/             # GitHub OAuth + logout
│   │   └── review/           # Streaming AI review trigger
│   ├── login/                # Auth page
│   ├── globals.css           # Design tokens + base styles
│   └── layout.tsx            # Root layout + fonts
├── components/
│   ├── layout/Sidebar.tsx    # Main navigation
│   └── dashboard/            # Charts, PR queue, issue breakdown
├── lib/
│   ├── auth.ts               # JWT + GitHub OAuth helpers
│   ├── claude.ts             # Claude AI review engine
│   ├── db.ts                 # Prisma singleton
│   └── redis.ts              # Redis + rate limiting + queue
├── middleware.ts             # Route protection
├── prisma/
│   └── schema.prisma         # Full DB schema
├── tailwind.config.ts        # Design system tokens
└── next.config.ts
```

---

## 🚀 Deployment

### Vercel (Frontend)
```bash
npm install -g vercel
vercel deploy
```
Add all environment variables in the Vercel dashboard.

### Railway (Database + Redis)
1. Create a new project at [railway.app](https://railway.app)
2. Add PostgreSQL plugin → copy `DATABASE_URL`
3. Add Redis plugin → copy `REDIS_URL`
4. Update your Vercel environment variables

---

## 🎯 GitHub OAuth Setup

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Set:
   - **Homepage URL**: `http://localhost:3000`
   - **Callback URL**: `http://localhost:3000/api/auth/callback/github`
4. Copy **Client ID** and **Client Secret** into your `.env`

For production, create a separate OAuth app with your production domain.
