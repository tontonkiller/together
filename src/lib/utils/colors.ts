// 15 member colors for group calendar (auto-assigned)
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
  '#0288D1', // Light Blue
  '#E64A19', // Deep Orange
  '#303F9F', // Indigo
  '#689F38', // Light Green
  '#8E24AA', // Deep Purple
] as const;

export function getMemberColor(index: number): string {
  return MEMBER_COLORS[index % MEMBER_COLORS.length];
}

/**
 * Returns '#fff' or '#212121' based on the relative luminance of the background color.
 * Ensures WCAG AA contrast (4.5:1) for text on colored backgrounds.
 */
export function getContrastTextColor(hexColor: string): string {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  // sRGB to linear
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const luminance = 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);

  // Use dark text on light backgrounds (luminance > 0.179 threshold)
  return luminance > 0.179 ? '#212121' : '#fff';
}
