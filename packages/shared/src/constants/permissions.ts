export const RESOURCES = [
  'requisition', 'candidate', 'application', 'interview',
  'evaluation', 'message', 'task', 'joining', 'report',
  'user', 'role', 'organization', 'approval-flow', 'audit-log',
  'document', 'template', 'evaluation-form', 'dashboard',
] as const;

export const ACTIONS = ['create', 'read', 'update', 'delete', 'export', 'approve'] as const;

export type Resource = typeof RESOURCES[number];
export type Action = typeof ACTIONS[number];
export type PermissionKey = `${Resource}:${Action}`;
