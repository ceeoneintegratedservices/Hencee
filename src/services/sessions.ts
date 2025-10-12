import { API_ENDPOINTS } from "../config/api";
import { authFetch } from "./authFetch";

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
    try {
      const url = API_ENDPOINTS.sessionsActive;
      const res = await authFetch(url);
      const data = await res.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get session statistics for the current user
   */
  static async getSessionStats(): Promise<SessionStatsResponse> {
    try {
      const url = API_ENDPOINTS.sessionsStats;
      const res = await authFetch(url);
      const data = await res.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke a specific session by ID
   */
  static async revokeSession(sessionId: string): Promise<SessionResponseDto> {
    try {
      const url = API_ENDPOINTS.sessionById(sessionId);
      const res = await authFetch(url, {
        method: "DELETE"
      });
      const data = await res.json();
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke all other sessions except the current one
   */
  static async revokeAllOthers(): Promise<SessionResponseDto> {
    try {
      const url = API_ENDPOINTS.sessionsOthers;
      const res = await authFetch(url, {
        method: "DELETE"
      });
      const data = await res.json();
      return data;
    } catch (error) {
      throw error;
    }
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
