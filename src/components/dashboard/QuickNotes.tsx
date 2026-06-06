import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { Card } from '../ui/Card';
import { useNotesStore } from '../../stores/useNotesStore';
import { formatRelativeDate } from '../../utils/dateUtils';
import { Typography, Spacing, BorderRadius } from '../../constants/theme';

export const QuickNotes: React.FC<{ onViewAll?: () => void; onNewNote?: () => void }> = ({
  onViewAll,
  onNewNote,
}) => {
  const { colors } = useTheme();
  const recentNotes = useNotesStore((s) => s.getRecentNotes(2));

  const handleViewAll = onViewAll ?? (() => router.push('/(tabs)/notes'));
  const handleNewNote = onNewNote ?? (() => router.push('/(tabs)/notes'));

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.md }}>
        <Text
          style={{
            fontSize: Typography.fontSize.md,
            fontFamily: Typography.fontFamily.semiBold,
            color: colors.textPrimary,
          }}
        >
          Quick Notes
        </Text>
        <TouchableOpacity onPress={handleViewAll}>
          <Text
            style={{
              fontSize: Typography.fontSize.sm,
              fontFamily: Typography.fontFamily.medium,
              color: colors.primary,
            }}
          >
            View All
          </Text>
        </TouchableOpacity>
      </View>

      {recentNotes.map((note, index) => (
        <TouchableOpacity
          key={note.id}
          onPress={handleViewAll}
          style={{
            backgroundColor: index === 0 ? '#FEF9E7' : colors.surface,
            borderRadius: BorderRadius.sm,
            padding: Spacing.md,
            marginBottom: index < recentNotes.length - 1 ? Spacing.sm : 0,
            borderWidth: 1,
            borderColor: index === 0 ? '#F4A26130' : colors.borderLight,
          }}
        >
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: Typography.fontSize.sm,
                  fontFamily: Typography.fontFamily.semiBold,
                  color: colors.textPrimary,
                  marginBottom: 2,
                }}
              >
                {note.title}
              </Text>
              <Text
                style={{
                  fontSize: Typography.fontSize.xs,
                  fontFamily: Typography.fontFamily.regular,
                  color: colors.textSecondary,
                  lineHeight: 16,
                }}
                numberOfLines={2}
              >
                {note.content}
              </Text>
            </View>
            {note.is_pinned && <MaterialCommunityIcons name="pin" size={14} color={colors.accent} />}
          </View>
          <Text
            style={{
              fontSize: 10,
              fontFamily: Typography.fontFamily.regular,
              color: colors.textTertiary,
              marginTop: 6,
            }}
          >
            {formatRelativeDate(note.updated_at)}
          </Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
        onPress={handleNewNote}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: Spacing.md,
          paddingVertical: Spacing.sm,
          borderRadius: BorderRadius.sm,
          borderWidth: 1,
          borderColor: colors.border,
          borderStyle: 'dashed',
          gap: 6,
        }}
      >
        <MaterialCommunityIcons name="plus" size={16} color={colors.textSecondary} />
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.medium,
            color: colors.textSecondary,
          }}
        >
          New Note
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

export default QuickNotes;

