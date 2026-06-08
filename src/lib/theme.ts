import { useColorScheme } from 'react-native';

/**
 * Minimal theme. Light/dark palettes selected from the OS color scheme. Kept tiny on
 * purpose — this is a local single-user app, not a design system.
 */

export interface Theme {
  dark: boolean;
  background: string;
  card: string;
  cardAlt: string;
  text: string;
  textMuted: string;
  border: string;
  primary: string;
  primaryText: string;
  danger: string;
  overdue: string;
  done: string;
}

const light: Theme = {
  dark: false,
  background: '#f5f6f8',
  card: '#ffffff',
  cardAlt: '#eef1f5',
  text: '#0b1117',
  textMuted: '#57606a',
  border: '#e1e4e8',
  primary: '#1f6feb',
  primaryText: '#ffffff',
  danger: '#cf222e',
  overdue: '#cf222e',
  done: '#8c959f',
};

const dark: Theme = {
  dark: true,
  background: '#0d1117',
  card: '#161b22',
  cardAlt: '#21262d',
  text: '#e6edf3',
  textMuted: '#8b949e',
  border: '#30363d',
  primary: '#388bfd',
  primaryText: '#ffffff',
  danger: '#f85149',
  overdue: '#f85149',
  done: '#6e7681',
};

export const DEFAULT_GROUP_COLORS = [
  '#1f6feb',
  '#cf222e',
  '#1a7f37',
  '#9a6700',
  '#8250df',
  '#bf3989',
  '#0969da',
  '#57606a',
];

export function useTheme(): Theme {
  const scheme = useColorScheme();
  return scheme === 'dark' ? dark : light;
}
