# CloudCode

Cloud development environment that runs full-stack applications from your phone. Edit code, run terminals, and preview apps — all powered by isolated Docker containers on a remote server.

## What It Does

- **Mobile Code Editor** — Write and edit code from a React Native app with file tree navigation and auto-save.
- **Live Terminal** — Full interactive shell sessions streamed over WebSockets directly to your device.
- **App Preview** — Run web apps inside containers and preview them through an authenticated reverse proxy.
- **Git Integration** — Stage, commit, diff, and push/pull from the mobile client.
- **AI Assistant** — Context-aware code generation and autonomous task execution within workspaces.
- **Auto Sleep/Wake** — Idle containers automatically stop after 30 minutes and restart on demand.

## Repository Structure

```
cloudcode/
├── backend/          # Next.js 16 custom server (API + WebSocket + preview proxy)
│   └── src/
│       ├── app/      # App Router API endpoints (auth, projects, billing, AI, preview)
│       ├── lib/      # Core modules (Docker, Git, Supabase, terminal, auth)
│       └── server.ts # Custom HTTP/WS server entry point
├── mobile/           # React Native / Expo client application
│   ├── app/          # File-based routing (tabs, project workspace, auth)
│   ├── components/   # Reusable UI components
│   └── store/        # Zustand state management
├── web/              # Marketing website (Next.js)
├── scripts/          # Host setup and utility scripts
└── .github/          # CI/CD workflows
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend Server | Next.js 16 with custom Node.js HTTP/WS server |
| Container Runtime | Docker via Dockerode |
| Database | Supabase (PostgreSQL + Auth + RLS) |
| Mobile Client | React Native + Expo Router |
| State Management | Zustand |
| Real-time Comms | Native WebSockets (terminal I/O, HMR proxy) |
| Monitoring | Sentry (crash reporting), Datadog (APM + logs) |
| Payments | Dodo Payments |

## Getting Started

### Backend

```bash
cd backend
npm install
```

Create a `.env.local` file:

```env
SUPABASE_URL=<your-supabase-url>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
JWT_SECRET=<your-jwt-secret>
```

Start the dev server:

```bash
npm run dev
```

### Mobile App

```bash
cd mobile
npm install
```

Configure connection settings in `.env`, then:

```bash
npx expo start -c
```

## License

Private repository. All rights reserved.
