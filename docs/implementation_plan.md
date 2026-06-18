# Container Idle Auto-Stop & Auto-Restart System

Stop idle containers to save resources. Auto-restart them when the user returns.

## Proposed Changes

### Activity Tracker

#### [NEW] [activityTracker.ts](file:///c:/Users/pathu/OneDrive/Desktop/cloudcode/backend/src/lib/activityTracker.ts)

In-memory `Map<projectId, lastActivityTimestamp>`. Exports:
- `recordActivity(projectId)` — called on every preview request, terminal input, file save
- `getLastActivity(projectId)` — returns timestamp
- `isIdle(projectId, thresholdMs)` — returns boolean
- `removeProject(projectId)` — cleanup on project delete

---

### Docker Config

#### [MODIFY] [docker.ts](file:///c:/Users/pathu/OneDrive/Desktop/cloudcode/backend/src/lib/docker.ts)

- Change `RestartPolicy` from `{ Name: 'unless-stopped' }` to `{ Name: 'no' }` (L63)
- Add new `stopContainer(containerId)` function — stops container without removing it
- Add new `startContainer(containerId)` function — restarts a stopped container
- Add new `ensureContainerRunning(projectId)` function — checks if container is running, starts it if stopped, updates DB status

---

### Integrate Activity Recording

#### [MODIFY] [route.ts (preview)](file:///c:/Users/pathu/OneDrive/Desktop/cloudcode/backend/src/app/api/preview/%5Bid%5D/%5B%5B...path%5D%5D/route.ts)

- Import `recordActivity` and `ensureContainerRunning`
- Call `recordActivity(projectId)` at the start of every preview GET request
- Before proxying, call `ensureContainerRunning(projectId)` — if container was stopped, auto-start it and wait for it to be ready
- When container was sleeping, return a "Waking up..." HTML page that auto-refreshes after 5 seconds

#### [MODIFY] [server.ts](file:///c:/Users/pathu/OneDrive/Desktop/cloudcode/backend/src/server.ts)

- Import `recordActivity`
- In terminal WebSocket `on('message')` handler: call `recordActivity(projectId)` on every input
- In WebSocket proxy handler: call `recordActivity(projectId)` on connection
- Remove the old 5-min tmux-only timeout (L248–264)
- Add a `setInterval` cron that runs every 5 minutes:
  - Query all projects with `status = 'ready'` and a `container_id`
  - For each, check `isIdle(projectId, 30 * 60 * 1000)` (30 min)
  - If idle: stop the container, update DB status to `'sleeping'`
  - Log: `[Idle] Stopped container for project {name}`

#### [MODIFY] [route.ts (project detail)](file:///c:/Users/pathu/OneDrive/Desktop/cloudcode/backend/src/app/api/projects/%5Bid%5D/route.ts)

- Import `recordActivity`
- Call `recordActivity(id)` on each GET request (viewing project = activity)

---

### Sleeping Preview Page

#### [MODIFY] [route.ts (preview)](file:///c:/Users/pathu/OneDrive/Desktop/cloudcode/backend/src/app/api/preview/%5Bid%5D/%5B%5B...path%5D%5D/route.ts)

When the container is stopped and the preview is accessed, return the same styled error page that already exists in the catch block — the `🔌 Server Not Found` page with the generic "We couldn't reach 127.0.0.1:{port}" message. No mention of sleeping, pausing, or CloudCode internals. It should look exactly like a normal connection timeout.

---

### Docker Status Updates

#### [MODIFY] [docker.ts](file:///c:/Users/pathu/OneDrive/Desktop/cloudcode/backend/src/lib/docker.ts)

Add two new functions:

```typescript
export async function stopContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId)
  await container.stop({ t: 5 })
}

export async function startContainer(containerId: string): Promise<void> {
  const container = docker.getContainer(containerId)
  await container.start()
}
```

---

## Verification Plan

### Manual Verification
1. Create a project, start dev server
2. Wait 30 minutes (or temporarily set threshold to 2 min for testing)
3. Verify container stops automatically
4. Open the project again → verify container restarts in ~3-5 seconds
5. Check preview link while sleeping → verify "sleeping" page appears
6. Verify terminal reconnects after wake-up
