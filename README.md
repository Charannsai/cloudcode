# CloudCode - Phase 0 Development

## Still on working phase!!!

This repository contains the foundational implementation for **CloudCode**, a modern cloud development environment platform. Phase 0 focused on establishing the core architecture, backend services, and a mobile application for managing cloud workspaces.

The project is structured as a monorepo containing two main packages: `backend` and `mobile`.

## What was Developed in Phase 0

### 1. Backend Service (Next.js)
The backend functions as an API and proxy server built on Next.js 14, orchestrated to manage resources. Key features implemented include:

- **Custom Server Infrastructure (`server.ts`)**: 
  - A custom Node.js server to handle standard HTTP requests and intercept WebSockets.
  - Connects WebSocket strings into Docker container terminal streams using `node-pty` and `dockerode`.
  
- **Project Provisioning APIs**: 
  - RESTful endpoints (`/api/projects`) to provision structured environments.
  - Supports bootstrapping predefined templates like `Node.js`, `React + Vite`, or `Blank Workspace`.
  - Supports importing and cloning repositories directly via GitHub URLs (`/api/projects/import`).

- **Container Management**: 
  - Automated provisioning of isolated Docker containers for each created/imported project, giving each workspace a dedicated runtime environment.

- **Authentication & Authorization**: 
  - Secured endpoints using **Supabase** JWT tokens and robust user validations ensuring workspaces correlate securely to the authenticated GitHub user.

---

### 2. Mobile Client (React Native / Expo)
The mobile application serves as the user's primary administration interface built using **Expo** and **React Native**, designed with a dynamic dark/light mode and smooth micro-animations. Key features implemented include:

- **Dashboard Experience (`(tabs)/dashboard.tsx`)**:
  - Highlights essential workspace statistics (e.g., active workspaces, CPU usage, uptime).
  - Displays recent activity feeds and offers quick-action shortcuts to the editor or cloud shell.
  
- **Project Provisioning Wizard (`new-project.tsx`)**:
  - Full UI flow allowing users to initialize completely fresh workspaces from local templates (Node.js, React) or via cloning a remote GitHub repository.
  
- **Interactive AI Prompt (`(tabs)/ai.tsx`)**:
  - A sophisticated prompt interface ("Describe your idea, Agent will bring it to life...") laid out to capture user intents, ready for incoming AI logic generation integrations.

- **Infrastructure and State Management**:
  - Implemented client-side routing via `expo-router`.
  - Centralized application state managed efficiently through `zustand`.
  - Icon system integrated via `lucide-react-native` and styled with custom font assets like Inter.
  - Local caching and secure environment setup with Supabase authentication.

## Supported Technologies & Stack
- **Backend Pipeline**: Next.js, Docker/Dockerode, WebSockets, Zod, UUID, Supabase.
- **Mobile Stack**: Expo, React Native, Zustand, Expo Router, Reanimated, Lucide Icons.
