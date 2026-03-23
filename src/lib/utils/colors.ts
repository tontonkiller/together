// 10 member colors for group calendar (auto-assigned)
export const MEMBER_COLORS = [
  '#1976D2', // Blue
  '#D32F2F', // Red
  '#388E3C', // Green
  '#7B1FA2', // Purple
  '#F57C00', // Orange
  '#00838F', // Teal
  '#C2185B', // Pink
  '#455A64', // Blue Grey
  '#AFB42B', // Lime
  '#5D4037', // Brown
] as const;

export function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}
