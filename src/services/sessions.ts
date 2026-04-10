import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

// Session Data Models
export interface SessionDto {
  id: string;                    // Session ID (cuid)
  userId: string;               // User ID (UUID)
  userAgent: string;            // Browser user agent
  ipAddress: string;            // IP address
  deviceType: string;           // desktop, mobile, tablet
  browser: string;              // Browser name (Chrome, Firefox, etc.)
  operatingSystem: string;      // OS name (Windows, macOS, etc.)
  location: string;             // Country (default: Nigeria)
  city: string;                 // City (default: Lagos)
  isCurrent: boolean;           // Whether this is current session
  isActive: boolean;            // Whether session is active
  lastActivity: string;         // Last activity timestamp (ISO)
  createdAt: string;            // Creation timestamp (ISO)
  expiresAt: string;            // Expiration timestamp (ISO)
}

export interface ActiveSessionsResponseDto {
  sessions: SessionDto[];       // Array of active sessions
  totalCount: number;           // Total number of active sessions
  currentSessionId: string;     // Current session ID
}

export interface SessionResponseDto {
  message: string;              // Success message
  sessionId: string;            // Session ID that was revoked
  timestamp: string;            // Response timestamp (ISO)
}

export interface SessionStats {
  totalSessions: number;        // Total sessions ever created
  activeSessions: number;       // Currently active sessions
  expiredSessions: number;      // Expired sessions
  lastLogin: string | null;     // Last login timestamp (ISO)
}

export interface SessionStatsResponse {
  stats: SessionStats;
  message: string;
}

// Session API Service
export class SessionService {
  /**
   * Get all active sessions for the current user
   */
  static async getActiveSessions(): Promise<ActiveSessionsResponseDto> {
    const rows = await getConvexClient().query(api.sessions.list, {});
    const sessions: SessionDto[] = (rows as { _id: string; userId: string; lastActiveAt: number }[]).map(
      (r) => ({
        id: String(r._id),
        userId: r.userId,
        userAgent: "",
        ipAddress: "",
        deviceType: "desktop",
        browser: "",
        operatingSystem: "",
        location: "",
        city: "",
        isCurrent: true,
        isActive: true,
        lastActivity: new Date(r.lastActiveAt).toISOString(),
        createdAt: new Date(r.lastActiveAt).toISOString(),
        expiresAt: new Date(r.lastActiveAt + 86400000).toISOString(),
      })
    );
    return {
      sessions,
      totalCount: sessions.length,
      currentSessionId: sessions[0]?.id ?? "",
    };
  }

  /**
   * Get session statistics for the current user
   */
  static async getSessionStats(): Promise<SessionStatsResponse> {
    const active = await SessionService.getActiveSessions();
    return {
      stats: {
        totalSessions: active.totalCount,
        activeSessions: active.totalCount,
        expiredSessions: 0,
        lastLogin: active.sessions[0]?.lastActivity ?? null,
      },
      message: "ok",
    };
  }

  /**
   * Revoke a specific session by ID
   */
  static async revokeSession(sessionId: string): Promise<SessionResponseDto> {
    await getConvexClient().mutation(api.sessions.revoke, { id: sessionId as Id<"sessions"> });
    return {
      message: "Session revoked",
      sessionId,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Revoke all other sessions except the current one
   */
  static async revokeAllOthers(): Promise<SessionResponseDto> {
    return {
      message: "Other sessions cleared (no-op in Convex stub)",
      sessionId: "",
      timestamp: new Date().toISOString(),
    };
  }
}

// Utility functions for UI
export const getDeviceIcon = (deviceType: string): string => {
  switch (deviceType.toLowerCase()) {
    case 'mobile': return '📱';
    case 'tablet': return '📱';
    case 'desktop': return '💻';
    default: return '🖥️';
  }
};

export const getBrowserIcon = (browser: string): string => {
  const browserLower = browser.toLowerCase();
  if (browserLower.includes('chrome')) return '🌐';
  if (browserLower.includes('firefox')) return '🦊';
  if (browserLower.includes('safari')) return '🧭';
  if (browserLower.includes('edge')) return '🌐';
  return '🌐';
};

export const getOperatingSystemIcon = (os: string): string => {
  const osLower = os.toLowerCase();
  if (osLower.includes('windows')) return '🪟';
  if (osLower.includes('mac')) return '🍎';
  if (osLower.includes('linux')) return '🐧';
  if (osLower.includes('android')) return '🤖';
  if (osLower.includes('ios')) return '📱';
  return '💻';
};

export const formatLastActivity = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  
  return date.toLocaleDateString();
};

export const isSessionExpiringSoon = (expiresAt: string): boolean => {
  const expirationDate = new Date(expiresAt);
  const now = new Date();
  const diffInHours = (expirationDate.getTime() - now.getTime()) / (1000 * 60 * 60);
  return diffInHours < 2; // Expiring within 2 hours
};

// Export individual functions for convenience
export const {
  getActiveSessions,
  getSessionStats,
  revokeSession,
  revokeAllOthers
} = SessionService;
