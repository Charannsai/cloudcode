# CloudCode Phase 0.1 Architecture Blueprint

This document specifies the foundational architecture adjustments executed during `Phase 0.1` of CloudCode, aimed at achieving absolute parity with native PC environments while operating securely within Docker constraints. 

## Finalized Architectural Solutions

### 1. Hardware & Framework Memory Deadlocks
* **The Constraint:** Next.js Turbopack consumes immense memory (often over 1.5GB) during initial compilation. Running this freely on a 1GB/2GB DigitalOcean VPS without RAM caps causes the host server (Next.js backend, proxy, Nginx) to suffer total OOM crashes.
* **Phase 0.1 Fix:** Established strict hard-limits per Docker container to **1GB Memory**, and manually allocated a `2GB Swapfile` directly to the DigitalOcean Linux kernel. This permanently guarantees the terminal and backend will not be murdered by OOM killers.

### 2. The Universal Compiler Gap
* **The Constraint:** The current `cloudcode-base` Docker image only installs lightweight `Node.js` and pure binaries. Trying to natively compile a Java or Go server inside the workspace instantly blocks non-Node developers.
* **Roadmap Fix:** Replace static Dockerfiles with dynamic **Nixpacks** integration. When a Github repository clones, Nixpacks automatically reads the root directory, identifies the core languages used, and dynamically bundles only the exact language SDKs needed directly into a customized isolated container.

### 3. Native Database Connectivity (God-Mode Sandbox)
* **The Constraint:** On a traditional PC, developers use `localhost` routing and natively install tools like Postgres/Redis. In secure CloudCode containers, `sudo` access is artificially removed, barring them from installing external packages.
* **Roadmap Fix:** Modify the root `Dockerfile` to deliberately inject `coder ALL=(ALL) NOPASSWD:ALL` into the `/etc/sudoers` file. This safely delegates true "God Mode" back to the developer exclusively within their container boundaries, identically replicating a bare-metal PC without imposing external UI buttons.

### 4. Dynamic Port Discovery
* **The Constraint:** Running `npm run dev` yields randomized web ports for frameworks like Vite. Users are forced to manually type these explicitly into the IDE mobile interface. 
* **Roadmap Fix:** Implement a persistent listener within the main Next.js CloudCode backend (`docker exec [id] netstat`). The instant a socket binds to `0.0.0.0`, the Next.js API pushes a WebSocket payload straight to the user's React Native App to deliver a `1-Click Auto-Preview` notification!

### 5. Cross-Container Security (Tenant Snooping)
* **The Constraint:** Issuing `sudo` effectively grants malicious users unrestrained privileges to install Network Scanners (`nmap`). By default, all CloudCode containers share a singular Docker `bridge`, theoretically exposing all users to pinging each other internally.
* **Roadmap Fix:** Complete Tenant Isolation. When a project spins up via `src/lib/docker.ts`, dynamically allocate an isolated virtual docker network (`docker network create workspace-[id]`), permanently sandboxing network calls away from the shared infrastructure.
