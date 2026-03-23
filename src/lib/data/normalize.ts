interface RawGroupMember {
  group_id: string;
  role: string;
  groups:
    | { id: string; name: string; description: string | null }
    | { id: string; name: string; description: string | null }[]
    | null;
}

export interface NormalizedGroupMember {
  group_id: string;
  role: string;
  groups: { id: string; name: string; description: string | null } | null;
}

/**
 * Supabase JS types many-to-one joins as arrays, but returns objects at runtime.
 * This normalizes both shapes to a single object (or null).
 */
export function normalizeGroupMembers(
  groups: RawGroupMember[]
): NormalizedGroupMember[] {
  return groups.map((gm) => ({
    group_id: gm.group_id,
    role: gm.role,
    groups: Array.isArray(gm.groups) ? gm.groups[0] ?? null : gm.groups,
  }));
}
