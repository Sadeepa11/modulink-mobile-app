// StoryRow — horizontal story circles at top of the feed (themed)

import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from './Avatar';
import { FontSize, Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';

interface Props {
  stories: any[];
  currentUserId: number;
  onStoryPress: (group: any) => void;
  onAddPress: () => void;
}

export function StoryRow({ stories, currentUserId, onStoryPress, onAddPress }: Props) {
  const { colors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* Add Story button */}
        <Pressable style={styles.item} onPress={onAddPress}>
          <View style={[styles.addCircle, { borderColor: colors.border, backgroundColor: colors.surfaceAlt }]}>
            <Text style={[styles.plus, { color: colors.primary }]}>+</Text>
          </View>
          <Text style={[styles.label, { color: colors.text }]}>Your Story</Text>
        </Pressable>

        {stories.map((group) => (
          <Pressable key={group.user.id} style={styles.item} onPress={() => onStoryPress(group)}>
            {/* Story ring — brand gradient colours */}
            <View style={[styles.ring, { borderColor: colors.accent }]}>
              <Avatar uri={group.user.avatar} name={group.user.name} size={58} />
            </View>
            <Text style={[styles.label, { color: colors.text }]} numberOfLines={1}>
              {group.user.id === currentUserId ? 'You' : group.user.username}
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { borderBottomWidth: 1, paddingVertical: Spacing.sm },
  scroll: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  item: { alignItems: 'center', gap: 6, width: 72 },
  addCircle: {
    width: 64, height: 64, borderRadius: 32,
    borderWidth: 2, justifyContent: 'center', alignItems: 'center',
  },
  plus: { fontSize: 28, lineHeight: 32 },
  ring: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 2.5,
    justifyContent: 'center', alignItems: 'center',
  },
  label: { fontSize: FontSize.xs, textAlign: 'center', width: 70 },
});
