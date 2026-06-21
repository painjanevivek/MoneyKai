import React from 'react';
import { Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { formatAiResponseText, withPlainTextAiStyle } from '@/features/ai/responseText';
import { useAiChat } from '@/features/ai/hooks';
import type { AiProviderStatus } from '@/features/ai/types';
import { useTheme } from '@/hooks/useTheme';

interface AiModelConsoleProps {
  providerStatus?: AiProviderStatus | null;
  requiresSignIn?: boolean;
}

export function AiModelConsole({ providerStatus, requiresSignIn = false }: AiModelConsoleProps) {
  const { colors } = useTheme();
  const chat = useAiChat();
  const [prompt, setPrompt] = React.useState('Summarize three MoneyKai ways to reduce food delivery spend this week.');

  const backendReady = Boolean(providerStatus?.enabled && providerStatus.configured);
  const canAsk = backendReady && !requiresSignIn && prompt.trim().length > 0 && !chat.loading;

  const handleAsk = async () => {
    const message = prompt.trim();
    if (!message) {
      return;
    }

    try {
      await chat.send({
        task: 'general_chat',
        messages: [{ role: 'user', content: withPlainTextAiStyle(message) }],
        context: {
          surface: 'mobile_ai_model_console',
        },
      });
    } catch {
      // The hook stores the user-facing error state.
    }
  };

  return (
    <Card style={{ gap: Spacing.md }}>
      <View style={{ gap: Spacing.xs }}>
        <Text style={{ fontSize: Typography.fontSize.base, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          Ask MoneyKai AI
        </Text>
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          Ask a practical question about spending, budgets, records, or reports.
        </Text>
      </View>

      <Input
        placeholder="Ask about spending, budgets, records, or reports"
        value={prompt}
        onChangeText={setPrompt}
        multiline
        numberOfLines={3}
        autoCapitalize="sentences"
      />

      <Button
        title="Ask AI"
        icon="send"
        loading={chat.loading}
        disabled={!canAsk}
        onPress={handleAsk}
      />

      {requiresSignIn ? (
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          Sign in before asking MoneyKai AI.
        </Text>
      ) : !backendReady ? (
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          Connect backend access before asking MoneyKai AI.
        </Text>
      ) : null}

      {chat.data ? (
        <View style={{ borderRadius: BorderRadius.sm, backgroundColor: colors.surface, padding: Spacing.md, gap: Spacing.xs }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            Response
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textPrimary }}>
            {formatAiResponseText(chat.data.message)}
          </Text>
        </View>
      ) : null}

      {chat.error ? (
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.error }}>
          {chat.error}
        </Text>
      ) : null}
    </Card>
  );
}
