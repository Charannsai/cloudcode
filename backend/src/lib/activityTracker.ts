/**
 * Activity Tracker — Server-side idle detection for Docker containers.
 *
 * Tracks the last activity timestamp per project. Used by the idle cron
 * to determine which containers should be stopped to save resources.
 *
 * Activity is recorded on:
 *  - Preview requests (page loads, asset fetches)
 *  - Terminal WebSocket input
 *  - Project API access (viewing project details)
 */

const activityMap = new Map<string, number>()

/**
 * Record activity for a project. Call this on every meaningful request.
 */
export function recordActivity(projectId: string): void {
  activityMap.set(projectId, Date.now())
}

/**
 * Get the last activity timestamp for a project.
 * Returns 0 if no activity has been recorded.
 */
export function getLastActivity(projectId: string): number {
  return activityMap.get(projectId) || 0
}

/**
 * Check if a project has been idle for longer than the given threshold.
 * Returns true if no activity has been recorded within the threshold.
 */
export function isIdle(projectId: string, thresholdMs: number): boolean {
  const lastActivity = activityMap.get(projectId)
  if (!lastActivity) return true // Never active = idle
  return (Date.now() - lastActivity) > thresholdMs
}

/**
 * Remove a project from the activity tracker (e.g. on project deletion).
 */
export function removeProject(projectId: string): void {
  activityMap.delete(projectId)
}

/**
 * Get all tracked project IDs.
 */
export function getTrackedProjects(): string[] {
  return Array.from(activityMap.keys())
}
