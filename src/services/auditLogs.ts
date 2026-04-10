import { getConvexClient, api } from "@/lib/convexClient";
import type { Id } from "../../convex/_generated/dataModel";

export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  userId: string;
  user?: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
  details: unknown;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

export interface AuditLogsResponse {
  data: AuditLog[];
  total: number;
  page: number;
  limit: number;
}

export interface AuditLogParams {
  page?: number;
  limit?: number;
  userId?: string;
  action?: string;
  entityType?: string;
  entityId?: string;
  startDate?: string;
  endDate?: string;
}

type AuditDoc = {
  _id: Id<"auditLogs">;
  userId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: unknown;
  createdAt: number;
};

function mapAuditLog(doc: AuditDoc): AuditLog {
  const details = doc.details as Record<string, unknown> | undefined;
  return {
    id: doc._id,
    action: doc.action,
    entityType: doc.resource,
    entityId: doc.resourceId ?? "",
    userId: doc.userId ?? "",
    details: doc.details,
    ipAddress: (details?.ipAddress as string) ?? "",
    userAgent: (details?.userAgent as string) ?? "",
    createdAt: new Date(doc.createdAt).toISOString(),
  };
}

export async function getAuditLogs(
  params: AuditLogParams = {}
): Promise<AuditLogsResponse> {
  const raw = await getConvexClient().query(api.auditLogs.list, {
    page: params.page,
    limit: params.limit,
    userId: params.userId,
    action: params.action,
    entityType: params.entityType,
    entityId: params.entityId,
    startDate: params.startDate,
    endDate: params.endDate,
  });
  return {
    data: (raw.data as AuditDoc[]).map(mapAuditLog),
    total: raw.total,
    page: raw.page,
    limit: raw.limit,
  };
}
