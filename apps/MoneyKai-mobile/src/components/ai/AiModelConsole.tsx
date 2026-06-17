import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { BorderRadius, Spacing, Typography } from '@/constants/theme';
import { useAiChat, useAiModelStatus } from '@/features/ai/hooks';
import type { AiConfiguredModelStatus, AiProviderStatus } from '@/features/ai/types';
import { useTheme } from '@/hooks/useTheme';

type ModelPreset = {
  id: string;
  label: string;
  detail: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
};

const MODEL_PRESETS: ModelPreset[] = [
  {
    id: 'deepseek/deepseek-v4-flash',
    label: 'DeepSeek V4 Flash',
    detail: 'Fast text',
    icon: 'flash-outline',
  },
  {
    id: 'moonshotai/kimi-k2.5',
    label: 'Kimi K2.5',
    detail: 'Vision ready',
    icon: 'image-search-outline',
  },
  {
    id: 'google/gemma-4-26b-a4b-it',
    label: 'Gemma 4 26B',
    detail: 'Multimodal',
    icon: 'google',
  },
];

const ROLE_LABELS: Record<AiConfiguredModelStatus['key'], string> = {
  text: 'Chat',
  vision: 'Attachments',
  file: 'Documents',
  reasoning: 'Portfolio',
  sms_parse: 'SMS parse',
};

interface AiModelConsoleProps {
  providerStatus?: AiProviderStatus | null;
  requiresSignIn?: boolean;
}

export function AiModelConsole({ providerStatus, requiresSignIn = false }: AiModelConsoleProps) {
  const { colors } = useTheme();
  const modelStatus = useAiModelStatus(!requiresSignIn);
  const chat = useAiChat();
  const [selectedModel, setSelectedModel] = React.useState(MODEL_PRESETS[0].id);
  const [prompt, setPrompt] = React.useState('Summarize three MoneyKai ways to reduce food delivery spend this week.');

  React.useEffect(() => {
    if (!providerStatus?.defaultTextModel) {
      return;
    }
    setSelectedModel(providerStatus.defaultTextModel);
  }, [providerStatus?.defaultTextModel]);

  const overrideEnabled = Boolean(providerStatus?.modelOverrideEnabled);
  const backendReady = Boolean(providerStatus?.enabled && providerStatus.configured);
  const canAsk = backendReady && !requiresSignIn && prompt.trim().length > 0 && !chat.loading;
  const activeModel = overrideEnabled ? selectedModel : providerStatus?.defaultTextModel;

  const handleAsk = async () => {
    const message = prompt.trim();
    if (!message) {
      return;
    }

    try {
      await chat.send({
        task: 'general_chat',
        model: overrideEnabled ? selectedModel : undefined,
        messages: [{ role: 'user', content: message }],
        context: {
          surface: 'mobile_ai_model_console',
          requestedModel: selectedModel,
          modelOverrideEnabled: overrideEnabled,
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
          AI Model Console
        </Text>
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          {backendReady
            ? `OpenRouter active | ${overrideEnabled ? 'Model picker on' : 'Backend default only'}`
            : 'Backend AI is not ready'}
        </Text>
      </View>

      <View style={{ gap: Spacing.sm }}>
        {MODEL_PRESETS.map((preset) => {
          const active = selectedModel === preset.id;
          return (
            <TouchableOpacity
              key={preset.id}
              activeOpacity={0.85}
              onPress={() => setSelectedModel(preset.id)}
              disabled={!overrideEnabled}
              style={{
                borderRadius: BorderRadius.sm,
                borderWidth: 1,
                borderColor: active ? colors.primary : colors.borderLight,
                backgroundColor: active ? colors.primaryBg : colors.surface,
                opacity: overrideEnabled ? 1 : 0.72,
                padding: Spacing.md,
                gap: Spacing.xs,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.sm }}>
                <MaterialCommunityIcons name={preset.icon} size={18} color={active ? colors.primary : colors.textSecondary} />
                <Text style={{ flex: 1, fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
                  {preset.label}
                </Text>
              </View>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
                {preset.detail}
              </Text>
              <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textTertiary }}>
                {preset.id}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ gap: Spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: Spacing.sm }}>
          <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
            Configured routes
          </Text>
          <Button title="Refresh" icon="refresh" size="sm" variant="outline" onPress={() => void modelStatus.refresh()} loading={modelStatus.loading} />
        </View>
        {modelStatus.data?.models.map((model) => (
          <ModelStatusRow key={model.key} model={model} />
        ))}
        {modelStatus.error ? (
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.error }}>
            {modelStatus.error}
          </Text>
        ) : modelStatus.data?.discoveryError ? (
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.warning }}>
            {modelStatus.data.discoveryError}
          </Text>
        ) : null}
      </View>

      <Input
        label={`Ask ${overrideEnabled ? selectedModelLabel(selectedModel) : 'default AI'}`}
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
      {activeModel ? (
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
          Active model: {activeModel}
        </Text>
      ) : null}
      {requiresSignIn ? (
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          Sign in before sending a model test.
        </Text>
      ) : !backendReady ? (
        <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
          Configure the backend AI provider before sending a model test.
        </Text>
      ) : null}

      {chat.data ? (
        <View style={{ borderRadius: BorderRadius.sm, backgroundColor: colors.surface, padding: Spacing.md, gap: Spacing.xs }}>
          <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
            {chat.data.model} | {chat.data.requestId}
          </Text>
          <Text style={{ fontSize: Typography.fontSize.sm, lineHeight: 20, color: colors.textPrimary }}>
            {chat.data.message}
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

function ModelStatusRow({ model }: { model: AiConfiguredModelStatus }) {
  const { colors } = useTheme();
  const statusColor = model.available ? colors.success : colors.warning;
  const statusIcon = model.available ? 'check-circle-outline' : 'alert-circle-outline';
  const modalities = [...model.inputModalities, ...model.outputModalities].length
    ? `${model.inputModalities.join('+') || 'none'} -> ${model.outputModalities.join('+') || 'none'}`
    : 'No registry match';

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.sm,
        borderRadius: BorderRadius.sm,
        backgroundColor: colors.surface,
        padding: Spacing.md,
      }}
    >
      <MaterialCommunityIcons name={statusIcon} size={18} color={statusColor} style={{ marginTop: 1 }} />
      <View style={{ flex: 1, gap: 3 }}>
        <Text style={{ fontSize: Typography.fontSize.sm, fontFamily: Typography.fontFamily.semiBold, color: colors.textPrimary }}>
          {ROLE_LABELS[model.key]}: {model.model ?? 'Not configured'}
        </Text>
        <Text style={{ fontSize: Typography.fontSize.xs, color: colors.textSecondary }}>
          {modalities}
        </Text>
        {model.reason ? (
          <Text style={{ fontSize: Typography.fontSize.xs, lineHeight: 18, color: colors.textSecondary }}>
            {model.reason}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function selectedModelLabel(modelId: string): string {
  return MODEL_PRESETS.find((preset) => preset.id === modelId)?.label ?? modelId;
}
