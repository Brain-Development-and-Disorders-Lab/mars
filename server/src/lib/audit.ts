import { PostHogClient } from "@lib/posthog";

// Key event names
export type AuditEventName =
  | "auth.login.success"
  | "auth.login.failure"
  | "auth.logout"
  | "auth.password_reset_requested"
  | "auth.orcid_linked"
  | "api_key.used"
  | "api_key.rejected"
  | "api_key.expired"
  | "api_key.scope_violation"
  | "api_key.generated"
  | "api_key.revoked"
  | "admin.role_changed"
  | "admin.features_changed"
  | "admin.ban_changed"
  | "permission.denied"
  | "entity.listed"
  | "entity.read"
  | "entity.created"
  | "entity.updated"
  | "entity.archived"
  | "entity.exported"
  | "project.listed"
  | "project.read"
  | "project.created"
  | "project.updated"
  | "project.archived"
  | "project.exported"
  | "project.deleted";

export interface AuditEventProperties {
  userId?: string;
  workspaceId?: string;
  ip?: string;
  method?: string;
  path?: string;
  gqlOperation?: string;
  errorCode?: string;
  keyScope?: string;
  role?: string;
  reason?: string;
  [key: string]: unknown;
}

/**
 * Utility function to store events for audit within `PostHog`
 * @param {AuditEventName} event Specific event type
 * @param {string} distinctId Identifier for event
 * @param {AuditEventProperties} properties Various properties associated with event
 */
export const audit = (event: AuditEventName, distinctId: string, properties: AuditEventProperties = {}): void => {
  if (!PostHogClient) return;
  PostHogClient.capture({ distinctId: distinctId || "anonymous", event, properties });
};
