# CloudCode — Cost, Scaling & Pricing Analysis

## 1. What You Have Today (Single Droplet)

| Component | Current Setup | Cost/mo |
|-----------|--------------|---------|
| DigitalOcean Droplet | 1 VPS (~2-4GB RAM, 2 vCPU) | **$12–24** |
| Supabase | Free tier (500MB DB, 1GB storage) | **$0** |
| Docker Image | `cloudcode-base` built locally on VPS | **$0** |
| GitHub OAuth | Free | **$0** |
| Gemini API | Pay-per-use (low volume) | **~$1–5** |
| Domain + SSL | Optional (Let's Encrypt = free) | **$0–12/yr** |
| **Total today** | | **~$15–30/mo** |

### Current Capacity (Single Droplet)

With your 1GB-per-container limit + 2GB swap + 30-min idle auto-stop:

- **Max concurrent containers**: ~2–3 (on a 4GB droplet)
- **Total users supported**: ~10–20 (because idle stop rotates containers)
- **Storage**: Limited to droplet disk (~80GB typical)

> [!WARNING]
> A single droplet **cannot** support 5K users. You need a fundamentally different architecture.

---

## 2. Proposed Plan Tiers & Resource Allocation

### Resource Limits Per Plan

| Resource | Free (No Ads) | Free (With Ads) | Pro $29 | Pro $99 |
|----------|--------------|----------------|---------|---------|
| **RAM per container** | 512 MB | 768 MB | 2 GB | 4 GB |
| **CPU shares** | 256 | 384 | 1024 | 2048 |
| **Max projects** | 1 | 3 | 10 | Unlimited |
| **Idle timeout** | 10 min | 20 min | 2 hours | 6 hours |
| **Disk per project** | 500 MB | 1 GB | 5 GB | 20 GB |
| **Terminal sessions** | 1 | 2 | 4 | 8 |
| **Custom domain** | ❌ | ❌ | ✅ | ✅ |
| **Always-on container** | ❌ | ❌ | ❌ | ✅ (1 project) |
| **AI Agent usage** | 5 prompts/day | 15 prompts/day | 100 prompts/day | Unlimited |

### Why These Numbers?

- **512MB Free (No Ads)**: Enough to run a basic Vite/Express app. Next.js Turbopack will be tight but usable with swap. This is the "taste" tier — users feel the limitation and are pushed to upgrade.
- **768MB Free (With Ads)**: Slightly better experience. A fair tradeoff for watching ads. Can handle most single-framework projects.
- **2GB Pro $29**: Comfortable for full-stack development (Next.js + DB). The sweet spot for indie developers.
- **4GB Pro $99**: Power users, agencies, teams. Can run heavy stacks (Next.js + Postgres + Redis). The "always-on" perk is the real selling point — no wake-up delays.

---

## 3. Scaling to 5K Users — The Math

### User Distribution (Realistic Assumption)

| Plan | % of Users | Count | Monthly Revenue |
|------|-----------|-------|-----------------|
| Free (No Ads) | 50% | 2,500 | $0 |
| Free (With Ads) | 30% | 1,500 | ~$150–450 (ad revenue) |
| Pro $29 | 15% | 750 | **$21,750** |
| Pro $99 | 5% | 250 | **$24,750** |
| **Total** | | **5,000** | **~$46,650–47,000/mo** |

> [!NOTE]
> Ad revenue estimated at $0.10–0.30 per user/month (in-app ads for a dev tool are low CPM). Ads are more of a "nudge to upgrade" mechanic than a revenue source.

### Concurrency Model

Not all 5K users code at the same time. Here's the realistic concurrency:

| Metric | Value |
|--------|-------|
| Daily Active Users (DAU) | ~500–750 (10–15% of total) |
| Peak concurrent sessions | ~75–120 |
| Average session length | ~45 min |
| Containers active after idle stop | ~40–60 at any moment |

### Peak RAM Requirement

| Plan | Concurrent Containers | RAM Each | Total RAM |
|------|----------------------|----------|-----------|
| Free (No Ads) | ~20 | 512 MB | 10 GB |
| Free (With Ads) | ~15 | 768 MB | ~12 GB |
| Pro $29 | ~20 | 2 GB | 40 GB |
| Pro $99 | ~10 | 4 GB | 40 GB |
| Always-on ($99) | ~5–10 | 4 GB | 20–40 GB |
| **Total Peak** | **~70–75** | | **~102–142 GB** |

Add ~20% headroom for the backend processes, OS, Docker daemon → **~128–160 GB RAM needed at peak**.

---

## 4. Infrastructure Cost at 5K Users

### Option A: DigitalOcean Droplets (Docker Swarm)

| Component | Spec | Count | Cost/mo |
|-----------|------|-------|---------|
| **Manager node** | 4GB RAM, 2 vCPU (runs backend + proxy) | 1 | $24 |
| **Worker nodes** | 32GB RAM, 8 vCPU (runs containers) | 4–5 | $168 × 5 = **$840** |
| **Load Balancer** | DigitalOcean LB | 1 | $12 |
| **Block Storage** | 500GB (project files) | 1 | $50 |
| **Managed DB** (optional) | If moving off Supabase | — | $0 (keep Supabase) |
| **Supabase Pro** | 8GB DB, 100GB storage, daily backups | 1 | **$25** |
| **Domain + SSL** | Cloudflare (free tier) | 1 | $0 |
| **Gemini API** | ~5K users × AI usage | — | **$50–200** |
| **Monitoring** | Uptime Robot / Grafana Cloud free | — | $0 |
| **Bandwidth** | ~2TB/mo (DigitalOcean includes 5TB) | — | $0 |
| **Total** | | | **~$950–1,150/mo** |

### Option B: DigitalOcean Kubernetes (DOKS) — Future Scale

| Component | Spec | Cost/mo |
|-----------|------|---------|
| **DOKS Cluster** | Control plane | $12 |
| **Node pool** | 5× Premium (32GB, 8 vCPU) | $840 |
| **Load Balancer** | Managed | $12 |
| **Block Storage** | 500GB persistent volumes | $50 |
| **Container Registry** | Basic (5 repos, 5GB) | $5 |
| **Supabase Pro** | | $25 |
| **Gemini API** | | $50–200 |
| **Total** | | **~$1,000–1,150/mo** |

---

## 5. Profit/Loss at 5K Users

| | Monthly |
|--|---------|
| **Revenue** | ~$46,500 |
| **Infrastructure** | ~$1,100 |
| **Gemini API** | ~$100 |
| **Supabase** | ~$25 |
| **Misc (domain, monitoring)** | ~$25 |
| **Total Cost** | **~$1,250** |
| **Gross Profit** | **~$45,250/mo** |
| **Gross Margin** | **~97%** |

> [!TIP]
> Cloud IDE businesses have extremely high margins because compute costs scale sub-linearly — idle auto-stop means you're only paying for *active* usage, not all 5K users simultaneously.

---

## 6. Architecture Evolution Roadmap

### Phase 1: NOW — Single Droplet (0–50 users)

```
┌─────────────────────────────┐
│   Single DO Droplet (4GB)   │
│  ┌───────────────────────┐  │
│  │  Next.js Backend      │  │
│  │  + WebSocket Proxy    │  │
│  │  + Docker Daemon      │  │
│  │  + All Containers     │  │
│  └───────────────────────┘  │
└─────────────────────────────┘
         ↕ Supabase (external)
```

**Cost: ~$24/mo**

---

### Phase 2: NEXT — Vertical Scale (50–500 users)

Upgrade to a bigger droplet. No code changes needed.

```
┌─────────────────────────────────┐
│   Single DO Droplet (32GB)      │
│  ┌───────────────────────────┐  │
│  │  Backend + Containers     │  │
│  │  Can run ~25 concurrent   │  │
│  └───────────────────────────┘  │
└─────────────────────────────────┘
```

**Cost: ~$168/mo** — Zero code changes, just resize the droplet.

---

### Phase 3: SCALE — Multi-Node with Docker Swarm (500–5K users)

Separate the backend from the compute workers.

```
                    ┌──────────────┐
                    │   DO Load    │
                    │   Balancer   │
                    └──────┬───────┘
                           │
              ┌────────────┴────────────┐
              │                         │
     ┌────────┴────────┐      ┌────────┴────────┐
     │  Manager Node   │      │  Manager Node   │
     │  (Backend API)  │      │  (Backend API)  │
     │  4GB / 2 vCPU   │      │  (hot standby)  │
     └────────┬────────┘      └─────────────────┘
              │
    ┌─────────┼─────────┬─────────┐
    │         │         │         │
┌───┴───┐┌───┴───┐┌───┴───┐┌───┴───┐
│Worker1││Worker2││Worker3││Worker4│
│ 32GB  ││ 32GB  ││ 32GB  ││ 32GB  │
│Contrs ││Contrs ││Contrs ││Contrs │
└───────┘└───────┘└───────┘└───────┘
```

**Code changes needed:**
- Container scheduling logic (assign containers to least-loaded worker)
- Shared storage for `/projects/` (DigitalOcean Spaces or NFS mount)
- Health checks and container migration between workers

**Cost: ~$1,100/mo**

---

### Phase 4: FULL SCALE — Kubernetes (5K+ users)

```
┌─────────────────────────────────────────────┐
│          DigitalOcean Kubernetes (DOKS)      │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Backend  │  │ Backend  │  │ Backend  │  │
│  │ Pod (×3) │  │ Pod (×3) │  │ Pod (×3) │  │
│  └──────────┘  └──────────┘  └──────────┘  │
│                                             │
│  ┌──────────────────────────────────────┐   │
│  │  User Container Pods (auto-scaled)  │   │
│  │  Managed by K8s scheduler           │   │
│  │  Node auto-scaling 2→10 nodes       │   │
│  └──────────────────────────────────────┘   │
│                                             │
│  ┌──────────┐  ┌──────────┐                │
│  │ Ingress  │  │Persistent│                │
│  │Controller│  │ Volumes  │                │
│  └──────────┘  └──────────┘                │
└─────────────────────────────────────────────┘
```

This is the "big league" — auto-scaling, self-healing, rolling deployments. Only needed at 5K+ with growth trajectory.

---

## 7. What To Do RIGHT NOW

You don't need to worry about Phase 3/4 yet. Here's the immediate priority:

1. **Stay on a single droplet** — upgrade to 8GB ($48/mo) when you get your first 10–20 real users
2. **Implement plan-based resource limits** in `docker.ts` — this is a code change worth doing early (different `Memory`, `CpuShares` per plan)
3. **Add a `plan` column to your Supabase `projects` table** (or `users` table)
4. **Don't over-engineer** — Docker Swarm/K8s is a Phase 3 problem

> [!IMPORTANT]
> The idle auto-stop system we just built is your **biggest cost saver**. At 5K users, it reduces your concurrent container count from potentially 500+ down to ~60–75. That's a 7–8× reduction in infrastructure cost.
