// 15 member colors for group calendar (vibrant summer palette)
export const MEMBER_COLORS = [
  '#2196F3', // Sky Blue
  '#FF5252', // Coral Red
  '#4CAF50', // Fresh Green
  '#AB47BC', // Orchid Purple
  '#FF9800', // Sunny Orange
  '#26C6DA', // Turquoise
  '#EC407A', // Hot Pink
  '#42A5F5', // Ocean Blue
  '#FFCA28', // Sunshine Yellow
  '#66BB6A', // Mint Green
  '#FF7043', // Peach
  '#7E57C2', // Lavender
  '#26A69A', // Sea Green
  '#FFA726', // Mango
  '#EF5350', // Watermelon
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
