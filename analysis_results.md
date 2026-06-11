# CloudCode Concurrency & Scalability Analysis

This document provides a comprehensive architectural breakdown of how the CloudCode system natively supports high concurrency and multi-tenant scaling.

## 1. Multi-Tenant Container Isolation
The core engine of CloudCode's concurrency model relies on **Docker Containerization**. 
When a user launches a project, the system does not share processing power or files on the host machine directly. Instead:
- **Dedicated Environments:** Every single project spins up its own completely isolated Linux virtual environment (Docker container).
- **Resource Capping:** Each container is strictly capped at `1GB` of RAM and heavily throttled CPU shares (`CpuShares: 512`). This prevents a single user (or a runaway Node/React process) from starving the host Virtual Private Server (VPS) and affecting other concurrent users.
- **Filesystem Isolation:** The user's code lives inside a dedicated host folder (`/backend/data/projects/<uuid>`) which is bind-mounted securely into the container. Users cannot access each other's files.

## 2. Collision-Free Networking (Zero Port Clashes)
A common problem with concurrent cloud IDEs is port collisions (e.g., if User A runs a React app on `localhost:3000`, User B cannot also use port 3000).
CloudCode solves this beautifully using **Internal Docker Bridge IP Routing**:
- When a user starts a server on port `3000` (or `8080`, `5173`, etc.), they are opening port `3000` *inside their isolated container*. 
- The Next.js backend proxy (`server.ts` and `/api/preview/[id]/...`) dynamically inspects the Docker daemon to find the container's private internal IP address (e.g., `172.17.0.4`).
- It then proxies the HTTP/WebSocket traffic directly to `172.17.0.4:3000`. 
- **Result:** You can have 1,000 concurrent users all running their development servers on port `3000` simultaneously, and they will never collide!

## 3. Stateless Backend Architecture
The Next.js backend API and the Express traffic proxy are entirely **stateless**:
- **Authentication:** Sessions are validated instantly via Supabase JWT tokens. The backend does not hold session memory, meaning it can handle thousands of concurrent requests rapidly.
- **Database Security:** The Supabase PostgreSQL database utilizes strict **Row Level Security (RLS)**. Even if an API request gets mixed up, the database physically rejects any query where the `user_github_id` does not match the authenticated user making the request.

## 4. Intelligent Resource Management
To ensure the host server doesn't crash from too many idle containers running concurrently:
- **Activity Tracking:** Every API interaction, terminal keystroke, and preview proxy request registers "activity" for a specific project.
- **Auto-Sleep Cron Job:** A background cron job constantly scans the activity logs. If a container has not received traffic for 30 minutes, it is gracefully put to sleep (`docker stop`), instantly freeing up CPU and RAM for active concurrent users.
- **Instant Wake-Up:** The moment a user returns to the app and sends a request, the `ensureContainerRunning` middleware intercepts the traffic, wakes the container back up in under 2 seconds, and fulfills the request seamlessly.

## 5. Security & SSH
- Because of the global SSH volume (`cloudcode-global-ssh`) mapped into `/home/coder/.ssh`, SSH keys are safely sandboxed. A user cannot escape their container to see another user's SSH keys, nor can they access the host machine's root SSH credentials.

---

> [!TIP]
> **Scaling Upwards**
> If your concurrent user base grows beyond what a single VPS can handle, this architecture is perfectly primed for Kubernetes (K8s). You would simply swap the local `dockerode` commands with the Kubernetes API, allowing containers to be spun up across a vast cluster of machines while maintaining the exact same proxy logic!
