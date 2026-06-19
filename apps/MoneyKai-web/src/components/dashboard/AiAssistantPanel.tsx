import React, { useMemo, useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Card } from '@/components/ui/Card';
import { Spacing, Typography, BorderRadius } from '@/constants/theme';
import { useAiStreamingChat } from '@/features/ai/hooks';
import { formatAiResponseText, withPlainTextAiStyle } from '@/features/ai/responseText';
import type { AiChatMessage } from '@/features/ai/types';
import { useTheme } from '@/hooks/useTheme';
import { useBudgetStore } from '@/stores/useBudgetStore';
import { useTransactionStore } from '@/stores/useTransactionStore';

export const AiAssistantPanel: React.FC = () => {
  const { colors } = useTheme();
  const totalSpent = useTransactionStore((s) => s.getTotalSpent());
  const totalIncome = useTransactionStore((s) => s.getTotalIncome());
  const categoryTotals = useTransactionStore((s) => s.getCategoryTotals());
  const { settings } = useBudgetStore();
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const { send, cancel, loading, error, partialMessage, aborted } = useAiStreamingChat();

  const context = useMemo(
    () => ({
      surface: 'dashboard_assistant',
      month: new Date().toISOString().slice(0, 7),
      currency: settings.currency || 'INR',
      monthlyAllowance: settings.monthly_allowance,
      totalSpent,
      totalIncome,
      topCategories: categoryTotals.slice(0, 5).map((item) => ({
        category: item.category,
        total: item.total,
        percentage: item.percentage,
      })),
    }),
    [categoryTotals, settings.currency, settings.monthly_allowance, totalIncome, totalSpent],
  );

  const submit = async () => {
    const content = draft.trim();
    if (!content || loading) {
      return;
    }

    const nextMessages = [...messages, { role: 'user' as const, content }];
    setMessages(nextMessages);
    setDraft('');

    try {
      const response = await send({
        task: 'general_chat',
        messages: nextMessages.slice(-8).map((message, index, recentMessages) => (
          index === recentMessages.length - 1 && message.role === 'user'
            ? { ...message, content: withPlainTextAiStyle(message.content) }
            : message
        )),
        context,
      });
      setMessages((current) => [...current, { role: 'assistant', content: response.message }]);
    } catch {
      // The hook already exposes a user-safe error message for inline rendering.
    }
  };

  const hasConversation = messages.length > 0 || partialMessage.length > 0;

  return (
    <Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md }}>
        <View
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: `${colors.primary}15`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <MaterialCommunityIcons name="chat-processing-outline" size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: Typography.fontSize.md, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            AI Assistant
          </Text>
          <Text style={{ marginTop: 2, fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            Stream a grounded answer from your current MoneyKai context.
          </Text>
        </View>
      </View>

      {hasConversation ? (
        <View style={{ gap: Spacing.sm, marginBottom: Spacing.md }}>
          {messages.slice(-6).map((message, index) => {
            const isUser = message.role === 'user';
            return (
              <View
                key={`${message.role}-${index}-${message.content.slice(0, 24)}`}
                style={{
                  alignSelf: isUser ? 'flex-end' : 'stretch',
                  maxWidth: '92%',
                  borderRadius: BorderRadius.md,
                  paddingHorizontal: Spacing.md,
                  paddingVertical: Spacing.sm,
                  backgroundColor: isUser ? colors.primary : colors.surface,
                  borderWidth: isUser ? 0 : 1,
                  borderColor: colors.borderLight,
                }}
              >
                <Text
                  style={{
                    fontSize: Typography.fontSize.sm,
                    lineHeight: 20,
                    color: isUser ? colors.textInverse : colors.textPrimary,
                  }}
                >
                  {isUser ? message.content : formatAiResponseText(message.content)}
                </Text>
              </View>
            );
          })}

          {loading ? (
            <View
              style={{
                maxWidth: '92%',
                borderRadius: BorderRadius.md,
                paddingHorizontal: Spacing.md,
                paddingVertical: Spacing.sm,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.borderLight,
              }}
            >
              <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textPrimary }}>
                {partialMessage ? formatAiResponseText(partialMessage) : 'Thinking...'}
              </Text>
            </View>
          ) : null}
        </View>
      ) : (
        <Text style={{ marginBottom: Spacing.md, fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textSecondary }}>
          Ask about spending changes, budget trade-offs, or what to review first this month.
        </Text>
      )}

      <View
        style={{
          borderRadius: BorderRadius.lg,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          padding: Spacing.sm,
        }}
      >
        <TextInput
          value={draft}
          onChangeText={setDraft}
          placeholder="Ask MoneyKai about this month..."
          placeholderTextColor={colors.textTertiary}
          multiline
          style={{
            minHeight: 92,
            color: colors.textPrimary,
            fontSize: Typography.fontSize.sm,
            lineHeight: 20,
            textAlignVertical: 'top',
          }}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            Answers are advisory and do not change records automatically.
          </Text>
          <TouchableOpacity
            onPress={loading ? cancel : submit}
            disabled={!loading && !draft.trim()}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              borderRadius: BorderRadius.full,
              paddingHorizontal: Spacing.md,
              paddingVertical: 10,
              backgroundColor: loading ? colors.accent : !draft.trim() ? colors.borderLight : colors.primary,
            }}
          >
            <MaterialCommunityIcons
              name={loading ? 'stop-circle-outline' : 'send-outline'}
              size={16}
              color={loading ? colors.textInverse : !draft.trim() ? colors.textSecondary : colors.textInverse}
            />
            <Text
              style={{
                fontSize: Typography.fontSize.xs,
                fontFamily: Typography.fontFamily.semiBold,
                color: loading ? colors.textInverse : !draft.trim() ? colors.textSecondary : colors.textInverse,
              }}
            >
              {loading ? 'Stop' : 'Ask'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          {error}
        </Text>
      ) : aborted ? (
        <Text style={{ marginTop: Spacing.sm, fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          Streaming stopped. You can revise the question or ask again.
        </Text>
      ) : null}
    </Card>
  );
};

export default AiAssistantPanel;
