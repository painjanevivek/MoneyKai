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
  const { colors, isDark } = useTheme();
  const recentNotes = useNotesStore((s) => s.getRecentNotes(2));

  const handleViewAll = onViewAll ?? (() => router.push('/notes'));
  const handleNewNote = onNewNote ?? (() => router.push('/notes'));

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
            backgroundColor: index === 0 ? colors.primaryBg : colors.surface,
            borderRadius: BorderRadius.sm,
            padding: Spacing.md,
            marginBottom: index < recentNotes.length - 1 ? Spacing.sm : 0,
            borderWidth: 1,
            borderColor: index === 0 ? colors.border : colors.borderLight,
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
            {note.is_pinned && <MaterialCommunityIcons name="pin" size={14} color={colors.primary} />}
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
          backgroundColor: isDark ? colors.surface : 'transparent',
        }}
      >
        <MaterialCommunityIcons name="plus" size={16} color={colors.textPrimary} />
        <Text
          style={{
            fontSize: Typography.fontSize.sm,
            fontFamily: Typography.fontFamily.medium,
            color: colors.textPrimary,
          }}
        >
          New Note
        </Text>
      </TouchableOpacity>
    </Card>
  );
};

export default QuickNotes;
