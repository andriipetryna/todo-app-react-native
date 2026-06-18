import { Todo } from '@/db/schema';
import { PRIORITY_COLORS } from '@/lib/priority';
import { useTheme } from '@/lib/theme';
import { View, StyleSheet, Text } from 'react-native';

interface Props {
  todos: Todo[];
  maxDots?: number;
}

export function CalendarDayTodoDots({ todos, maxDots = 3 }: Props): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.dots}>
      {todos.slice(0, 3).map((t, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor:
                PRIORITY_COLORS[t.priority as keyof typeof PRIORITY_COLORS] ?? theme.primary,
            },
          ]}
        />
      ))}
      {todos.length > maxDots ? (
        <Text style={[styles.moreDots, { color: theme.textMuted }]}>+{todos.length - maxDots}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: { flexDirection: 'row', gap: 2, height: 6, alignItems: 'center' },
  dot: { width: 5, height: 5, borderRadius: 3 },
  moreDots: { fontSize: 8, lineHeight: 6 },
});
