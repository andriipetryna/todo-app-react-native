import React from 'react';
import { Pressable, StyleProp, StyleSheet, ViewStyle } from 'react-native';

import { useTheme } from '@/lib/theme';

interface FloatingButtonProps {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

export function FloatingButton({
  onPress,
  style,
  children,
  accessibilityLabel,
}: FloatingButtonProps): React.JSX.Element {
  const theme = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.base, { backgroundColor: theme.primary }, style]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
