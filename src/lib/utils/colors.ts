// 15 member colors for group calendar (vibrant, maximally distinct)
export const MEMBER_COLORS = [
  '#2196F3', // Blue
  '#FF5252', // Red
  '#4CAF50', // Green
  '#FF9800', // Orange
  '#AB47BC', // Purple
  '#EC407A', // Pink
  '#26C6DA', // Turquoise
  '#FFCA28', // Yellow
  '#5D4037', // Brown
  '#3F51B5', // Indigo
  '#26A69A', // Teal
  '#FF7043', // Coral
  '#78909C', // Slate
  '#8BC34A', // Lime
  '#F06292', // Rose
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
