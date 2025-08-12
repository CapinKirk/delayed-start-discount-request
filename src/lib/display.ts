export type MessageRole = 'user' | 'ai' | 'agent' | 'system';

export function resolveDisplayName(role: MessageRole, maskRoles: boolean, unifiedDisplayName: string): string {
  if (role === 'user') return 'You';
  if (maskRoles) return unifiedDisplayName || 'Support';
  if (role === 'agent') return 'Support';
  if (role === 'ai') return 'Assistant';
  return 'System';
}


