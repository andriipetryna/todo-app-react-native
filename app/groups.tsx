import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import type { Group } from '@/db/schema';
import { DEFAULT_GROUP_COLORS, useTheme, type Theme } from '@/lib/theme';
import { useDataStore } from '@/store/dataStore';

export default function GroupsScreen(): React.JSX.Element {
  const theme = useTheme();
  const groups = useDataStore((s) => s.groups);
  const addGroup = useDataStore((s) => s.addGroup);

  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(DEFAULT_GROUP_COLORS[0] as string);

  function handleAdd(): void {
    const name = newName.trim();
    if (!name) return;
    addGroup({ name, color: newColor, sortOrder: groups.length });
    setNewName('');
    setNewColor(DEFAULT_GROUP_COLORS[0] as string);
  }

  return (
    <ScrollView
      style={{ backgroundColor: theme.background }}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={[styles.section, { color: theme.textMuted }]}>New group</Text>
      <TextInput
        value={newName}
        onChangeText={setNewName}
        placeholder="Group name"
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          { backgroundColor: theme.card, borderColor: theme.border, color: theme.text },
        ]}
        accessibilityLabel="New group name"
      />
      <ColorPicker selected={newColor} onSelect={setNewColor} />
      <Pressable
        onPress={handleAdd}
        disabled={!newName.trim()}
        style={[styles.addBtn, { backgroundColor: newName.trim() ? theme.primary : theme.border }]}
      >
        <Text style={{ color: theme.primaryText, fontWeight: '700' }}>Add group</Text>
      </Pressable>

      <Text style={[styles.section, { color: theme.textMuted, marginTop: 24 }]}>
        Your groups ({groups.length})
      </Text>
      {groups.length === 0 ? (
        <Text style={{ color: theme.textMuted }}>No groups yet.</Text>
      ) : (
        groups.map((g) => <GroupRow key={g.id} group={g} theme={theme} />)
      )}
    </ScrollView>
  );
}

function GroupRow({ group, theme }: { group: Group; theme: Theme }): React.JSX.Element {
  const editGroup = useDataStore((s) => s.editGroup);
  const removeGroup = useDataStore((s) => s.removeGroup);
  const [name, setName] = useState(group.name);

  function commitName(): void {
    const trimmed = name.trim();
    if (trimmed && trimmed !== group.name) editGroup(group.id, { name: trimmed });
    else setName(group.name);
  }

  function confirmDelete(): void {
    Alert.alert('Delete group', `Todos in “${group.name}” will become ungrouped (not deleted).`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => removeGroup(group.id) },
    ]);
  }

  return (
    <View style={[styles.groupRow, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <View style={styles.groupHeader}>
        <View style={[styles.dot, { backgroundColor: group.color }]} />
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={commitName}
          onSubmitEditing={commitName}
          style={[styles.groupName, { color: theme.text }]}
          accessibilityLabel={`Rename group ${group.name}`}
        />
        <Pressable onPress={confirmDelete} hitSlop={8}>
          <Text style={{ color: theme.danger, fontWeight: '600' }}>Delete</Text>
        </Pressable>
      </View>
      <ColorPicker selected={group.color} onSelect={(color) => editGroup(group.id, { color })} />
    </View>
  );
}

function ColorPicker({
  selected,
  onSelect,
}: {
  selected: string;
  onSelect: (color: string) => void;
}): React.JSX.Element {
  const theme = useTheme();
  return (
    <View style={styles.colors}>
      {DEFAULT_GROUP_COLORS.map((color) => (
        <Pressable
          key={color}
          onPress={() => onSelect(color)}
          accessibilityLabel={`Color ${color}`}
          style={[
            styles.swatch,
            {
              backgroundColor: color,
              borderColor: selected === color ? theme.text : 'transparent',
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 10 },
  section: { fontSize: 13, fontWeight: '700' },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  colors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginVertical: 4 },
  swatch: { width: 30, height: 30, borderRadius: 15, borderWidth: 3 },
  addBtn: { borderRadius: 10, paddingVertical: 12, alignItems: 'center', marginTop: 4 },
  groupRow: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  groupHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot: { width: 14, height: 14, borderRadius: 7 },
  groupName: { flex: 1, fontSize: 16, fontWeight: '500', paddingVertical: 2 },
});
