/**
 * Tier Configuration — Defines resource boundaries for Free, Pro, and Advanced tiers.
 *
 * These limits are enforced during container creation and idle management.
 * Tier is resolved from the user's subscription status in Supabase.
 */

export type TierName = 'free' | 'pro' | 'advanced'

export interface TierConfig {
  name: TierName
  displayName: string
  price: { monthly: number; yearly: number }

  // Container resource limits
  container: {
    cpus: number         // vCPU limit (e.g., 0.5 = half a core)
    memoryMB: number     // RAM in megabytes
    diskGB: number       // Storage quota in gigabytes
    maxWorkspaces: number // Max number of workspaces (0 = unlimited)
    idleTimeoutMinutes: number // Inactivity timeout before auto-sleep (0 = user-defined)
    networkSpeedMbps: number // Network speed cap in Mbps (0 = uncapped)
    alwaysOnSlots: number // Number of "Always-on" workspace slots
  }

  // API rate limits
  api: {
    requestsPerMinute: number // 0 = uncapped
  }

  // AI token limits
  ai: {
    monthlyTokens: number // 0 = unlimited
    premiumModels: boolean // Access to Claude, ChatGPT, Gemini latest
    byokSupported: boolean // Bring Your Own Key
  }
}

export const TIERS: Record<TierName, TierConfig> = {
  free: {
    name: 'free',
    displayName: 'Free',
    price: { monthly: 0, yearly: 0 },
    container: {
      cpus: 0.5,
      memoryMB: 512,
      diskGB: 5,
      maxWorkspaces: 3,
      idleTimeoutMinutes: 10,
      networkSpeedMbps: 15,
      alwaysOnSlots: 0,
    },
    api: {
      requestsPerMinute: 25,
    },
    ai: {
      monthlyTokens: 50_000,
      premiumModels: false,
      byokSupported: true,
    },
  },

  pro: {
    name: 'pro',
    displayName: 'Pro',
    price: { monthly: 25, yearly: 225 },
    container: {
      cpus: 4,
      memoryMB: 8192,
      diskGB: 50,
      maxWorkspaces: 20,
      idleTimeoutMinutes: 60,
      networkSpeedMbps: 0, // Uncapped
      alwaysOnSlots: 1,
    },
    api: {
      requestsPerMinute: 500,
    },
    ai: {
      monthlyTokens: 5_000_000,
      premiumModels: true,
      byokSupported: true,
    },
  },

  advanced: {
    name: 'advanced',
    displayName: 'Advanced',
    price: { monthly: 99, yearly: 990 },
    container: {
      cpus: 8,
      memoryMB: 32768,
      diskGB: 200,
      maxWorkspaces: 0, // Unlimited
      idleTimeoutMinutes: 0, // User-defined
      networkSpeedMbps: 0, // Uncapped
      alwaysOnSlots: 5,
    },
    api: {
      requestsPerMinute: 0, // Uncapped
    },
    ai: {
      monthlyTokens: 0, // Unlimited
      premiumModels: true,
      byokSupported: true,
    },
  },
}

/**
 * Resolve a user's tier from their subscription status.
 * Falls back to 'free' if no active subscription is found.
 */
export function getTierConfig(tierName?: string | null): TierConfig {
  if (tierName && tierName in TIERS) {
    return TIERS[tierName as TierName]
  }
  return TIERS.free
}

/**
 * Convert tier container limits to Docker HostConfig options.
 */
export function getTierDockerLimits(tier: TierConfig) {
  return {
    // NanoCpus: absolute CPU limit (e.g., 0.5 vCPU = 500,000,000 nanoseconds)
    NanoCpus: tier.container.cpus * 1e9,
    // Memory in bytes
    Memory: tier.container.memoryMB * 1024 * 1024,
    // Disk quota (requires overlay2 + xfs backing)
    StorageOpt: { size: `${tier.container.diskGB}G` },
  }
}
